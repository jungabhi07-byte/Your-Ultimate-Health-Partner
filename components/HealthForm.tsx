
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { UserProfile } from '../types';
import { BLOOD_GROUPS, ACTIVITY_LEVELS, DIETARY_PREFERENCES } from '../constants';
import { ChevronRight, ChevronLeft, User, Droplet, Activity, Utensils, Mic, MicOff, AlertCircle, X } from 'lucide-react';

// Type definitions for Web Speech API
declare global {
  interface Window {
    webkitSpeechRecognition: any;
    SpeechRecognition: any;
  }
}

interface HealthFormProps {
  initialData: UserProfile;
  onSubmit: (data: UserProfile) => void;
  onCancel: () => void;
}

// Parsing Result Interface
interface ParseResult {
  valid: boolean;
  value: string;
  error?: string;
}

const HealthForm: React.FC<HealthFormProps> = ({ initialData, onSubmit, onCancel }) => {
  const [data, setData] = useState<UserProfile>(initialData);
  const [step, setStep] = useState(1);
  const [listeningField, setListeningField] = useState<keyof UserProfile | null>(null);
  const [speechError, setSpeechError] = useState<string | null>(null);
  
  // Ref to store the recognition instance to manage lifecycle (abort/stop)
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (speechError) {
      const timer = setTimeout(() => setSpeechError(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [speechError]);

  // Cleanup recognition on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  const handleChange = (field: keyof UserProfile, value: string) => {
    setData(prev => ({ ...prev, [field]: value }));
  };

  const handleNext = () => setStep(prev => prev + 1);
  const handlePrev = () => setStep(prev => prev - 1);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setListeningField(null);
    }
  }, []);

  // --- Parsing Strategies ---

  const parseNumeric = (text: string, min: number, max: number, fieldName: string): ParseResult => {
    // Extract all numbers from the text (handles decimals)
    const matches = text.match(/(\d+(\.\d+)?)/g);
    if (!matches) {
      return { valid: false, value: '', error: `Could not hear a number for ${fieldName}. Please try again.` };
    }
    
    // Find the first number that falls within a reasonable range
    const validNum = matches.find(numStr => {
      const val = parseFloat(numStr);
      return val >= min && val <= max;
    });

    if (validNum) {
      return { valid: true, value: validNum };
    }
    return { valid: false, value: '', error: `${fieldName} detected (${matches[0]}) seems invalid. Range: ${min}-${max}.` };
  };

  const parseOption = (text: string, options: { value: string, keywords: string[] }[]): ParseResult => {
    const lower = text.toLowerCase();
    
    // Sort options by specificity (optional, but good if keywords overlap)
    for (const opt of options) {
      // Check if any keyword for this option exists in the spoken text
      if (opt.keywords.some(k => lower.includes(k))) {
        return { valid: true, value: opt.value };
      }
    }
    return { valid: false, value: '', error: "Could not match your input to an option. Try using the dropdown list terms." };
  };

  const parseFreeText = (text: string): ParseResult => {
    if (!text || text.trim().length === 0) return { valid: false, value: '', error: "No input detected." };
    
    // Check for clear commands
    const lower = text.toLowerCase();
    if (lower === 'clear' || lower === 'none' || lower === 'nothing' || lower === 'delete') {
      return { valid: true, value: '' }; // Clear the field
    }

    // Capitalize first letter
    const formatted = text.charAt(0).toUpperCase() + text.slice(1);
    return { valid: true, value: formatted };
  };

  // --- Voice Input Logic ---

  const startListening = useCallback((field: keyof UserProfile) => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      setSpeechError("Voice input is not supported in this browser.");
      return;
    }

    if (recognitionRef.current) {
      recognitionRef.current.abort();
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setListeningField(field);
      setSpeechError(null);
    };

    recognition.onend = () => {
      setListeningField(null);
      recognitionRef.current = null;
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error", event.error);
      let errorMessage = "Could not hear you. Please try again.";
      
      if (event.error === 'aborted') {
        setListeningField(null);
        return; 
      } else if (event.error === 'no-speech') {
        errorMessage = "No speech detected. Please speak closer to the mic.";
      } else if (event.error === 'audio-capture') {
        errorMessage = "No microphone found. Check your system settings.";
      } else if (event.error === 'not-allowed') {
        errorMessage = "Microphone permission denied. Allow access to use voice.";
      }
      
      setSpeechError(errorMessage);
      setListeningField(null);
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      processVoiceInput(field, transcript);
    };

    try {
        recognition.start();
    } catch (e) {
        console.error("Failed to start recognition", e);
    }
  }, [data]);

  const processVoiceInput = (field: keyof UserProfile, text: string) => {
    console.log(`Voice Input for ${field}: ${text}`);
    let result: ParseResult = { valid: false, value: '', error: 'Unknown error' };

    switch (field) {
      case 'age':
        result = parseNumeric(text, 1, 120, 'Age');
        break;
      case 'weight':
        result = parseNumeric(text, 2, 500, 'Weight');
        break;
      case 'height':
        result = parseNumeric(text, 30, 300, 'Height');
        break;
      
      case 'gender':
        result = parseOption(text, [
          { value: 'Female', keywords: ['female', 'woman', 'girl', 'she', 'her'] },
          { value: 'Male', keywords: ['male', 'man', 'boy', 'he', 'him'] },
          { value: 'Other', keywords: ['other', 'non-binary', 'diverse'] }
        ]);
        break;
      
      case 'bloodGroup':
         // Clean up spoken blood group
         let cleanBg = text.toLowerCase()
            .replace(/positive|plus|pos/, '+')
            .replace(/negative|minus|neg/, '-')
            .replace(/type/, '')
            .replace(/\s/g, '')
            .toUpperCase();
            
         // Match against known groups (checking longest first to catch AB before A/B)
         const sortedGroups = [...BLOOD_GROUPS].sort((a, b) => b.length - a.length);
         const foundBg = sortedGroups.find(bg => cleanBg.includes(bg));
         
         if (foundBg) {
           result = { valid: true, value: foundBg };
         } else {
           result = { valid: false, value: '', error: `Could not identify blood group from "${text}". Try saying "O Positive".` };
         }
        break;

      case 'activityLevel':
        result = parseOption(text, [
          { value: 'sedentary', keywords: ['sedentary', 'lazy', 'none', 'sitting', 'couch', 'little'] },
          { value: 'light', keywords: ['light', 'mild', 'walk', 'easy', 'occasional'] },
          { value: 'moderate', keywords: ['moderate', 'medium', 'average', 'normal', 'regular'] },
          { value: 'athlete', keywords: ['super', 'athlete', 'pro', 'intense', 'very active', 'training'] },
          { value: 'active', keywords: ['active', 'hard', 'heavy', 'gym', 'sport'] } // Fallback for active
        ]);
        break;

      case 'dietaryPreference':
        result = parseOption(text, [
          { value: 'Vegetarian (No meat)', keywords: ['vegetarian', 'no meat', 'veggie'] },
          { value: 'Vegan (Plants only)', keywords: ['vegan', 'plant', 'plants'] },
          { value: 'Pescatarian (Fish allowed)', keywords: ['pescatarian', 'fish', 'seafood'] },
          { value: 'Low Carb / Keto', keywords: ['keto', 'low carb', 'carbs', 'ketogenic'] },
          { value: 'Gluten-Free', keywords: ['gluten', 'celiac', 'wheat'] },
          { value: 'Dairy-Free', keywords: ['dairy', 'lactose', 'milk'] },
          { value: 'I eat everything', keywords: ['everything', 'all', 'anything', 'omnivore', 'normal', 'none'] }
        ]);
        break;
      
      case 'medicalHistory':
        result = parseFreeText(text);
        break;

      default:
        result = { valid: true, value: text };
    }

    if (result.valid) {
        handleChange(field, result.value);
        // Optional: Provide visual feedback of success?
    } else {
        setSpeechError(result.error || "Could not understand input.");
    }
  };

  // Reusable Voice Button Component
  const VoiceTrigger = ({ field, className = "" }: { field: keyof UserProfile, className?: string }) => {
    const isListening = listeningField === field;
    return (
      <button
        onClick={() => isListening ? stopListening() : startListening(field)}
        className={`p-2 rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
          isListening 
            ? 'bg-rose-100 text-rose-600 ring-rose-400 animate-pulse' 
            : 'text-gray-400 hover:text-teal-600 hover:bg-teal-50'
        } ${className}`}
        title={isListening ? "Stop listening" : "Tap to speak"}
        type="button"
      >
        {isListening ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
      </button>
    );
  };

  const isStep1Valid = data.age && data.gender && data.weight && data.height;
  const isStep2Valid = data.bloodGroup && data.activityLevel;
  
  return (
    // Reduced padding from py-12 to py-6
    <div className="max-w-2xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100 relative">
        
        {/* Progress Bar */}
        <div className="bg-gray-50 px-8 py-4 border-b border-gray-100 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-800">Your Health Profile</h2>
            <div className="flex gap-2">
                {[1, 2, 3].map(i => (
                    <div key={i} className={`h-2 w-8 rounded-full transition-colors ${step >= i ? 'bg-teal-600' : 'bg-gray-200'}`} />
                ))}
            </div>
        </div>

        <div className="p-8">
          {/* Step 1: Basic Biometrics */}
          {step === 1 && (
            <div className="space-y-6 animate-fadeIn">
              <div className="flex items-center gap-3 mb-6 text-teal-700">
                <User className="h-6 w-6" />
                <h3 className="text-xl font-medium">Basic Biometrics</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 flex justify-between">
                    <span>Age</span>
                    <VoiceTrigger field="age" className="-mt-1 -mr-1" />
                  </label>
                  <div className="relative">
                    <input
                        type="number"
                        value={data.age}
                        onChange={(e) => handleChange('age', e.target.value)}
                        className="w-full rounded-lg border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 shadow-sm focus:border-teal-500 focus:ring-teal-500 p-2.5 border"
                        placeholder="Years"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 flex justify-between">
                    <span>Gender</span>
                    <VoiceTrigger field="gender" className="-mt-1 -mr-1" />
                  </label>
                  <select
                    value={data.gender}
                    onChange={(e) => handleChange('gender', e.target.value)}
                    className="w-full rounded-lg border-gray-300 bg-white text-gray-900 shadow-sm focus:border-teal-500 focus:ring-teal-500 p-2.5 border"
                  >
                    <option value="">Select...</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 flex justify-between">
                    <span>Weight (kg)</span>
                    <VoiceTrigger field="weight" className="-mt-1 -mr-1" />
                  </label>
                  <input
                    type="number"
                    value={data.weight}
                    onChange={(e) => handleChange('weight', e.target.value)}
                    className="w-full rounded-lg border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 shadow-sm focus:border-teal-500 focus:ring-teal-500 p-2.5 border"
                    placeholder="kg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 flex justify-between">
                    <span>Height (cm)</span>
                    <VoiceTrigger field="height" className="-mt-1 -mr-1" />
                  </label>
                  <input
                    type="number"
                    value={data.height}
                    onChange={(e) => handleChange('height', e.target.value)}
                    className="w-full rounded-lg border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 shadow-sm focus:border-teal-500 focus:ring-teal-500 p-2.5 border"
                    placeholder="cm"
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-between">
                <button
                  onClick={onCancel}
                  className="inline-flex items-center px-6 py-3 border border-gray-200 text-base font-medium rounded-md text-gray-600 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-300 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleNext}
                  disabled={!isStep1Valid}
                  className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  Next Step <ChevronRight className="ml-2 h-5 w-5" />
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Biological Specifics */}
          {step === 2 && (
            <div className="space-y-6 animate-fadeIn">
              <div className="flex items-center gap-3 mb-6 text-teal-700">
                <Droplet className="h-6 w-6" />
                <h3 className="text-xl font-medium">Bio-Markers & Activity</h3>
              </div>

              <div className="space-y-6">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium text-gray-700">Blood Group</label>
                    <VoiceTrigger field="bloodGroup" />
                  </div>
                  <div className="grid grid-cols-4 gap-3">
                    {BLOOD_GROUPS.map(bg => (
                      <button
                        key={bg}
                        onClick={() => handleChange('bloodGroup', bg)}
                        className={`py-2 px-3 rounded-lg text-sm font-medium border transition-all ${
                          data.bloodGroup === bg
                            ? 'bg-teal-600 text-white border-teal-600 ring-2 ring-teal-200'
                            : 'bg-white text-gray-700 border-gray-300 hover:border-teal-400 hover:bg-teal-50'
                        }`}
                      >
                        {bg}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1 flex justify-between">
                    <span>Activity Level</span>
                    <VoiceTrigger field="activityLevel" className="-mt-1 -mr-1" />
                  </label>
                  <select
                    value={data.activityLevel}
                    onChange={(e) => handleChange('activityLevel', e.target.value)}
                    className="w-full rounded-lg border-gray-300 bg-white text-gray-900 shadow-sm focus:border-teal-500 focus:ring-teal-500 p-2.5 border"
                  >
                    <option value="">Select Level...</option>
                    {ACTIVITY_LEVELS.map(level => (
                      <option key={level.value} value={level.value}>{level.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-4 flex justify-between">
                <button
                  onClick={handlePrev}
                  className="inline-flex items-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 transition-all"
                >
                  <ChevronLeft className="mr-2 h-5 w-5" /> Back
                </button>
                <button
                  onClick={handleNext}
                  disabled={!isStep2Valid}
                  className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  Next Step <ChevronRight className="ml-2 h-5 w-5" />
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Diet & History */}
          {step === 3 && (
            <div className="space-y-6 animate-fadeIn">
              <div className="flex items-center gap-3 mb-6 text-teal-700">
                <Utensils className="h-6 w-6" />
                <h3 className="text-xl font-medium">Diet & Medical History</h3>
              </div>

              <div className="space-y-6">
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1 flex justify-between">
                    <span>Dietary Preferences</span>
                    <VoiceTrigger field="dietaryPreference" className="-mt-1 -mr-1" />
                  </label>
                  <select
                    value={data.dietaryPreference}
                    onChange={(e) => handleChange('dietaryPreference', e.target.value)}
                    className="w-full rounded-lg border-gray-300 bg-white text-gray-900 shadow-sm focus:border-teal-500 focus:ring-teal-500 p-2.5 border"
                  >
                    {DIETARY_PREFERENCES.map(pref => (
                      <option key={pref} value={pref}>{pref}</option>
                    ))}
                  </select>
                </div>

                <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1 flex justify-between">
                    <span>Medical Conditions or Concerns (Optional)</span>
                    <VoiceTrigger field="medicalHistory" className="-mt-1 -mr-1" />
                  </label>
                  <textarea
                    rows={4}
                    value={data.medicalHistory}
                    onChange={(e) => handleChange('medicalHistory', e.target.value)}
                    className="w-full rounded-lg border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 shadow-sm focus:border-teal-500 focus:ring-teal-500 p-2.5 border"
                    placeholder="e.g., Diabetes in family, knee pain, low blood pressure..."
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    This helps the AI tailor recommendations more safely.
                  </p>
                </div>
              </div>

              <div className="pt-4 flex justify-between">
                <button
                  onClick={handlePrev}
                  className="inline-flex items-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 transition-all"
                >
                   <ChevronLeft className="mr-2 h-5 w-5" /> Back
                </button>
                <button
                  onClick={() => onSubmit(data)}
                  className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 transition-all"
                >
                  Generate Report <Activity className="ml-2 h-5 w-5" />
                </button>
              </div>
            </div>
          )}
        </div>
        
        {/* Global Error Indicator */}
        {speechError && (
             <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-rose-600 text-white px-4 py-2 rounded-full text-sm flex items-center gap-2 shadow-lg animate-fadeIn z-10 transition-opacity">
                <AlertCircle className="h-4 w-4" />
                {speechError}
            </div>
        )}
      </div>
    </div>
  );
};

export default HealthForm;
