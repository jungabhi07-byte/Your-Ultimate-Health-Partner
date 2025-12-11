import React, { useState, useEffect, useCallback, useRef } from 'react';
import { UserProfile } from '../types';
import { BLOOD_GROUPS, ACTIVITY_LEVELS, DIETARY_PREFERENCES, INITIAL_USER_PROFILE } from '../constants';
import { ChevronRight, ChevronLeft, User, Droplet, Activity, Utensils, Mic, MicOff, AlertCircle, X, Loader2 } from 'lucide-react';
import { extractProfileFromAudio } from '../services/geminiService';

interface HealthFormProps {
  initialData: UserProfile;
  onSubmit: (data: UserProfile) => void;
  onCancel: () => void;
}

// --- Audio Feedback Utilities ---
const playSuccessSound = () => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const audioCtx = new AudioContextClass();
    
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    // Pleasant "ding" (Sine wave, high pitch with decay)
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(800, audioCtx.currentTime);
    
    // Smooth ADSR envelope
    gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.15, audioCtx.currentTime + 0.05);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.5);

    oscillator.start();
    oscillator.stop(audioCtx.currentTime + 0.5);
  } catch (e) {
    console.error("Audio feedback failed", e);
  }
};

const playErrorSound = () => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const audioCtx = new AudioContextClass();
    
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    // Low "buzz" (Sawtooth wave)
    oscillator.type = 'sawtooth';
    oscillator.frequency.setValueAtTime(100, audioCtx.currentTime);
    oscillator.frequency.linearRampToValueAtTime(80, audioCtx.currentTime + 0.3);
    
    gainNode.gain.setValueAtTime(0.15, audioCtx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);

    oscillator.start();
    oscillator.stop(audioCtx.currentTime + 0.3);
  } catch (e) {
      console.error("Audio feedback failed", e);
  }
};

const HealthForm: React.FC<HealthFormProps> = ({ initialData, onSubmit, onCancel }) => {
  const [data, setData] = useState<UserProfile>(initialData);
  const [step, setStep] = useState(1);
  const [errors, setErrors] = useState<Partial<Record<keyof UserProfile, string>>>({});
  
  // 'all' for global auto-fill, specific key for single field validation
  const [listeningField, setListeningField] = useState<keyof UserProfile | 'all' | null>(null);
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
        if (!value || !value.trim()) return 'Age is required.';
        const age = Number(value);
        if (isNaN(age)) return 'Age must be a valid number.';
        if (!Number.isInteger(age)) return 'Age must be a whole number.';
        if (age < 1 || age > 120) return 'Age must be between 1 and 120.';
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

  // --- Voice Logic ---

  const startRecording = async (field: keyof UserProfile | 'all') => {
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
             await processAudio(audioBlob, field);
             stream.getTracks().forEach(track => track.stop());
        };

        mediaRecorder.start();
        setListeningField(field);
        setSpeechError(null);

    } catch (err) {
        console.error("Microphone access denied", err);
        setSpeechError("Microphone access denied or not available.");
        playErrorSound();
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
        setListeningField(null);
        setIsProcessingAudio(true);
    }
  };

  const processAudio = async (audioBlob: Blob, targetField: keyof UserProfile | 'all') => {
    try {
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
            const base64String = (reader.result as string).split(',')[1];
            
            setIsProcessingAudio(true);
            
            // If targetField is 'all', we pass undefined to focusedField to trigger global extraction
            // If targetField is a specific key, we pass it as focusedField to trigger targeted extraction
            const focusedField = targetField === 'all' ? undefined : targetField;
            
            const profileData = await extractProfileFromAudio(base64String, audioBlob.type, focusedField);
            
            setIsProcessingAudio(false);

            if (Object.keys(profileData).length === 0) {
                 setSpeechError(targetField === 'all' ? "No valid health data detected." : `Could not understand input for ${targetField}.`);
                 playErrorSound();
                 return;
            }

            let updateCount = 0;
            
            // Iterate through returned data and update matching fields
            Object.entries(profileData).forEach(([key, value]) => {
                 if (value !== undefined && value !== null && value !== '' && (INITIAL_USER_PROFILE as any).hasOwnProperty(key)) {
                    const field = key as keyof UserProfile;
                    
                    // Extra check: if we are in targeted mode, ONLY update the target field
                    if (targetField !== 'all' && field !== targetField) {
                        return;
                    }

                    handleChange(field, String(value));
                    updateCount++;
                 }
            });

            if (updateCount > 0) {
                setSpeechError(null);
                playSuccessSound();
            } else {
                setSpeechError("Could not map voice input to fields.");
                playErrorSound();
            }
        };
    } catch (error) {
        console.error("Processing failed", error);
        setIsProcessingAudio(false);
        setSpeechError("Failed to process audio.");
        playErrorSound();
    }
  };

  const renderMicButton = (field: keyof UserProfile, className: string = "absolute right-2 top-1/2 -translate-y-1/2") => {
    // Explicitly cast to string to avoid "no overlap" error between keyof UserProfile and 'all' if TS infers incorrectly
    const isListening = (listeningField as string) === field;
    return (
        <button
            type="button"
            onClick={() => isListening ? stopRecording() : startRecording(field)}
            className={`${className} p-1.5 rounded-full transition-all z-10 ${
                isListening 
                ? 'bg-rose-100 text-rose-600 animate-pulse ring-2 ring-rose-400' 
                : 'text-gray-400 hover:text-teal-600 hover:bg-teal-50'
            }`}
            title="Tap to speak"
        >
            {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
        </button>
    );
  };

  // Explicitly cast to string to avoid "no overlap" error
  const isGlobalListening = (listeningField as string) === 'all';

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100 relative">
        
        {/* Progress Bar & Auto-Fill Header */}
        <div className="bg-gray-50 px-8 py-4 border-b border-gray-100 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-800">Your Health Profile</h2>
            
            <div className="flex items-center gap-4">
                 <button
                    onClick={() => isGlobalListening ? stopRecording() : startRecording('all')}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                        isGlobalListening 
                        ? 'bg-rose-100 text-rose-600 ring-2 ring-rose-400 animate-pulse' 
                        : isProcessingAudio && (listeningField as string) === 'all'
                            ? 'bg-gray-200 text-gray-500' 
                            : 'bg-teal-100 text-teal-700 hover:bg-teal-200'
                    }`}
                >
                    {isGlobalListening ? <MicOff className="h-3 w-3" /> : (isProcessingAudio && (listeningField as string) === 'all') ? <Loader2 className="h-3 w-3 animate-spin" /> : <Mic className="h-3 w-3" />}
                    {isGlobalListening ? 'Stop Recording' : (isProcessingAudio && (listeningField as string) === 'all') ? 'Analyzing...' : 'Auto-Fill with Voice'}
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
                        className={`w-full rounded-lg bg-white text-gray-900 placeholder:text-gray-400 shadow-sm p-2.5 pr-10 border ${errors.age ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500' : 'border-gray-300 focus:border-teal-500 focus:ring-teal-500'}`}
                        placeholder="Years"
                    />
                    {renderMicButton('age')}
                  </div>
                  {errors.age && (
                    <p className="mt-1 text-xs text-rose-500 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" /> {errors.age}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                  <div className="relative">
                    <select
                        value={data.gender}
                        onChange={(e) => handleChange('gender', e.target.value)}
                        onBlur={() => handleBlur('gender')}
                        className={`w-full rounded-lg bg-white text-gray-900 shadow-sm p-2.5 pr-10 border ${errors.gender ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500' : 'border-gray-300 focus:border-teal-500 focus:ring-teal-500'} appearance-none`}
                    >
                        <option value="">Select...</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                    </select>
                    {/* Custom Arrow for select to avoid overlap with Mic */}
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                        <svg className="fill-current h-4 w-4 mr-8" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                    </div>
                    {renderMicButton('gender', "absolute right-1 top-1/2 -translate-y-1/2")}
                  </div>
                  {errors.gender && (
                    <p className="mt-1 text-xs text-rose-500 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" /> {errors.gender}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Weight (kg)</label>
                  <div className="relative">
                    <input
                        type="number"
                        value={data.weight}
                        onChange={(e) => handleChange('weight', e.target.value)}
                        onBlur={() => handleBlur('weight')}
                        className={`w-full rounded-lg bg-white text-gray-900 placeholder:text-gray-400 shadow-sm p-2.5 pr-10 border ${errors.weight ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500' : 'border-gray-300 focus:border-teal-500 focus:ring-teal-500'}`}
                        placeholder="kg"
                    />
                    {renderMicButton('weight')}
                  </div>
                  {errors.weight && (
                    <p className="mt-1 text-xs text-rose-500 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" /> {errors.weight}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Height (cm)</label>
                  <div className="relative">
                    <input
                        type="number"
                        value={data.height}
                        onChange={(e) => handleChange('height', e.target.value)}
                        onBlur={() => handleBlur('height')}
                        className={`w-full rounded-lg bg-white text-gray-900 placeholder:text-gray-400 shadow-sm p-2.5 pr-10 border ${errors.height ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500' : 'border-gray-300 focus:border-teal-500 focus:ring-teal-500'}`}
                        placeholder="cm"
                    />
                    {renderMicButton('height')}
                  </div>
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
                    <label className="block text-sm font-medium text-gray-700 flex items-center gap-2">
                        Blood Group
                        {renderMicButton('bloodGroup', "relative ml-2")}
                    </label>
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
                   <div className="relative">
                        <select
                            value={data.activityLevel}
                            onChange={(e) => handleChange('activityLevel', e.target.value)}
                            onBlur={() => handleBlur('activityLevel')}
                            className={`w-full rounded-lg bg-white text-gray-900 shadow-sm p-2.5 pr-10 border ${errors.activityLevel ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500' : 'border-gray-300 focus:border-teal-500 focus:ring-teal-500'} appearance-none`}
                        >
                            <option value="">Select Level...</option>
                            {ACTIVITY_LEVELS.map(level => (
                            <option key={level.value} value={level.value}>{level.label}</option>
                            ))}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                            <svg className="fill-current h-4 w-4 mr-8" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                        </div>
                        {renderMicButton('activityLevel', "absolute right-1 top-1/2 -translate-y-1/2")}
                   </div>
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
                   <div className="relative">
                        <select
                            value={data.dietaryPreference}
                            onChange={(e) => handleChange('dietaryPreference', e.target.value)}
                            onBlur={() => handleBlur('dietaryPreference')}
                            className={`w-full rounded-lg bg-white text-gray-900 shadow-sm p-2.5 pr-10 border ${errors.dietaryPreference ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500' : 'border-gray-300 focus:border-teal-500 focus:ring-teal-500'} appearance-none`}
                        >
                            {DIETARY_PREFERENCES.map(pref => (
                            <option key={pref} value={pref}>{pref}</option>
                            ))}
                        </select>
                         <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                            <svg className="fill-current h-4 w-4 mr-8" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                        </div>
                        {renderMicButton('dietaryPreference', "absolute right-1 top-1/2 -translate-y-1/2")}
                   </div>
                  {errors.dietaryPreference && (
                    <p className="mt-1 text-xs text-rose-500 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" /> {errors.dietaryPreference}
                    </p>
                  )}
                </div>

                <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">Medical Conditions or Concerns (Optional)</label>
                   <div className="relative">
                        <textarea
                            rows={3}
                            value={data.medicalHistory}
                            onChange={(e) => handleChange('medicalHistory', e.target.value)}
                            onBlur={() => handleBlur('medicalHistory')}
                            className={`w-full rounded-lg bg-white text-gray-900 placeholder:text-gray-400 shadow-sm p-2.5 pr-10 border ${errors.medicalHistory ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500' : 'border-gray-300 focus:border-teal-500 focus:ring-teal-500'}`}
                            placeholder="e.g., Diabetes in family, knee pain, low blood pressure..."
                        />
                        {renderMicButton('medicalHistory', "absolute right-2 top-2")}
                   </div>
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
             <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-rose-600 text-white px-4 py-2 rounded-full text-sm flex items-center gap-2 shadow-lg animate-fadeIn z-20 transition-opacity">
                <AlertCircle className="h-4 w-4" />
                {speechError}
            </div>
        )}
      </div>
    </div>
  );
};

export default HealthForm;