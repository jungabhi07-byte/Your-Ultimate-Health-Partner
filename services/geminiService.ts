import { GoogleGenAI, Modality } from "@google/genai";
import { HealthReport, UserProfile, Source } from "../types";

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
  return cleaned;
};

export const generateHealthReport = async (profile: UserProfile): Promise<HealthReport> => {
  try {
    const prompt = `
      Act as a world-class preventative health consultant and nutritionist. 
      Analyze the following user profile and generate a comprehensive health report and daily routine.
      
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
      2. USE GOOGLE SEARCH to find the latest scientific consensus on Blood Group diets and specific health risks associated with the user's demographic and blood type.
      3. Provide practical, actionable advice based on this research.
      4. The 'overallHealthScore' should be a realistic estimation (0-100) based on BMI and activity level.
      5. Create a structured daily routine that balances diet, exercise, and mental well-being.
      
      CRITICAL: You MUST return the result as a VALID JSON OBJECT. Do not include markdown formatting or any introductory text.
      
      The JSON structure must match this exactly:
      {
        "bmi": number,
        "bmiCategory": "Underweight" | "Normal" | "Overweight" | "Obese",
        "overallHealthScore": number (0-100),
        "summary": "Concise executive summary",
        "potentialRisks": ["risk 1", "risk 2"],
        "keyStrengths": ["strength 1", "strength 2"],
        "dailyRoutine": [
          {
            "timeOfDay": "Morning" | "Afternoon" | "Evening",
            "title": "Activity Title",
            "description": "Short description",
            "type": "exercise" | "diet" | "lifestyle" | "mindfulness"
          }
        ],
        "nutritionalAdvice": ["tip 1", "tip 2"]
      }
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash", // Updated to allow tools
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        // responseSchema and responseMimeType are NOT allowed when using googleSearch tool
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

    return report;

  } catch (error) {
    console.error("Error generating health report:", error);
    throw error;
  }
};

export const generateAudioSummary = async (text: string): Promise<string> => {
  try {
    const prompt = `Read the following health summary in a warm, encouraging, and professional tone. Speak clearly and at a moderate pace.\n\nText to read: "${text}"`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: prompt }] }],
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