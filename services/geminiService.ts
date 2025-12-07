import { GoogleGenAI, Type, Schema } from "@google/genai";
import { HealthReport, UserProfile } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const healthReportSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    bmi: { type: Type.NUMBER, description: "The calculated Body Mass Index based on height and weight" },
    bmiCategory: { type: Type.STRING, description: "Category like Underweight, Normal, Overweight, Obese" },
    overallHealthScore: { type: Type.NUMBER, description: "A calculated health score from 0 to 100 based on the profile inputs and risks" },
    summary: { type: Type.STRING, description: "A concise executive summary of the user's health condition" },
    potentialRisks: { 
      type: Type.ARRAY, 
      items: { type: Type.STRING },
      description: "List of potential health risks based on blood group, age, and biometrics"
    },
    keyStrengths: { 
      type: Type.ARRAY, 
      items: { type: Type.STRING },
      description: "List of positive health indicators from their profile"
    },
    dailyRoutine: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          timeOfDay: { type: Type.STRING, description: "E.g., Morning, Afternoon, Evening, Bedtime" },
          title: { type: Type.STRING },
          description: { type: Type.STRING },
          type: { type: Type.STRING, enum: ['exercise', 'diet', 'lifestyle', 'mindfulness'] }
        },
        required: ['timeOfDay', 'title', 'description', 'type']
      }
    },
    nutritionalAdvice: { 
      type: Type.ARRAY, 
      items: { type: Type.STRING },
      description: "Specific dietary suggestions relevant to blood group and goals"
    }
  },
  required: ['bmi', 'bmiCategory', 'overallHealthScore', 'summary', 'potentialRisks', 'dailyRoutine', 'nutritionalAdvice']
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
      2. Consider Blood Group specific dietary tendencies (e.g., Blood Type Diet theories, but grounded in general nutritional science).
      3. Provide practical, actionable advice.
      4. The 'overallHealthScore' should be a realistic estimation (0-100) based on BMI and activity level (penalize for sedentary or extreme BMI).
      5. Create a structured daily routine that balances diet, exercise, and mental well-being.
      
      Return the response in strictly valid JSON matching the provided schema.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: healthReportSchema,
        temperature: 0.4, // Keep it relatively deterministic and professional
      },
    });

    const jsonText = response.text;
    if (!jsonText) {
        throw new Error("No content received from AI");
    }

    const report: HealthReport = JSON.parse(jsonText);
    return report;

  } catch (error) {
    console.error("Error generating health report:", error);
    throw error;
  }
};
