import { GoogleGenAI, Modality } from "@google/genai";
import { HealthReport, UserProfile, Source } from "../types";
import { ACTIVITY_LEVELS, DIETARY_PREFERENCES, BLOOD_GROUPS } from "../constants";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const cleanJsonString = (str: string) => {
  // Remove markdown code blocks if present
  let cleaned = str.replace(/```json/g, '').replace(/```/g, '').trim();
  // Sometimes the model might output text before or after the JSON, attempt to find the first { and last }
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1) {
    cleaned = cleaned.substring(firstBrace, lastBrace + 1);
  }
  // Regex to remove trailing commas before closing braces/brackets (common AI JSON error)
  cleaned = cleaned.replace(/,(\s*[}\]])/g, '$1');
  
  return cleaned;
};

// Helper to calculate BMI locally for fast summary context
const calculateBMI = (weight: string, height: string): number => {
    const w = parseFloat(weight);
    const h = parseFloat(height) / 100; // convert cm to m
    if (isNaN(w) || isNaN(h) || h === 0) return 0;
    return parseFloat((w / (h * h)).toFixed(1));
};

// New Service for Audio Transcription using Gemini 2.5 Flash
export const transcribeUserAudio = async (audioBase64: string, mimeType: string = 'audio/webm'): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: audioBase64
            }
          },
          { text: "Transcribe this audio exactly as spoken. Return ONLY the text transcript." }
        ]
      }
    });

    return response.text || "";
  } catch (error) {
    console.error("Transcription failed:", error);
    throw new Error("Failed to transcribe audio.");
  }
};

export const extractProfileFromAudio = async (
  audioBase64: string, 
  mimeType: string = 'audio/webm',
  focusedField?: string
): Promise<Partial<UserProfile>> => {
  try {
    const activityOptions = ACTIVITY_LEVELS.map(l => l.value).join(', ');
    const dietOptions = DIETARY_PREFERENCES.join(', ');
    const bloodOptions = BLOOD_GROUPS.join(', ');

    let prompt = "";

    if (focusedField) {
        // Targeted extraction for a specific field
        prompt = `
            The user is specifically providing input for the field: "${focusedField}".
            Listen to the audio and extract ONLY the value for "${focusedField}".

            Field Rules:
            - age: Extract number (Years).
            - weight: Extract number. Return in kg. If user says lbs/pounds, convert to kg.
            - height: Extract number. Return in cm. If user says feet/inches, convert to cm.
            - bloodGroup: Match exactly to one of: ${bloodOptions}.
            - activityLevel: Match closest to one of: ${activityOptions}.
            - dietaryPreference: Match closest to one of: ${dietOptions}.
            - medicalHistory: Summarize the condition or text provided.
            - gender: Extract 'Male', 'Female', or 'Other'.

            Return ONLY a valid JSON object with the single key.
            Example: {"${focusedField}": "value"}
        `;
    } else {
        // Global extraction for auto-fill
        prompt = `
          Listen to the user's voice input regarding their health profile. 
          Extract the following fields if mentioned. Return keys only for found data.
          
          Fields to extract:
          - age (number)
          - gender (Male, Female, Other)
          - weight (number, ALWAYS convert to kg)
          - height (number, ALWAYS convert to cm)
          - bloodGroup (Match exactly to one of: ${bloodOptions})
          - activityLevel (Match exactly to one of: ${activityOptions})
          - dietaryPreference (Match closest to one of: ${dietOptions})
          - medicalHistory (Summary of conditions mentioned)

          CRITICAL RULES for distinguishing numbers:
          - If the user says "years" or "old", it is AGE.
          - If the user says "kg", "kilos", "pounds", "lbs", it is WEIGHT.
          - If the user says "cm", "centimeters", "feet", "tall", it is HEIGHT.
          - If unit is not specified, use these ranges to guess:
             * Age: 1 - 100
             * Weight: 40 - 200 (likely kg)
             * Height: 130 - 220 (likely cm)

          Return ONLY a valid JSON object. Do not include markdown.
          Example: {"age": "30", "gender": "Male", "weight": "75", "height": "180", "activityLevel": "active"}
        `;
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
            { inlineData: { mimeType, data: audioBase64 } },
            { text: prompt }
        ]
      },
      config: {
          responseMimeType: 'application/json'
      }
    });

    const text = response.text || "{}";
    const cleanedText = cleanJsonString(text);
    return JSON.parse(cleanedText);
  } catch (error) {
    console.error("Profile extraction failed:", error);
    return {};
  }
};

// Independent function to generate just the summary quickly (for Audio/Parallelism)
export const generateFastSummary = async (profile: UserProfile): Promise<string> => {
    try {
        const bmi = calculateBMI(profile.weight, profile.height);
        const prompt = `
            Act as a world-class preventative health consultant.
            
            User Profile:
            - Age: ${profile.age}, Gender: ${profile.gender}
            - BMI: ${bmi}
            - Activity: ${profile.activityLevel}
            - Diet: ${profile.dietaryPreference}
            - History: ${profile.medicalHistory || "None"}

            Instructions:
            Write a SHORT, PUNCHY, and ENGAGING health summary (Max 3 sentences).
            Address the user as "You". Focus on the big picture of their health status.
            Be encouraging.
        `;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
        });

        return response.text || "Your health profile has been analyzed.";
    } catch (e) {
        console.error("Fast summary failed", e);
        return "Your comprehensive health report is ready.";
    }
};

export const generateHealthReport = async (profile: UserProfile): Promise<HealthReport> => {
  try {
    // Note: History logic removed to ensure every user is treated as a new, unique case.
    
    const prompt = `
      Act as a world-class preventative health consultant and nutritionist. 
      Analyze the following user profile and generate a SIMPLE, CONCISE, and INTERESTING health report.
      
      User Profile:
      - Age: ${profile.age}
      - Gender: ${profile.gender}
      - Blood Group: ${profile.bloodGroup}
      - Weight: ${profile.weight} kg
      - Height: ${profile.height} cm
      - Activity Level: ${profile.activityLevel}
      - Dietary Preference: ${profile.dietaryPreference}
      - Medical History/Concerns: ${profile.medicalHistory || "None stated"}

      Instructions:
      1. Calculate BMI accurately.
      2. **Holistic Health Score (0-100):** Do NOT rely solely on BMI. Evaluate overall health based on WHO and CDC guidelines. Consider age, activity level, and medical history.
      3. USE GOOGLE SEARCH to find interesting and specific facts about the user's Blood Group and health risks.
      4. Provide practical, actionable advice. KEEP IT SIMPLE.
      5. Create a structured daily routine.
      
      CRITICAL TONE INSTRUCTION:
      - Address the user directly as "You" and "Your".
      - Be encouraging but BRIEF. 
      - AVOID complex medical jargon. Use simple, everyday language.
      - FOCUS ON IMPACT: Only provide the top 3 most important points per section. Do not overwhelm the user with long lists.
      - TREAT THIS AS A FRESH ASSESSMENT. Do not refer to past data.
      
      CRITICAL OUTPUT FORMAT:
      - You MUST return the result as a VALID JSON OBJECT. Do not include markdown formatting or any introductory text.
      - **DO NOT USE TRAILING COMMAS** in arrays or objects.
      
      The JSON structure must match this exactly:
      {
        "bmi": number,
        "bmiCategory": "Underweight" | "Normal" | "Overweight" | "Obese",
        "overallHealthScore": number (0-100),
        "summary": "Short, punchy, and engaging summary. Maximum 3 sentences. Focus on the big picture.",
        "potentialRisks": ["risk 1", "risk 2" (Max 3 items, kept short)],
        "keyStrengths": ["strength 1", "strength 2" (Max 3 items, kept short)],
        "dailyRoutine": [
          {
            "timeOfDay": "Morning" | "Afternoon" | "Evening",
            "title": "Activity Title",
            "description": "Short description (1 sentence max)",
            "type": "exercise" | "diet" | "lifestyle" | "mindfulness"
          }
        ],
        "nutritionalAdvice": ["tip 1", "tip 2" (Max 3 tips, kept short)]
      }
    `;

    // Using gemini-2.5-flash for reliability
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash", 
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    const text = response.text || "{}";
    const cleanedText = cleanJsonString(text);
    
    let report: HealthReport;
    try {
        report = JSON.parse(cleanedText);
    } catch (parseError) {
        console.error("JSON Parse failed on:", cleanedText);
        throw new Error("Failed to parse AI response");
    }

    // Extract Search Grounding Metadata
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const sources: Source[] = chunks
      .map((chunk) => ({
        title: chunk.web?.title || "Source",
        uri: chunk.web?.uri || ""
      }))
      .filter((source) => source.uri !== "");
    
    // Deduplicate sources based on URI
    const uniqueSourcesMap = new Map<string, Source>();
    sources.forEach(source => {
      uniqueSourcesMap.set(source.uri, source);
    });
    const uniqueSources = Array.from(uniqueSourcesMap.values());
    
    report.sources = uniqueSources;
    report.date = new Date().toISOString(); // Stamp generation time

    return report;

  } catch (error) {
    console.error("Error generating health report:", error);
    throw error;
  }
};

export const generateReportVisual = async (input: string | UserProfile, theme: string = 'Modern Medical'): Promise<string | undefined> => {
  try {
    let promptText = "";
    
    if (typeof input === 'string') {
        promptText = `health summary: "${input}"`;
    } else {
        promptText = `health profile: Age ${input.age}, Gender ${input.gender}, Blood Type ${input.bloodGroup}, Activity ${input.activityLevel}, Diet ${input.dietaryPreference}`;
    }

    const prompt = `Create a visually stunning, abstract, and uplifting digital art representation of this ${promptText}. 
    The requested visual theme is: "${theme}". Use color palettes and styles associated with this theme.
    The image should represent vitality, balance, and the specific biological themes mentioned (e.g., blood cells, energy flow, nature). 
    Do not include text in the image.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{ text: prompt }],
      },
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return part.inlineData.data;
      }
    }
    return undefined;
  } catch (error) {
    console.error("Error generating report visual:", error);
    return undefined;
  }
};

export const generateAudioSummary = async (text: string): Promise<string> => {
  try {
    const cleanText = text.replace(/[*#_]/g, '');
    const safeText = cleanText.length > 600 ? cleanText.substring(0, 600) + "." : cleanText;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: safeText }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' },
          },
        },
      },
    });

    const audioData = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!audioData) {
      throw new Error("No audio data generated");
    }

    return audioData;
  } catch (error) {
    console.error("Error generating audio:", error);
    throw error;
  }
};

export const generateVeoVideo = async (imageBase64: string, promptText: string, aspectRatio: '16:9' | '9:16' = '16:9') => {
  try {
    const win = window as any;
    if (win.aistudio && win.aistudio.hasSelectedApiKey) {
        const hasKey = await win.aistudio.hasSelectedApiKey();
        if (!hasKey) {
            await win.aistudio.openSelectKey();
        }
    }

    const veoAi = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    let operation = await veoAi.models.generateVideos({
      model: 'veo-3.1-fast-generate-preview',
      prompt: promptText,
      image: {
        imageBytes: imageBase64,
        mimeType: 'image/jpeg',
      },
      config: {
        numberOfVideos: 1,
        resolution: '720p',
        aspectRatio: aspectRatio,
      }
    });

    while (!operation.done) {
      await new Promise(resolve => setTimeout(resolve, 5000));
      operation = await veoAi.operations.getVideosOperation({operation: operation});
    }

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!downloadLink) throw new Error("No video URI returned");
    
    const videoResponse = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
    const videoBlob = await videoResponse.blob();
    return URL.createObjectURL(videoBlob);

  } catch (error) {
    console.error("Veo generation failed:", error);
    throw error;
  }
};
