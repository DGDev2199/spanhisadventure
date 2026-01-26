import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type ExerciseType = 'flashcard' | 'conjugation' | 'vocabulary' | 'sentence_order' | 'multiple_choice' | 'fill_gaps' | 'reading';

interface StudentAnalysis {
  level: string;
  challenges: string[];
  vocabulary: string[];
  weakTopics: { name: string; color: string }[];
  recentTopics: string[];
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

function getSystemPromptForDailyExercises(analysis: StudentAnalysis): string {
  const levelGuide = levelGuidelines[analysis.level] || levelGuidelines['A1'];
  
  return `You are an expert Spanish language teacher creating personalized daily exercises for a student.

STUDENT PROFILE:
- Level: ${analysis.level}
- Level Guidelines: ${levelGuide}

STUDENT WEAKNESSES (focus on these!):
- Challenges identified: ${analysis.challenges.join(', ') || 'None specified'}
- Topics with difficulty (red/yellow colors): ${analysis.weakTopics.map(t => t.name).join(', ') || 'None specified'}
- Recent vocabulary: ${analysis.vocabulary.join(', ') || 'General vocabulary'}
- Recent topics covered: ${analysis.recentTopics.join(', ') || 'General topics'}

Your goal is to create exercises that specifically target these weaknesses while being appropriately challenging for level ${analysis.level}.

You will generate a complete pack of 10 varied exercises focusing on the student's specific difficulties.

RESPOND ONLY WITH VALID JSON in this exact format:
{
  "analysis_summary": "Brief summary of what areas these exercises focus on (max 50 words)",
  "exercises": [
    {
      "type": "vocabulary|conjugation|fill_gaps|multiple_choice|sentence_order|flashcard|reading",
      "content": { ... exercise-specific content ... }
    }
  ]
}

EXERCISE CONTENT FORMATS BY TYPE:

For "vocabulary": { "word": "Spanish word", "definition": "Definition in Spanish", "sentence_blank": "Sentence with ____", "correct_answer": "word", "context_hint": "Hint" }

For "conjugation": { "verb": "infinitive", "tense": "tense name", "subject": "pronoun", "correct_answer": "conjugated form", "options": ["opt1", "opt2", "opt3", "opt4"] }

For "fill_gaps": { "sentence_with_gap": "Sentence with ____", "options": ["opt1", "opt2", "opt3", "opt4"], "correct_answer": "correct word", "context": "Context hint" }

For "multiple_choice": { "question": "Question in Spanish", "options": ["opt1", "opt2", "opt3", "opt4"], "correct_answer": "correct option", "explanation": "Why it's correct" }

For "sentence_order": { "scrambled_words": ["word1", "word2", ...], "correct_sentence": "Correct sentence", "hint": "Structure hint" }

For "flashcard": { "front": "English or description", "back": "Spanish translation", "hint": "Optional hint" }

For "reading": { "title": "Title", "text": "Short passage", "questions": [{ "question": "Q", "options": ["a","b","c","d"], "correct_answer": "correct" }] }`;
}

function getUserPromptForDailyExercises(analysis: StudentAnalysis): string {
  const focusAreas = [];
  
  if (analysis.weakTopics.length > 0) {
    focusAreas.push(`grammar topics: ${analysis.weakTopics.map(t => t.name).join(', ')}`);
  }
  if (analysis.challenges.length > 0) {
    focusAreas.push(`challenges: ${analysis.challenges.join(', ')}`);
  }
  if (analysis.vocabulary.length > 0) {
    focusAreas.push(`vocabulary from: ${analysis.vocabulary.join(', ')}`);
  }

  return `Generate exactly 10 personalized exercises for this ${analysis.level} level student.

DISTRIBUTION (create exactly this many of each type):
- 3 vocabulary exercises (focusing on ${analysis.vocabulary.length > 0 ? 'their recent vocabulary' : 'level-appropriate words'})
- 2 conjugation exercises (${analysis.weakTopics.some(t => t.name.toLowerCase().includes('verbo') || t.name.toLowerCase().includes('conjugación')) ? 'especially targeting verb tenses they struggle with' : 'level-appropriate tenses'})
- 2 fill_gaps exercises (grammar and vocabulary in context)
- 2 multiple_choice exercises (grammar rules and comprehension)
- 1 sentence_order exercise (sentence structure practice)

FOCUS AREAS: ${focusAreas.join('; ') || 'General practice for level ' + analysis.level}

Make exercises progressively slightly harder (exercise 1 easiest, exercise 10 hardest).
All content must be appropriate for level ${analysis.level}.
Generate valid JSON only.`;
}

async function analyzeStudent(supabase: any, studentId: string): Promise<StudentAnalysis> {
  console.log(`Analyzing student ${studentId}...`);
  
  // Get student profile
  const { data: studentProfile, error: profileError } = await supabase
    .from('student_profiles')
    .select('level, user_id')
    .eq('user_id', studentId)
    .single();
  
  if (profileError) {
    console.error('Error fetching student profile:', profileError);
  }
  
  const level = studentProfile?.level || 'A1';
  
  // Get recent progress notes (last 4 weeks)
  const { data: progressWeeks } = await supabase
    .from('student_progress_weeks')
    .select('id, week_number')
    .eq('student_id', studentId)
    .order('week_number', { ascending: false })
    .limit(4);
  
  const weekIds = progressWeeks?.map((w: any) => w.id) || [];
  
  // Get progress notes for those weeks
  const { data: progressNotes } = await supabase
    .from('student_progress_notes')
    .select('challenges, vocabulary, class_topics, tutoring_topics')
    .in('week_id', weekIds);
  
  // Extract challenges and vocabulary
  const challenges: string[] = [];
  const vocabulary: string[] = [];
  const recentTopics: string[] = [];
  
  progressNotes?.forEach((note: any) => {
    if (note.challenges) challenges.push(note.challenges);
    if (note.vocabulary) vocabulary.push(note.vocabulary);
    if (note.class_topics) recentTopics.push(note.class_topics);
    if (note.tutoring_topics) recentTopics.push(note.tutoring_topics);
  });
  
  // Get topic progress (red and yellow = weak topics)
  const { data: topicProgress } = await supabase
    .from('student_topic_progress')
    .select(`
      color,
      topic_id,
      week_topics!inner(name)
    `)
    .eq('student_id', studentId)
    .in('color', ['red', 'yellow']);
  
  const weakTopics = topicProgress?.map((tp: any) => ({
    name: tp.week_topics?.name || 'Unknown topic',
    color: tp.color
  })) || [];
  
  console.log(`Analysis complete - Level: ${level}, Challenges: ${challenges.length}, Weak topics: ${weakTopics.length}`);
  
  return {
    level,
    challenges: [...new Set(challenges)].slice(0, 5),
    vocabulary: [...new Set(vocabulary.join(', ').split(/[,;]/).map(v => v.trim()).filter(v => v))].slice(0, 10),
    weakTopics,
    recentTopics: [...new Set(recentTopics)].slice(0, 5)
  };
}

async function generateExercises(analysis: StudentAnalysis, apiKey: string): Promise<any> {
  const systemPrompt = getSystemPromptForDailyExercises(analysis);
  const userPrompt = getUserPromptForDailyExercises(analysis);

  console.log(`Generating daily exercises for level ${analysis.level}...`);

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
      max_tokens: 8000,
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

async function getOrCreateTodaysPack(supabase: any, studentId: string, apiKey: string): Promise<any> {
  // Calculate today's date in UTC
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split('T')[0];
  
  // Calculate tomorrow for expires_at
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];
  
  console.log(`Checking for existing pack for ${studentId} on ${todayStr}...`);
  
  // Check if pack exists for today
  const { data: existingPack, error: fetchError } = await supabase
    .from('daily_exercise_packs')
    .select('*')
    .eq('student_id', studentId)
    .eq('expires_at', tomorrowStr)
    .maybeSingle();
  
  if (fetchError) {
    console.error('Error checking existing pack:', fetchError);
  }
  
  if (existingPack) {
    console.log('Found existing pack:', existingPack.id);
    return { pack: existingPack, isNew: false };
  }
  
  // Get streak count
  const { data: yesterdayPack } = await supabase
    .from('daily_exercise_packs')
    .select('streak_count, is_completed')
    .eq('student_id', studentId)
    .eq('expires_at', todayStr)
    .maybeSingle();
  
  const streakCount = yesterdayPack?.is_completed ? (yesterdayPack.streak_count || 0) + 1 : 0;
  
  // Analyze student and generate new pack
  const analysis = await analyzeStudent(supabase, studentId);
  const exercisesData = await generateExercises(analysis, apiKey);
  
  // Insert new pack
  const { data: newPack, error: insertError } = await supabase
    .from('daily_exercise_packs')
    .insert({
      student_id: studentId,
      exercises_data: exercisesData,
      analysis_summary: exercisesData.analysis_summary || 'Ejercicios personalizados basados en tu progreso',
      expires_at: tomorrowStr,
      streak_count: streakCount
    })
    .select()
    .single();
  
  if (insertError) {
    console.error('Error creating pack:', insertError);
    throw insertError;
  }
  
  console.log('Created new pack:', newPack.id);
  return { pack: newPack, isNew: true };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { student_id, action } = await req.json();
    
    if (!student_id) {
      throw new Error('student_id is required');
    }
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Get or create today's pack
    if (action === 'get_or_create') {
      const result = await getOrCreateTodaysPack(supabase, student_id, LOVABLE_API_KEY);
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          pack: result.pack,
          is_new: result.isNew
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Update progress
    if (action === 'update_progress') {
      const { pack_id, completed_count, score, is_completed } = await req.json();
      
      const updateData: any = { completed_count };
      if (score !== undefined) updateData.score = score;
      if (is_completed) {
        updateData.is_completed = true;
        updateData.completed_at = new Date().toISOString();
      }
      
      const { data: updatedPack, error } = await supabase
        .from('daily_exercise_packs')
        .update(updateData)
        .eq('id', pack_id)
        .select()
        .single();
      
      if (error) throw error;
      
      return new Response(
        JSON.stringify({ success: true, pack: updatedPack }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Get past packs
    if (action === 'get_history') {
      const { data: packs, error } = await supabase
        .from('daily_exercise_packs')
        .select('*')
        .eq('student_id', student_id)
        .order('expires_at', { ascending: false })
        .limit(14);
      
      if (error) throw error;
      
      return new Response(
        JSON.stringify({ success: true, packs }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    throw new Error('Invalid action');

  } catch (error: unknown) {
    console.error('Error in generate-daily-exercises:', error);
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
