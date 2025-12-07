import React, { useState, useEffect, useCallback } from 'react';
import { UserProfile } from '../types';
import { BLOOD_GROUPS, ACTIVITY_LEVELS, DIETARY_PREFERENCES } from '../constants';
import { ChevronRight, ChevronLeft, User, Droplet, Activity, Utensils, Mic, MicOff, Loader2 } from 'lucide-react';

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
}

const HealthForm: React.FC<HealthFormProps> = ({ initialData, onSubmit }) => {
  const [data, setData] = useState<UserProfile>(initialData);
  const [step, setStep] = useState(1);
  const [listeningField, setListeningField] = useState<keyof UserProfile | null>(null);
  const [speechError, setSpeechError] = useState<string | null>(null);

  const handleChange = (field: keyof UserProfile, value: string) => {
    setData(prev => ({ ...prev, [field]: value }));
  };

  const handleNext = () => setStep(prev => prev + 1);
  const handlePrev = () => setStep(prev => prev - 1);

  // Voice Input Logic
  const startListening = useCallback((field: keyof UserProfile) => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert("Voice input is not supported in this browser.");
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setListeningField(field);
      setSpeechError(null);
    };

    recognition.onend = () => {
      setListeningField(null);
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error", event.error);
      setSpeechError("Could not hear you. Please try again.");
      setListeningField(null);
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript.toLowerCase();
      processVoiceInput(field, transcript);
    };

    recognition.start();
  }, [data]);

  const processVoiceInput = (field: keyof UserProfile, text: string) => {
    console.log(`Voice Input for ${field}: ${text}`);
    let value = text;

    // Parsing logic based on field type
    if (field === 'age' || field === 'weight' || field === 'height') {
      // Extract first number found
      const numberMatch = text.match(/\d+(\.\d+)?/);
      if (numberMatch) {
        value = numberMatch[0];
      }
    } else if (field === 'gender') {
      if (text.includes('female') || text.includes('woman') || text.includes('girl')) value = 'Female';
      else if (text.includes('male') || text.includes('man') || text.includes('boy')) value = 'Male';
      else if (text.includes('other')) value = 'Other';
      else value = 'Male'; // Default fallback or keep raw if unsure, but for select we need exact match usually
    } else if (field === 'bloodGroup') {
      // Normalize spoken blood groups
      let clean = text.replace('negative', '-').replace('minus', '-').replace('positive', '+').replace('plus', '+');
      // Remove spaces for things like "a positive" -> "a+"
      clean = clean.replace(/\s/g, '').toUpperCase();
      
      // Try to find a valid blood group in the string
      const match = BLOOD_GROUPS.find(bg => clean.includes(bg));
      if (match) value = match;
    } else if (field === 'activityLevel') {
      if (text.includes('sedentary') || text.includes('lazy') || text.includes('little')) value = 'sedentary';
      else if (text.includes('light')) value = 'light';
      else if (text.includes('moderate') || text.includes('medium')) value = 'moderate';
      else if (text.includes('super') || text.includes('athlete')) value = 'athlete'; // Check super active first
      else if (text.includes('active') || text.includes('hard')) value = 'active';
    } else if (field === 'dietaryPreference') {
      const match = DIETARY_PREFERENCES.find(pref => text.includes(pref.toLowerCase()));
      if (match) value = match;
    }

    handleChange(field, value);
  };

  // Reusable Voice Button Component
  const VoiceTrigger = ({ field, className = "" }: { field: keyof UserProfile, className?: string }) => {
    const isListening = listeningField === field;
    return (
      <button
        onClick={() => isListening ? null : startListening(field)}
        className={`p-2 rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
          isListening 
            ? 'bg-rose-100 text-rose-600 ring-rose-400 animate-pulse' 
            : 'text-gray-400 hover:text-teal-600 hover:bg-teal-50'
        } ${className}`}
        title="Tap to speak"
        type="button"
      >
        {isListening ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
      </button>
    );
  };

  const isStep1Valid = data.age && data.gender && data.weight && data.height;
  const isStep2Valid = data.bloodGroup && data.activityLevel;
  
  return (
    <div className="max-w-2xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
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
                        className="w-full rounded-lg border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 p-2.5 border"
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
                    className="w-full rounded-lg border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 p-2.5 border"
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
                    className="w-full rounded-lg border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 p-2.5 border"
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
                    className="w-full rounded-lg border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 p-2.5 border"
                    placeholder="cm"
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end">
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
                    className="w-full rounded-lg border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 p-2.5 border"
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
                    className="w-full rounded-lg border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 p-2.5 border"
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
                    className="w-full rounded-lg border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 p-2.5 border"
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
        
        {/* Global Speech Indicator/Error */}
        {listeningField && (
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white px-4 py-2 rounded-full text-sm flex items-center gap-2 shadow-lg animate-bounce">
                <div className="h-2 w-2 bg-red-500 rounded-full animate-ping"></div>
                Listening...
            </div>
        )}
      </div>
    </div>
  );
};

export default HealthForm;