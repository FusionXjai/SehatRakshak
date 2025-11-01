import { supabase } from "@/integrations/supabase/client";

// OpenAI API configuration
const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY || '';
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

// Symptom red flags that require immediate escalation
const RED_FLAG_SYMPTOMS = [
  'chest pain',
  'difficulty breathing',
  'severe bleeding',
  'unconscious',
  'stroke',
  'heart attack',
  'severe headache',
  'high fever',
  'seizure',
  'allergic reaction',
  'swelling throat',
  'dizziness severe'
];

export interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AIResponse {
  message: string;
  isRedFlag: boolean;
  translation?: {
    hindi?: string;
    english?: string;
  };
}

// Prompt templates
const SYSTEM_PROMPTS = {
  general: `You are Sehat Rakshak AI Health Assistant. You help patients understand their prescriptions, medications, and provide basic health guidance. 
  
Guidelines:
- Be empathetic and supportive
- Explain medical terms in simple language
- Always remind patients to consult their doctor for serious concerns
- Detect emergency symptoms and escalate immediately
- Provide information in both English and Hindi when needed
- Never provide specific medical diagnoses
- Focus on medication adherence and general wellness`,

  prescription: `You are helping a patient understand their prescription. Explain:
- What each medicine is for
- How to take it (dosage, timing, with/without food)
- Possible side effects
- When to expect improvement
- Importance of completing the full course
Keep explanations simple and in both English and Hindi.`,

  symptoms: `You are evaluating patient-reported symptoms. 
CRITICAL: If you detect any emergency symptoms (chest pain, difficulty breathing, severe bleeding, stroke symptoms, etc.), immediately flag it as a red flag emergency.
For non-emergency symptoms, provide general guidance and recommend consulting a doctor if symptoms persist.`,

  translation: `Translate the following medical instructions from English to Hindi and vice versa. Maintain medical accuracy while using simple, patient-friendly language.`
};

/**
 * Call OpenAI API for chat completion
 */
async function callOpenAI(messages: AIMessage[]): Promise<string> {
  if (!OPENAI_API_KEY) {
    return "AI Assistant is not configured. Please add VITE_OPENAI_API_KEY to your environment variables.";
  }

  try {
    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: messages,
        temperature: 0.7,
        max_tokens: 500
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || 'No response from AI';
  } catch (error: any) {
    console.error('OpenAI API Error:', error);
    return `Error: ${error.message}`;
  }
}

/**
 * Detect red flag symptoms in user query
 */
function detectRedFlags(query: string): boolean {
  const lowerQuery = query.toLowerCase();
  return RED_FLAG_SYMPTOMS.some(symptom => lowerQuery.includes(symptom));
}

/**
 * Save AI interaction to database
 */
async function saveAIInteraction(
  patientId: string,
  query: string,
  response: string,
  isRedFlag: boolean,
  language: string = 'english'
): Promise<void> {
  try {
    const { error } = await (supabase as any)
      .from('ai_interactions')
      .insert({
        patient_id: patientId,
        query: query,
        response: response,
        is_red_flag: isRedFlag,
        language: language,
        created_at: new Date().toISOString()
      });

    if (error) {
      console.error('Error saving AI interaction:', error);
    }
  } catch (error) {
    console.error('Failed to save AI interaction:', error);
  }
}

/**
 * General health query handler
 */
export async function askHealthQuestion(
  query: string,
  patientId?: string,
  language: 'english' | 'hindi' = 'english'
): Promise<AIResponse> {
  const isRedFlag = detectRedFlags(query);
  
  const messages: AIMessage[] = [
    { role: 'system', content: SYSTEM_PROMPTS.general },
    { role: 'user', content: query }
  ];

  const response = await callOpenAI(messages);

  if (patientId) {
    await saveAIInteraction(patientId, query, response, isRedFlag, language);
  }

  return {
    message: response,
    isRedFlag: isRedFlag
  };
}

/**
 * Explain prescription to patient
 */
export async function explainPrescription(
  prescriptionData: {
    diagnosis: string;
    medications: Array<{
      medicine_name: string;
      dosage: string;
      frequency: string;
      timing: string;
      duration_days: number;
      instructions?: string;
    }>;
    notes?: string;
  },
  patientId?: string,
  language: 'english' | 'hindi' = 'english'
): Promise<AIResponse> {
  const medicationsList = prescriptionData.medications.map((med, i) => 
    `${i + 1}. ${med.medicine_name} - ${med.dosage}, ${med.frequency}, ${med.timing}, for ${med.duration_days} days${med.instructions ? ` (${med.instructions})` : ''}`
  ).join('\n');

  const prompt = `Explain this prescription in simple ${language} language:

Diagnosis: ${prescriptionData.diagnosis}
Medications:
${medicationsList}

${prescriptionData.notes ? `Doctor's Notes: ${prescriptionData.notes}` : ''}

Please explain:
1. What is the diagnosis in simple terms
2. What each medicine does
3. How to take them properly
4. What to expect during treatment
5. Any important precautions

${language === 'hindi' ? 'Provide the explanation in Hindi (Devanagari script).' : ''}`;

  const messages: AIMessage[] = [
    { role: 'system', content: SYSTEM_PROMPTS.prescription },
    { role: 'user', content: prompt }
  ];

  const response = await callOpenAI(messages);

  if (patientId) {
    await saveAIInteraction(patientId, prompt, response, false, language);
  }

  return {
    message: response,
    isRedFlag: false
  };
}

/**
 * Create WhatsApp-friendly prescription summary
 */
export async function createWhatsAppSummary(
  prescriptionData: {
    patientName: string;
    diagnosis: string;
    medications: Array<{
      medicine_name: string;
      dosage: string;
      frequency: string;
      timing: string;
    }>;
  },
  language: 'english' | 'hindi' = 'english'
): Promise<string> {
  const medicationsList = prescriptionData.medications.map((med, i) => 
    `${i + 1}. ${med.medicine_name} - ${med.dosage}\n   ${med.frequency}, ${med.timing}`
  ).join('\n\n');

  const prompt = `Create a short, WhatsApp-friendly message (max 160 words) summarizing this prescription in ${language}:

Patient: ${prescriptionData.patientName}
Diagnosis: ${prescriptionData.diagnosis}
Medications:
${medicationsList}

Format: Friendly, easy to understand, include emoji for clarity.
${language === 'hindi' ? 'Use Hindi (Devanagari script).' : ''}`;

  const messages: AIMessage[] = [
    { role: 'system', content: 'You create concise, patient-friendly medication summaries for WhatsApp.' },
    { role: 'user', content: prompt }
  ];

  return await callOpenAI(messages);
}

/**
 * Translate medical text between Hindi and English
 */
export async function translateMedicalText(
  text: string,
  from: 'english' | 'hindi',
  to: 'english' | 'hindi'
): Promise<string> {
  const prompt = `Translate this medical text from ${from} to ${to}. Maintain accuracy and use patient-friendly language:

${text}`;

  const messages: AIMessage[] = [
    { role: 'system', content: SYSTEM_PROMPTS.translation },
    { role: 'user', content: prompt }
  ];

  return await callOpenAI(messages);
}

/**
 * Analyze symptoms and detect red flags
 */
export async function analyzeSymptoms(
  symptoms: string,
  patientId?: string,
  language: 'english' | 'hindi' = 'english'
): Promise<AIResponse> {
  const isRedFlag = detectRedFlags(symptoms);
  
  const prompt = `Patient reports these symptoms: ${symptoms}

${isRedFlag ? 'EMERGENCY DETECTED! ' : ''}Provide guidance in ${language} language.`;

  const messages: AIMessage[] = [
    { role: 'system', content: SYSTEM_PROMPTS.symptoms },
    { role: 'user', content: prompt }
  ];

  const response = await callOpenAI(messages);

  if (patientId) {
    await saveAIInteraction(patientId, symptoms, response, isRedFlag, language);
  }

  return {
    message: response,
    isRedFlag: isRedFlag
  };
}

/**
 * Get bilingual response (both English and Hindi)
 */
export async function getBilingualResponse(
  query: string,
  patientId?: string
): Promise<AIResponse> {
  const englishResponse = await askHealthQuestion(query, patientId, 'english');
  const hindiResponse = await translateMedicalText(englishResponse.message, 'english', 'hindi');

  return {
    message: englishResponse.message,
    isRedFlag: englishResponse.isRedFlag,
    translation: {
      english: englishResponse.message,
      hindi: hindiResponse
    }
  };
}
