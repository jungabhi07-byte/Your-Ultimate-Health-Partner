import React, { useState, useEffect, useCallback, useRef } from 'react';
import { UserProfile } from '../types';
import { BLOOD_GROUPS, ACTIVITY_LEVELS, DIETARY_PREFERENCES } from '../constants';
import { ChevronRight, ChevronLeft, User, Droplet, Activity, Utensils, Mic, MicOff, AlertCircle, X, Loader2 } from 'lucide-react';
import { transcribeUserAudio } from '../services/geminiService';

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
  const [errors, setErrors] = useState<Partial<Record<keyof UserProfile, string>>>({});
  
  const [listeningField, setListeningField] = useState<keyof UserProfile | null>(null);
  const [isProcessingAudio, setIsProcessingAudio] = useState(false);
  const [speechError, setSpeechError] = useState<string | null>(null);
  
  // Ref to store MediaRecorder
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    if (speechError) {
      const timer = setTimeout(() => setSpeechError(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [speechError]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
        if (mediaRecorderRef.current.stream) {
            mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
        }
      }
    };
  }, []);

  const validateField = (field: keyof UserProfile, value: string): string => {
    switch (field) {
      case 'age':
        if (!value) return 'Age is required.';
        const age = Number(value);
        if (isNaN(age) || age < 1 || age > 120) return 'Age must be between 1 and 120.';
        return '';
      case 'gender':
        return value ? '' : 'Gender is required.';
      case 'weight':
        if (!value) return 'Weight is required.';
        const weight = Number(value);
        if (isNaN(weight) || weight < 2 || weight > 500) return 'Weight must be between 2kg and 500kg.';
        return '';
      case 'height':
        if (!value) return 'Height is required.';
        const height = Number(value);
        if (isNaN(height) || height < 30 || height > 300) return 'Height must be between 30cm and 300cm.';
        return '';
      case 'bloodGroup':
        return value ? '' : 'Blood Group is required.';
      case 'activityLevel':
        return value ? '' : 'Activity Level is required.';
      case 'dietaryPreference':
        return value ? '' : 'Dietary Preference is required.';
      case 'medicalHistory':
        if (value && value.length > 500) return 'Medical history is too long (max 500 chars).';
        return '';
      default:
        return '';
    }
  };

  const validateCurrentStep = () => {
    const newErrors: Partial<Record<keyof UserProfile, string>> = {};
    let isValid = true;

    if (step === 1) {
      const fields: (keyof UserProfile)[] = ['age', 'gender', 'weight', 'height'];
      fields.forEach(field => {
        const error = validateField(field, data[field]);
        if (error) {
          newErrors[field] = error;
          isValid = false;
        }
      });
    } else if (step === 2) {
      const fields: (keyof UserProfile)[] = ['bloodGroup', 'activityLevel'];
      fields.forEach(field => {
        const error = validateField(field, data[field]);
        if (error) {
          newErrors[field] = error;
          isValid = false;
        }
      });
    } else if (step === 3) {
      const fields: (keyof UserProfile)[] = ['dietaryPreference', 'medicalHistory'];
      fields.forEach(field => {
        const error = validateField(field, data[field]);
        if (error) {
          newErrors[field] = error;
          isValid = false;
        }
      });
    }

    setErrors(prev => ({ ...prev, ...newErrors }));
    return isValid;
  };

  const validateAllSteps = () => {
    const newErrors: Partial<Record<keyof UserProfile, string>> = {};
    let isValid = true;
    let firstInvalidStep = 0;

    // Validate Step 1
    const step1Fields: (keyof UserProfile)[] = ['age', 'gender', 'weight', 'height'];
    step1Fields.forEach(field => {
        const error = validateField(field, data[field]);
        if (error) {
            newErrors[field] = error;
            isValid = false;
            if (firstInvalidStep === 0) firstInvalidStep = 1;
        }
    });

    // Validate Step 2
    const step2Fields: (keyof UserProfile)[] = ['bloodGroup', 'activityLevel'];
    step2Fields.forEach(field => {
        const error = validateField(field, data[field]);
        if (error) {
            newErrors[field] = error;
            isValid = false;
            if (firstInvalidStep === 0) firstInvalidStep = 2;
        }
    });

    // Validate Step 3
    const step3Fields: (keyof UserProfile)[] = ['dietaryPreference', 'medicalHistory'];
    step3Fields.forEach(field => {
        const error = validateField(field, data[field]);
        if (error) {
            newErrors[field] = error;
            isValid = false;
            if (firstInvalidStep === 0) firstInvalidStep = 3;
        }
    });

    setErrors(newErrors);

    // Auto-navigate to the first step with an error
    if (!isValid && firstInvalidStep > 0) {
        setStep(firstInvalidStep);
        setSpeechError(`Please correct errors in Step ${firstInvalidStep} before submitting.`);
    }

    return isValid;
  };

  const handleChange = (field: keyof UserProfile, value: string) => {
    setData(prev => ({ ...prev, [field]: value }));
    
    // Real-time validation
    const error = validateField(field, value);
    
    setErrors(prev => {
      const newErrors = { ...prev };
      if (error) {
        newErrors[field] = error;
      } else {
        delete newErrors[field];
      }
      return newErrors;
    });
  };

  const handleBlur = (field: keyof UserProfile) => {
    const error = validateField(field, data[field]);
    if (error) {
      setErrors(prev => ({ ...prev, [field]: error }));
    }
  };

  const handleNextStep = () => {
    if (validateCurrentStep()) {
      setStep(prev => prev + 1);
    }
  };

  const handlePrevStep = () => setStep(prev => prev - 1);

  const handleFinalSubmit = () => {
    // Validate everything, not just the current step
    if (validateAllSteps()) {
      onSubmit(data);
    }
  };

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

  // --- Voice Auto-Fill Logic (Consolidated) ---
  const handleGlobalVoiceInput = async () => {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];

        mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                audioChunksRef.current.push(event.data);
            }
        };

        mediaRecorder.onstop = async () => {
             const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
             await processGlobalAudio(audioBlob);
             stream.getTracks().forEach(track => track.stop());
        };

        mediaRecorder.start();
        setListeningField('age'); // Use 'age' as a placeholder to indicate listening state globally
        setSpeechError(null);

    } catch (err) {
        console.error("Microphone access denied", err);
        setSpeechError("Microphone access denied or not available.");
    }
  };

  const stopGlobalRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
        setListeningField(null);
        setIsProcessingAudio(true);
    }
  };

  const processGlobalAudio = async (audioBlob: Blob) => {
    try {
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
            const base64String = (reader.result as string).split(',')[1];
            // 1. Transcribe
            const transcript = await transcribeUserAudio(base64String, audioBlob.type);
            setIsProcessingAudio(false);
            
            if (transcript) {
                console.log("Global Transcript:", transcript);
                // 2. Parse all fields from the single transcript
                // Note: We reuse the parsing logic but apply it sequentially based on keywords found
                
                // Attempt to find numbers
                const numbers = transcript.match(/(\d+(\.\d+)?)/g) || [];
                
                // Heuristic: First number between 1-100 might be age
                const potentialAge = numbers.find(n => { const v=parseFloat(n); return v > 0 && v < 120; });
                if (potentialAge && !data.age) handleChange('age', potentialAge);
                
                // Heuristic: Larger numbers might be weight/height. This is tricky without more context or advanced NLP,
                // but for now, let's rely on specific parsers if we can, or just gender/blood type which are unique.
                
                processVoiceInput('gender', transcript);
                processVoiceInput('bloodGroup', transcript);
                processVoiceInput('activityLevel', transcript);
                processVoiceInput('dietaryPreference', transcript);
                
                // If it's a long sentence, it might be medical history if currently on step 3
                if (step === 3 && transcript.length > 20) {
                     processVoiceInput('medicalHistory', transcript);
                }

                setSpeechError("Voice data applied. Please review fields.");
            } else {
                setSpeechError("Could not understand audio.");
            }
        };
    } catch (error) {
        console.error("Processing failed", error);
        setIsProcessingAudio(false);
        setSpeechError("Failed to process audio.");
    }
  };

  const processVoiceInput = (field: keyof UserProfile, text: string) => {
    // ... existing processVoiceInput logic (reuse your existing one)
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
          { value: 'Female', keywords: ['female', 'woman', 'girl', 'she', 'her', 'lady'] },
          { value: 'Male', keywords: ['male', 'man', 'boy', 'he', 'him', 'guy'] },
          { value: 'Other', keywords: ['other', 'non-binary', 'diverse'] }
        ]);
        break;
      case 'bloodGroup':
         let cleanBg = text.toLowerCase()
            .replace(/positive|plus|pos/, '+')
            .replace(/negative|minus|neg/, '-')
            .replace(/type/, '')
            .replace(/\s/g, '')
            .toUpperCase();
         const sortedGroups = [...BLOOD_GROUPS].sort((a, b) => b.length - a.length);
         const foundBg = sortedGroups.find(bg => cleanBg.includes(bg));
         if (foundBg) result = { valid: true, value: foundBg };
        break;
      case 'activityLevel':
        result = parseOption(text, [
          { value: 'sedentary', keywords: ['sedentary', 'lazy', 'none', 'sitting', 'couch', 'little'] },
          { value: 'light', keywords: ['light', 'mild', 'walk', 'easy', 'occasional'] },
          { value: 'moderate', keywords: ['moderate', 'medium', 'average', 'normal', 'regular'] },
          { value: 'athlete', keywords: ['super', 'athlete', 'pro', 'intense', 'very active', 'training'] },
          { value: 'active', keywords: ['active', 'hard', 'heavy', 'gym', 'sport'] } 
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
        // Only update if current value is empty or we are explicit
        handleChange(field, result.value);
    }
  };

  const isGlobalListening = listeningField !== null;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100 relative">
        
        {/* Progress Bar & Auto-Fill Header */}
        <div className="bg-gray-50 px-8 py-4 border-b border-gray-100 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-800">Your Health Profile</h2>
            
            <div className="flex items-center gap-4">
                 <button
                    onClick={() => isGlobalListening ? stopGlobalRecording() : handleGlobalVoiceInput()}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                        isGlobalListening 
                        ? 'bg-rose-100 text-rose-600 ring-2 ring-rose-400 animate-pulse' 
                        : isProcessingAudio 
                            ? 'bg-gray-200 text-gray-500' 
                            : 'bg-teal-100 text-teal-700 hover:bg-teal-200'
                    }`}
                >
                    {isGlobalListening ? <MicOff className="h-3 w-3" /> : isProcessingAudio ? <Loader2 className="h-3 w-3 animate-spin" /> : <Mic className="h-3 w-3" />}
                    {isGlobalListening ? 'Stop Recording' : isProcessingAudio ? 'Processing...' : 'Auto-Fill with Voice'}
                </button>

                <div className="flex gap-2">
                    {[1, 2, 3].map(i => (
                        <div key={i} className={`h-2 w-8 rounded-full transition-colors ${step >= i ? 'bg-teal-600' : 'bg-gray-200'}`} />
                    ))}
                </div>
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
                  <div className="relative">
                    <input
                        type="number"
                        value={data.age}
                        onChange={(e) => handleChange('age', e.target.value)}
                        onBlur={() => handleBlur('age')}
                        className={`w-full rounded-lg bg-white text-gray-900 placeholder:text-gray-400 shadow-sm p-2.5 border ${errors.age ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500' : 'border-gray-300 focus:border-teal-500 focus:ring-teal-500'}`}
                        placeholder="Years"
                    />
                  </div>
                  {errors.age && (
                    <p className="mt-1 text-xs text-rose-500 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" /> {errors.age}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                  <select
                    value={data.gender}
                    onChange={(e) => handleChange('gender', e.target.value)}
                    onBlur={() => handleBlur('gender')}
                    className={`w-full rounded-lg bg-white text-gray-900 shadow-sm p-2.5 border ${errors.gender ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500' : 'border-gray-300 focus:border-teal-500 focus:ring-teal-500'}`}
                  >
                    <option value="">Select...</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                  {errors.gender && (
                    <p className="mt-1 text-xs text-rose-500 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" /> {errors.gender}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Weight (kg)</label>
                  <input
                    type="number"
                    value={data.weight}
                    onChange={(e) => handleChange('weight', e.target.value)}
                    onBlur={() => handleBlur('weight')}
                    className={`w-full rounded-lg bg-white text-gray-900 placeholder:text-gray-400 shadow-sm p-2.5 border ${errors.weight ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500' : 'border-gray-300 focus:border-teal-500 focus:ring-teal-500'}`}
                    placeholder="kg"
                  />
                  {errors.weight && (
                    <p className="mt-1 text-xs text-rose-500 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" /> {errors.weight}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Height (cm)</label>
                  <input
                    type="number"
                    value={data.height}
                    onChange={(e) => handleChange('height', e.target.value)}
                    onBlur={() => handleBlur('height')}
                    className={`w-full rounded-lg bg-white text-gray-900 placeholder:text-gray-400 shadow-sm p-2.5 border ${errors.height ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500' : 'border-gray-300 focus:border-teal-500 focus:ring-teal-500'}`}
                    placeholder="cm"
                  />
                  {errors.height && (
                    <p className="mt-1 text-xs text-rose-500 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" /> {errors.height}
                    </p>
                  )}
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
                  onClick={handleNextStep}
                  className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 transition-all"
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
                  {errors.bloodGroup && (
                    <p className="mt-1 text-xs text-rose-500 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" /> {errors.bloodGroup}
                    </p>
                  )}
                </div>

                <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">Activity Level</label>
                  <select
                    value={data.activityLevel}
                    onChange={(e) => handleChange('activityLevel', e.target.value)}
                    onBlur={() => handleBlur('activityLevel')}
                    className={`w-full rounded-lg bg-white text-gray-900 shadow-sm p-2.5 border ${errors.activityLevel ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500' : 'border-gray-300 focus:border-teal-500 focus:ring-teal-500'}`}
                  >
                    <option value="">Select Level...</option>
                    {ACTIVITY_LEVELS.map(level => (
                      <option key={level.value} value={level.value}>{level.label}</option>
                    ))}
                  </select>
                  {errors.activityLevel && (
                    <p className="mt-1 text-xs text-rose-500 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" /> {errors.activityLevel}
                    </p>
                  )}
                </div>
              </div>

              <div className="pt-4 flex justify-between">
                <button
                  onClick={handlePrevStep}
                  className="inline-flex items-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 transition-all"
                >
                  <ChevronLeft className="mr-2 h-5 w-5" /> Back
                </button>
                <button
                  onClick={handleNextStep}
                  className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 transition-all"
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
                <h3 className="text-xl font-medium">Diet & Preferences</h3>
              </div>

              <div className="space-y-6">
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">Dietary Preferences</label>
                  <select
                    value={data.dietaryPreference}
                    onChange={(e) => handleChange('dietaryPreference', e.target.value)}
                    onBlur={() => handleBlur('dietaryPreference')}
                    className={`w-full rounded-lg bg-white text-gray-900 shadow-sm p-2.5 border ${errors.dietaryPreference ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500' : 'border-gray-300 focus:border-teal-500 focus:ring-teal-500'}`}
                  >
                    {DIETARY_PREFERENCES.map(pref => (
                      <option key={pref} value={pref}>{pref}</option>
                    ))}
                  </select>
                  {errors.dietaryPreference && (
                    <p className="mt-1 text-xs text-rose-500 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" /> {errors.dietaryPreference}
                    </p>
                  )}
                </div>

                <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">Medical Conditions or Concerns (Optional)</label>
                  <textarea
                    rows={3}
                    value={data.medicalHistory}
                    onChange={(e) => handleChange('medicalHistory', e.target.value)}
                    onBlur={() => handleBlur('medicalHistory')}
                    className={`w-full rounded-lg bg-white text-gray-900 placeholder:text-gray-400 shadow-sm p-2.5 border ${errors.medicalHistory ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500' : 'border-gray-300 focus:border-teal-500 focus:ring-teal-500'}`}
                    placeholder="e.g., Diabetes in family, knee pain, low blood pressure..."
                  />
                   {errors.medicalHistory && (
                    <p className="mt-1 text-xs text-rose-500 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" /> {errors.medicalHistory}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-gray-500">
                    This helps the AI tailor recommendations more safely.
                  </p>
                </div>
              </div>

              <div className="pt-4 flex justify-between">
                <button
                  onClick={handlePrevStep}
                  className="inline-flex items-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 transition-all"
                >
                   <ChevronLeft className="mr-2 h-5 w-5" /> Back
                </button>
                <button
                  onClick={handleFinalSubmit}
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