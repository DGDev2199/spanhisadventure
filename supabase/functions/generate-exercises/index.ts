import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type ExerciseType = 'flashcard' | 'conjugation' | 'vocabulary' | 'sentence_order' | 'multiple_choice' | 'fill_gaps' | 'reading';

interface GenerateRequest {
  exercise_type?: ExerciseType;
  topic: string;
  vocabulary?: string[];
  count?: number;
  level: string;
  // For recommended pack generation
  generate_pack?: boolean;
  student_id?: string;
  week_number?: number;
  class_topics?: string;
}

// Level-specific content guidelines
const levelGuidelines: Record<string, string> = {
  'A1': 'Use only basic vocabulary (100-300 most common words). Present tense only. Very short, simple sentences (3-5 words). Topics: greetings, numbers, colors, family, food basics.',
  'A2': 'Use everyday vocabulary (500-800 words). Present, simple past, near future. Short sentences (5-8 words). Topics: daily routines, shopping, weather, hobbies, travel basics.',
  'B1': 'Use intermediate vocabulary (1500-2000 words). Include all indicative tenses, basic subjunctive. Medium sentences (8-12 words). Topics: work, relationships, news, opinions, culture.',
  'B2': 'Use advanced vocabulary (3000-4000 words). All tenses including subjunctive, conditional. Complex sentences (12-18 words). Topics: abstract concepts, debates, literature, professional contexts.',
  'C1': 'Use sophisticated vocabulary (5000+ words). All grammatical structures, idiomatic expressions. Complex sentences with subordinate clauses. Topics: specialized fields, nuanced arguments, academic content.',
  'C2': 'Use native-level vocabulary including regional variations, slang, literary expressions. All registers from colloquial to academic. Topics: literature, philosophy, specialized professional content, humor, cultural subtleties.',
};

function getSystemPromptForType(exerciseType: ExerciseType, level: string): string {
  const levelGuide = levelGuidelines[level] || levelGuidelines['A1'];
  
  const baseInstructions = `You are an expert Spanish language teacher. IMPORTANT: ${levelGuide}\n\n`;
  
  switch (exerciseType) {
    case 'flashcard':
      return baseInstructions + `Create flashcard exercises. Each flashcard should have:
- front: A description of an image or a word/phrase in English
- back: The Spanish translation or answer
- hint: An optional hint to help the student

Always respond in valid JSON format matching this structure:
{
  "cards": [
    { "front": "A house with a red roof", "back": "La casa", "hint": "Lugar donde vives" }
  ]
}`;

    case 'conjugation':
      return baseInstructions + `Create verb conjugation exercises. Each exercise should have:
- verb: The infinitive form of the verb
- tense: The tense to conjugate (appropriate for level ${level})
- subject: The subject pronoun (yo, tú, él/ella, nosotros, vosotros, ellos/ellas)
- correct_answer: The correctly conjugated verb
- options: An array of 4 options including the correct answer

Always respond in valid JSON format matching this structure:
{
  "exercises": [
    { "verb": "hablar", "tense": "pretérito indefinido", "subject": "yo", "correct_answer": "hablé", "options": ["hablé", "hablaba", "hablaré", "hablo"] }
  ]
}`;

    case 'vocabulary':
      return baseInstructions + `Create vocabulary exercises. Each exercise should have:
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

    case 'sentence_order':
      return baseInstructions + `Create sentence ordering exercises. Each exercise should have:
- scrambled_words: An array of words in random order
- correct_sentence: The correctly ordered sentence
- hint: An optional hint about the sentence structure

Always respond in valid JSON format matching this structure:
{
  "exercises": [
    { "scrambled_words": ["voy", "a", "yo", "escuela", "la"], "correct_sentence": "Yo voy a la escuela", "hint": "Comienza con el sujeto" }
  ]
}`;

    case 'multiple_choice':
      return baseInstructions + `Create multiple choice questions about Spanish language or culture. Each exercise should have:
- question: A clear question in Spanish
- options: An array of 4 possible answers
- correct_answer: The correct answer (must be in options)
- explanation: A brief explanation of why the answer is correct

Always respond in valid JSON format matching this structure:
{
  "exercises": [
    { "question": "¿Cuál es el pretérito de 'ir' para 'yo'?", "options": ["fui", "iba", "iré", "voy"], "correct_answer": "fui", "explanation": "El verbo 'ir' es irregular en pretérito indefinido" }
  ]
}`;

    case 'fill_gaps':
      return baseInstructions + `Create fill-in-the-gap exercises. Each exercise should have:
- sentence_with_gap: A sentence with ____ marking the gap
- options: An array of 4 possible words to fill the gap
- correct_answer: The correct word
- context: Additional context about the sentence

Always respond in valid JSON format matching this structure:
{
  "exercises": [
    { "sentence_with_gap": "Ayer ____ al cine con mis amigos.", "options": ["fui", "voy", "iré", "iba"], "correct_answer": "fui", "context": "Acción completada en el pasado" }
  ]
}`;

    case 'reading':
      return baseInstructions + `Create reading comprehension exercises. Each exercise should have:
- title: A title for the reading passage
- text: A short reading passage in Spanish (50-150 words depending on level)
- questions: An array of 3-5 comprehension questions, each with:
  - question: The question text
  - options: 4 possible answers
  - correct_answer: The correct answer

Always respond in valid JSON format matching this structure:
{
  "exercises": [
    {
      "title": "Un día en el parque",
      "text": "María fue al parque con su perro...",
      "questions": [
        { "question": "¿Con quién fue María al parque?", "options": ["Con su perro", "Con su amiga", "Sola", "Con su familia"], "correct_answer": "Con su perro" }
      ]
    }
  ]
}`;

    default:
      return baseInstructions;
  }
}

function getUserPromptForType(exerciseType: ExerciseType, topic: string, vocabulary: string[], count: number, level: string): string {
  const vocabInstructions = vocabulary.length > 0 
    ? `Include these vocabulary words: ${vocabulary.join(', ')}.` 
    : 'Use vocabulary appropriate for this topic and level.';

  switch (exerciseType) {
    case 'flashcard':
      return `Create ${count} flashcards for Spanish level ${level} about the topic: "${topic}".
${vocabInstructions}
Make the flashcards progressively more challenging. Use everyday situations and contexts relevant to level ${level}.`;

    case 'conjugation':
      return `Create ${count} conjugation exercises for Spanish level ${level} about: "${topic}".
${vocabInstructions}
Use tenses appropriate for level ${level}. Vary the subjects and make sure options are plausible but distinguishable.`;

    case 'vocabulary':
      return `Create ${count} vocabulary exercises for Spanish level ${level} about: "${topic}".
${vocabInstructions}
Make sentences natural and contextually relevant for level ${level}.`;

    case 'sentence_order':
      return `Create ${count} sentence ordering exercises for Spanish level ${level} about: "${topic}".
${vocabInstructions}
Vary sentence structures and length appropriate for level ${level}. Make the scrambled versions challenging but solvable.`;

    case 'multiple_choice':
      return `Create ${count} multiple choice questions for Spanish level ${level} about: "${topic}".
${vocabInstructions}
Include grammar, vocabulary, and cultural questions. Make distractors plausible but clearly wrong.`;

    case 'fill_gaps':
      return `Create ${count} fill-in-the-gap exercises for Spanish level ${level} about: "${topic}".
${vocabInstructions}
Focus on vocabulary and grammar points relevant to level ${level}. Provide helpful context.`;

    case 'reading':
      return `Create ${count} reading comprehension exercise(s) for Spanish level ${level} about: "${topic}".
${vocabInstructions}
Make texts appropriate length for level ${level}. Include varied question types testing comprehension, inference, and vocabulary.`;

    default:
      return `Create ${count} exercises for Spanish level ${level} about: "${topic}".
${vocabInstructions}`;
  }
}

async function generateExercises(
  exerciseType: ExerciseType,
  topic: string,
  vocabulary: string[],
  count: number,
  level: string,
  apiKey: string
): Promise<any> {
  const systemPrompt = getSystemPromptForType(exerciseType, level);
  const userPrompt = getUserPromptForType(exerciseType, topic, vocabulary, count, level);

  console.log(`Generating ${count} ${exerciseType} exercises for level ${level}, topic: ${topic}`);

  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-3-flash-preview',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 6000,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('AI Gateway error:', errorText);
    throw new Error(`AI Gateway error: ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  
  if (!content) {
    throw new Error('No content in AI response');
  }

  // Parse the JSON from the response
  try {
    const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || content.match(/```\s*([\s\S]*?)\s*```/);
    const jsonString = jsonMatch ? jsonMatch[1] : content;
    return JSON.parse(jsonString.trim());
  } catch (parseError) {
    console.error('Failed to parse AI response:', content);
    throw new Error('Failed to parse exercise content from AI');
  }
}

async function generateRecommendedPack(
  topic: string,
  vocabulary: string[],
  level: string,
  weekNumber: number,
  apiKey: string
): Promise<any> {
  // Generate a variety of exercise types for a complete pack
  const exerciseTypesToGenerate: { type: ExerciseType; count: number }[] = [
    { type: 'flashcard', count: 5 },
    { type: 'vocabulary', count: 4 },
    { type: 'conjugation', count: 4 },
    { type: 'sentence_order', count: 3 },
    { type: 'fill_gaps', count: 3 },
    { type: 'multiple_choice', count: 3 },
  ];

  // For higher levels, add reading comprehension
  if (['B1', 'B2', 'C1', 'C2'].includes(level)) {
    exerciseTypesToGenerate.push({ type: 'reading', count: 1 });
  }

  console.log(`Generating recommended pack for week ${weekNumber}, level ${level}, topic: ${topic}`);

  const exercises: any[] = [];
  
  // Generate exercises in batches to avoid overwhelming the API
  for (const { type, count } of exerciseTypesToGenerate) {
    try {
      const content = await generateExercises(type, topic, vocabulary, count, level, apiKey);
      exercises.push({
        type,
        content,
      });
    } catch (error) {
      console.error(`Error generating ${type} exercises:`, error);
      // Continue with other types even if one fails
    }
  }

  const totalExercises = exercises.reduce((sum, ex) => {
    if (ex.content.cards) return sum + ex.content.cards.length;
    if (ex.content.exercises) return sum + ex.content.exercises.length;
    return sum;
  }, 0);

  return {
    pack_name: `Pack Semana ${weekNumber} - ${level}`,
    exercises,
    total_exercises: totalExercises,
    estimated_time_minutes: Math.ceil(totalExercises * 1.5),
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestData: GenerateRequest = await req.json();
    const { 
      exercise_type, 
      topic, 
      vocabulary = [], 
      count = 10, 
      level = 'A1',
      generate_pack = false,
      week_number = 1,
      class_topics,
    } = requestData;
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Determine the topic to use
    const effectiveTopic = class_topics || topic || 'Vocabulario general';

    // Generate recommended pack if requested
    if (generate_pack) {
      console.log('Generating recommended pack...');
      const pack = await generateRecommendedPack(effectiveTopic, vocabulary, level, week_number, LOVABLE_API_KEY);
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          pack,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate single exercise type
    if (!exercise_type) {
      throw new Error('exercise_type is required when not generating a pack');
    }

    const exercises = await generateExercises(exercise_type, effectiveTopic, vocabulary, count, level, LOVABLE_API_KEY);

    console.log(`Successfully generated ${exercise_type} exercises`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        content: exercises,
        exercise_type,
        topic: effectiveTopic,
        level
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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
