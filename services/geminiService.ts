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
  // Regex to remove trailing commas before closing braces/brackets (common AI JSON error)
  cleaned = cleaned.replace(/,(\s*[}\]])/g, '$1');
  
  return cleaned;
};

export const generateHealthReport = async (profile: UserProfile, history: HealthReport[] = []): Promise<HealthReport> => {
  try {
    // Construct History Context
    let historyContext = "No previous data available. This is the first assessment.";
    if (history.length > 0) {
        const last = history[0]; // Assuming sorted descending
        historyContext = `
        PREVIOUS ASSESSMENT (${new Date(last.date || '').toLocaleDateString()}):
        - Previous Overall Score: ${last.overallHealthScore}
        - Previous BMI: ${last.bmi}
        - Previous Risks: ${last.potentialRisks.slice(0, 2).join(", ")}
        `;
    }

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

      History Context for Learning/Adaptability:
      ${historyContext}

      Instructions:
      1. Calculate BMI accurately.
      2. **Holistic Health Score (0-100):** Do NOT rely solely on BMI. Evaluate overall health based on WHO and CDC guidelines. Consider age, activity level, and medical history.
      3. USE GOOGLE SEARCH to find interesting and specific facts about the user's Blood Group and health risks.
      4. **Trend Analysis:** Compare the current profile with the History Context. Did they improve? Did they regress? What specifically changed?
      5. Provide practical, actionable advice. KEEP IT SIMPLE.
      6. Create a structured daily routine.
      
      CRITICAL TONE INSTRUCTION:
      - Address the user directly as "You" and "Your".
      - Be encouraging but BRIEF. 
      - AVOID complex medical jargon. Use simple, everyday language.
      - FOCUS ON IMPACT: Only provide the top 3 most important points per section. Do not overwhelm the user with long lists.
      
      CRITICAL OUTPUT FORMAT:
      - You MUST return the result as a VALID JSON OBJECT. Do not include markdown formatting or any introductory text.
      - **DO NOT USE TRAILING COMMAS** in arrays or objects.
      
      The JSON structure must match this exactly:
      {
        "bmi": number,
        "bmiCategory": "Underweight" | "Normal" | "Overweight" | "Obese",
        "overallHealthScore": number (0-100),
        "trendAnalysis": "A 1-2 sentence analysis comparing current results to previous history. e.g., 'Your score improved by 5 points due to better weight management.' or 'Maintain consistency as metrics are stable.' If no history, say 'Welcome to your first assessment; we will track your progress from here.'",
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

export const generateReportVisual = async (summary: string): Promise<string | undefined> => {
  try {
    const prompt = `Create a visually stunning, abstract, and uplifting digital art representation of this health summary: "${summary}". 
    The image should represent vitality, balance, and the specific biological themes mentioned (e.g., blood cells, energy flow, nature). 
    Do not include text in the image. Style: Modern, clean, medical-artistic fusion.`;

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
    // Non-blocking error, return undefined
    return undefined;
  }
};

export const generateAudioSummary = async (text: string): Promise<string> => {
  try {
    // Simplify input text for TTS stability
    // Remove markdown formatting characters like * or # which might cause issues
    const cleanText = text.replace(/[*#_]/g, '');
    
    // Truncate to a safe length (e.g., 600 chars) to prevent timeout/size errors
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
    // Check for API key selection (required for Veo)
    const win = window as any;
    if (win.aistudio && win.aistudio.hasSelectedApiKey) {
        const hasKey = await win.aistudio.hasSelectedApiKey();
        if (!hasKey) {
            await win.aistudio.openSelectKey();
        }
    }

    // Create a new instance to ensure we use the selected key
    const veoAi = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    let operation = await veoAi.models.generateVideos({
      model: 'veo-3.1-fast-generate-preview',
      prompt: promptText,
      image: {
        imageBytes: imageBase64,
        mimeType: 'image/jpeg', // Assuming jpeg/png for simplicity, API handles standard types
      },
      config: {
        numberOfVideos: 1,
        resolution: '720p',
        aspectRatio: aspectRatio,
      }
    });

    while (!operation.done) {
      await new Promise(resolve => setTimeout(resolve, 5000)); // Poll every 5s
      operation = await veoAi.operations.getVideosOperation({operation: operation});
    }

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!downloadLink) throw new Error("No video URI returned");
    
    // Fetch the actual video bytes
    const videoResponse = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
    const videoBlob = await videoResponse.blob();
    return URL.createObjectURL(videoBlob);

  } catch (error) {
    console.error("Veo generation failed:", error);
    throw error;
  }
};