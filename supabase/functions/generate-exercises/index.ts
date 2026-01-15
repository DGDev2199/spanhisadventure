import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GenerateRequest {
  exercise_type: 'flashcard' | 'conjugation' | 'vocabulary';
  topic: string;
  vocabulary?: string[];
  count: number;
  level: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { exercise_type, topic, vocabulary = [], count = 10, level = 'A1' }: GenerateRequest = await req.json();
    
    console.log(`Generating ${count} ${exercise_type} exercises for topic: ${topic}, level: ${level}`);

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    let systemPrompt = '';
    let userPrompt = '';

    switch (exercise_type) {
      case 'flashcard':
        systemPrompt = `You are a Spanish language teacher creating flashcard exercises. Generate flashcards that help students learn vocabulary and concepts. Each flashcard should have:
- front: A description of an image or a word/phrase in English
- back: The Spanish translation or answer
- hint: An optional hint to help the student

Always respond in valid JSON format matching this structure:
{
  "cards": [
    { "front": "A house with a red roof", "back": "La casa", "hint": "Lugar donde vives" }
  ]
}`;
        userPrompt = `Create ${count} flashcards for Spanish level ${level} about the topic: "${topic}".
${vocabulary.length > 0 ? `Include these vocabulary words: ${vocabulary.join(', ')}` : ''}
Make the flashcards progressively more challenging. Use everyday situations and contexts.`;
        break;

      case 'conjugation':
        systemPrompt = `You are a Spanish language teacher creating verb conjugation exercises. Generate exercises that test verb conjugation knowledge. Each exercise should have:
- verb: The infinitive form of the verb
- tense: The tense to conjugate (matching the topic)
- subject: The subject pronoun (yo, tú, él/ella, nosotros, vosotros, ellos/ellas)
- correct_answer: The correctly conjugated verb
- options: An array of 4 options including the correct answer

Always respond in valid JSON format matching this structure:
{
  "exercises": [
    { "verb": "hablar", "tense": "pretérito indefinido", "subject": "yo", "correct_answer": "hablé", "options": ["hablé", "hablaba", "hablaré", "hablo"] }
  ]
}`;
        userPrompt = `Create ${count} conjugation exercises for Spanish level ${level} about: "${topic}".
${vocabulary.length > 0 ? `Use these verbs if possible: ${vocabulary.join(', ')}` : 'Use common verbs appropriate for this level.'}
Vary the subjects and make sure options are plausible but distinguishable.`;
        break;

      case 'vocabulary':
        systemPrompt = `You are a Spanish language teacher creating vocabulary exercises. Generate exercises that help students learn and practice vocabulary. Each exercise should have:
- word: The Spanish word to learn
- definition: A clear definition in Spanish (simple for lower levels)
- sentence_blank: A sentence with a blank where the word should go
- correct_answer: The word that fills the blank
- context_hint: A hint about the context

Always respond in valid JSON format matching this structure:
{
  "exercises": [
    { "word": "biblioteca", "definition": "Lugar donde se guardan y prestan libros", "sentence_blank": "Voy a la ____ a estudiar.", "correct_answer": "biblioteca", "context_hint": "Un edificio público" }
  ]
}`;
        userPrompt = `Create ${count} vocabulary exercises for Spanish level ${level} about: "${topic}".
${vocabulary.length > 0 ? `Include these words: ${vocabulary.join(', ')}` : 'Use vocabulary appropriate for this topic and level.'}
Make sentences natural and contextually relevant.`;
        break;
    }

    console.log('Calling Lovable AI Gateway...');
    
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 4000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', errorText);
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    console.log('AI response received');
    
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error('No content in AI response');
    }

    // Parse the JSON from the response
    let exercises;
    try {
      // Try to extract JSON from the response (it might be wrapped in markdown code blocks)
      const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || content.match(/```\s*([\s\S]*?)\s*```/);
      const jsonString = jsonMatch ? jsonMatch[1] : content;
      exercises = JSON.parse(jsonString.trim());
    } catch (parseError) {
      console.error('Failed to parse AI response:', content);
      throw new Error('Failed to parse exercise content from AI');
    }

    console.log(`Successfully generated ${exercise_type} exercises`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        content: exercises,
        exercise_type,
        topic,
        level
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error: unknown) {
    console.error('Error generating exercises:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: errorMessage 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
