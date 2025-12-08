import React, { useState, useRef, useEffect } from 'react';
import { HealthReport } from '../types';
import { 
  AlertTriangle, 
  CheckCircle, 
  Calendar, 
  Moon, 
  Sun, 
  Utensils, 
  Activity, 
  Droplet,
  Play,
  Pause,
  ExternalLink,
  Loader2,
  Image as ImageIcon,
  ArrowLeft,
  TrendingUp,
  Volume2
} from 'lucide-react';
import { generateAudioSummary } from '../services/geminiService';
import HealthChart from './HealthChart';

interface ReportDashboardProps {
  report: HealthReport;
  previousReport?: HealthReport | null;
  onReset: () => void;
}

const ReportDashboard: React.FC<ReportDashboardProps> = ({ report, previousReport, onReset }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  // Store the raw base64 string to avoid repeated fetches
  const [preloadedAudioBase64, setPreloadedAudioBase64] = useState<string | null>(null);
  
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const startTimeRef = useRef<number>(0);
  const pausedTimeRef = useRef<number>(0);
  const rafRef = useRef<number>(0);

  // Pre-fetch audio when report loads
  useEffect(() => {
    let isMounted = true;
    const fetchAudio = async () => {
        if (!report.summary) return;
        try {
            // Background fetch - do not set global loading state to avoid blocking UI
            const base64Audio = await generateAudioSummary(report.summary);
            if (isMounted) {
                setPreloadedAudioBase64(base64Audio);
            }
        } catch (err) {
            console.warn("Background audio fetch failed", err);
        }
    };
    
    // Only fetch if we haven't already
    if (!preloadedAudioBase64) {
        fetchAudio();
    }
    
    return () => { isMounted = false; };
  }, [report.summary]);

  // Animation Loop for Progress Bar
  useEffect(() => {
    const animate = () => {
        if (audioContext && isPlaying) {
            const elapsed = audioContext.currentTime - startTimeRef.current;
            // Clamp to duration
            const current = Math.min(elapsed, duration);
            setCurrentTime(current);
            rafRef.current = requestAnimationFrame(animate);
        }
    };

    if (isPlaying) {
        rafRef.current = requestAnimationFrame(animate);
    } else {
        cancelAnimationFrame(rafRef.current);
    }

    return () => cancelAnimationFrame(rafRef.current);
  }, [isPlaying, audioContext, duration]);

  // Calculate Chart Data based on report metrics
  const calculateMetrics = (r: HealthReport) => {
      const bmiScore = r.bmiCategory === 'Normal' ? 95 : 
                       r.bmiCategory === 'Overweight' ? 75 : 
                       r.bmiCategory === 'Underweight' ? 70 : 50;
      
      const riskScore = Math.max(20, 100 - (r.potentialRisks.length * 15));
      const strengthScore = Math.min(100, 50 + (r.keyStrengths.length * 10));
      const routineScore = Math.min(100, 60 + (r.dailyRoutine.length * 5));
      
      return { bmiScore, riskScore, strengthScore, routineScore };
  };

  const currentMetrics = calculateMetrics(report);
  
  // Calculate previous metrics if they represent a DIFFERENT assessment (check date)
  let previousMetrics = null;
  // Simple check: if we have a previous report and it's not the exact same date stamp (or object ref)
  if (previousReport && previousReport.date !== report.date) {
      previousMetrics = calculateMetrics(previousReport);
  }

  const chartData = [
    { 
        subject: 'Overall Wellness', 
        value: report.overallHealthScore, 
        previousValue: previousMetrics ? previousReport?.overallHealthScore : undefined,
        fullMark: 100 
    },
    { 
        subject: 'BMI Health', 
        value: currentMetrics.bmiScore, 
        previousValue: previousMetrics?.bmiScore,
        fullMark: 100 
    },
    { 
        subject: 'Risk Control', 
        value: currentMetrics.riskScore, 
        previousValue: previousMetrics?.riskScore,
        fullMark: 100 
    },
    { 
        subject: 'Vitality', 
        value: currentMetrics.strengthScore, 
        previousValue: previousMetrics?.strengthScore,
        fullMark: 100 
    },
    { 
        subject: 'Lifestyle', 
        value: currentMetrics.routineScore, 
        previousValue: previousMetrics?.routineScore,
        fullMark: 100 
    },
  ];

  const getIconForActivity = (type: string) => {
    switch (type) {
      case 'diet': return <Utensils className="h-5 w-5 text-green-500" />;
      case 'exercise': return <Activity className="h-5 w-5 text-blue-500" />;
      case 'lifestyle': return <Sun className="h-5 w-5 text-orange-500" />;
      case 'mindfulness': return <Moon className="h-5 w-5 text-indigo-500" />;
      default: return <CheckCircle className="h-5 w-5 text-gray-500" />;
    }
  };

  const getTimeIcon = (time: string) => {
    const t = time.toLowerCase();
    if (t.includes('morning')) return <Sun className="h-5 w-5 text-amber-500" />;
    if (t.includes('afternoon')) return <Sun className="h-5 w-5 text-yellow-500" />;
    if (t.includes('evening') || t.includes('night')) return <Moon className="h-5 w-5 text-indigo-500" />;
    return <Calendar className="h-5 w-5 text-gray-400" />;
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (sourceNodeRef.current) {
        sourceNodeRef.current.stop();
      }
      if (audioContext && audioContext.state !== 'closed') {
        audioContext.close();
      }
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const decodePCM = (base64Data: string, ctx: AudioContext): AudioBuffer => {
    const binaryString = atob(base64Data);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    // Safety check for odd-length buffers which can crash Int16Array
    const effectiveLen = len % 2 !== 0 ? len - 1 : len;
    
    // Convert to 16-bit PCM
    const int16Data = new Int16Array(bytes.buffer, 0, effectiveLen / 2);
    const sampleRate = 24000; 
    const numChannels = 1;
    
    const buffer = ctx.createBuffer(numChannels, int16Data.length, sampleRate);
    const channelData = buffer.getChannelData(0);
    
    for (let i = 0; i < int16Data.length; i++) {
      channelData[i] = int16Data[i] / 32768.0;
    }
    
    return buffer;
  };

  const handlePlayAudio = async () => {
    if (isPlaying) {
      if (sourceNodeRef.current && audioContext) {
        try {
            sourceNodeRef.current.stop();
        } catch (e) {
            // ignore
        }
        const elapsed = audioContext.currentTime - startTimeRef.current;
        pausedTimeRef.current = elapsed;
        setCurrentTime(elapsed); // Sync visual state
        setIsPlaying(false);
      }
      return;
    }

    let ctx = audioContext;
    if (!ctx) {
        ctx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        setAudioContext(ctx);
    }

    if (ctx.state === 'suspended') {
        await ctx.resume();
    }

    if (!audioBuffer) {
      // Logic: Use preloaded data if available, otherwise fetch
      const dataToDecode = preloadedAudioBase64;
      
      if (!dataToDecode) {
          setIsLoadingAudio(true);
          try {
            const base64Audio = await generateAudioSummary(report.summary);
            const decodedBuffer = decodePCM(base64Audio, ctx);
            setAudioBuffer(decodedBuffer);
            setDuration(decodedBuffer.duration);
            playBuffer(ctx, decodedBuffer, 0);
          } catch (err) {
            console.error("Audio playback failed", err);
            // Silent fail to UI, or show toast
          } finally {
            setIsLoadingAudio(false);
          }
      } else {
          // Fast path: Data already downloaded
          try {
            const decodedBuffer = decodePCM(dataToDecode, ctx);
            setAudioBuffer(decodedBuffer);
            setDuration(decodedBuffer.duration);
            playBuffer(ctx, decodedBuffer, 0);
          } catch (err) {
             console.error("Audio decode failed", err);
          }
      }
    } else {
      // If completed, restart. If paused, resume.
      // If we reached the end visually (approx), reset to 0
      const startOffset = currentTime >= duration ? 0 : pausedTimeRef.current;
      playBuffer(ctx, audioBuffer, startOffset);
    }
  };

  const playBuffer = (ctx: AudioContext, buffer: AudioBuffer, startOffset: number) => {
    if (sourceNodeRef.current) {
        try { sourceNodeRef.current.stop(); } catch(e) {}
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    
    source.onended = () => {
       // Only handle naturally ending, not forced stops via button
    };

    source.start(0, startOffset);
    startTimeRef.current = ctx.currentTime - startOffset;
    sourceNodeRef.current = source;
    setIsPlaying(true);
    
    const durationRemaining = buffer.duration - startOffset;
    
    // Auto reset when done
    setTimeout(() => {
        if (sourceNodeRef.current === source) {
             setIsPlaying(false);
             pausedTimeRef.current = 0;
             setCurrentTime(0);
        }
    }, durationRemaining * 1000 + 200); 
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 space-y-8 animate-fadeIn">
      
      {/* Back to Home Header */}
      <div>
        <button 
          onClick={onReset}
          className="flex items-center text-gray-500 hover:text-teal-600 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          <span>Back to Home</span>
        </button>
      </div>

      {/* Header Visual & Summary */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        {report.visualBase64 ? (
            <div className="h-64 w-full overflow-hidden relative group">
                <img 
                    src={`data:image/png;base64,${report.visualBase64}`} 
                    alt="Health Visualization" 
                    className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-8">
                    <div className="text-white">
                        <h1 className="text-3xl font-bold">Your Health Report</h1>
                        <p className="opacity-90">AI-generated visualization of your wellness status</p>
                    </div>
                </div>
            </div>
        ) : (
            <div className="h-32 bg-gradient-to-r from-teal-600 to-teal-800 p-8 flex items-end">
                <h1 className="text-3xl font-bold text-white">Your Health Report</h1>
            </div>
        )}

        <div className="p-8 md:flex gap-8 items-stretch">
          <div className="flex-1 space-y-4">
            
            {/* Audio Player Controls */}
            <div className="flex flex-col gap-2 w-full max-w-lg mb-4 bg-gray-50 p-3 rounded-xl border border-gray-100">
               <div className="flex items-center gap-3">
                    <button 
                        onClick={handlePlayAudio}
                        disabled={isLoadingAudio}
                        className={`flex-shrink-0 flex items-center justify-center h-10 w-10 rounded-full transition-all ${
                            isPlaying 
                            ? 'bg-rose-100 text-rose-600 hover:bg-rose-200' 
                            : 'bg-teal-600 text-white hover:bg-teal-700 shadow-md hover:shadow-lg'
                        }`}
                        title={isPlaying ? "Pause" : "Play Summary"}
                    >
                        {isLoadingAudio ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : isPlaying ? (
                            <Pause className="h-4 w-4 fill-current" />
                        ) : (
                            <Play className="h-4 w-4 fill-current ml-0.5" />
                        )}
                    </button>
                    
                    <div className="flex-1">
                        <div className="flex justify-between items-center text-xs font-medium text-gray-500 mb-1.5">
                            <span>{isPlaying ? 'Playing Summary...' : (currentTime > 0 ? 'Paused' : 'Listen to AI Summary')}</span>
                            {(duration > 0) && (
                                <span>{formatTime(currentTime)} / {formatTime(duration)}</span>
                            )}
                        </div>
                        {/* Progress Bar */}
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden relative">
                            <div 
                                className={`absolute top-0 left-0 h-full rounded-full transition-all duration-100 ease-linear ${isPlaying ? 'bg-teal-500' : 'bg-gray-400'}`}
                                style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
                            />
                        </div>
                    </div>
               </div>
               {!report.visualBase64 && !preloadedAudioBase64 && !isLoadingAudio && (
                   <div className="text-[10px] text-gray-400 pl-1">
                      Audio generating in background...
                   </div>
               )}
            </div>
            
            <div className="flex items-center gap-2">
                 <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                    report.bmiCategory === 'Normal' ? 'bg-green-100 text-green-800' : 
                    report.bmiCategory.includes('Over') ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                 }`}>
                    BMI: {report.bmi.toFixed(1)} ({report.bmiCategory})
                 </span>
            </div>
            <p className="text-gray-600 leading-relaxed text-lg">{report.summary}</p>
            
            {/* Trend Analysis Section - Shows "Learning Adaptability" */}
            {report.trendAnalysis && (
                <div className="mt-4 p-4 bg-indigo-50 rounded-lg border border-indigo-100 flex items-start gap-3">
                    <TrendingUp className="h-5 w-5 text-indigo-600 flex-shrink-0 mt-0.5" />
                    <div>
                        <h4 className="font-semibold text-indigo-900 text-sm">Progress & Adaptability</h4>
                        <p className="text-indigo-800 text-sm">{report.trendAnalysis}</p>
                    </div>
                </div>
            )}
          </div>
          
          <div className="mt-8 md:mt-0 md:w-1/3 flex flex-col items-center justify-center p-4 bg-slate-50 rounded-xl border border-gray-100 relative min-h-[250px]">
             {/* Simple Statistical Visuals */}
             <HealthChart data={chartData} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Risks & Strengths Column */}
        <div className="lg:col-span-1 space-y-8">
           <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-teal-500">
             <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
                <CheckCircle className="h-5 w-5 text-teal-500" /> Key Strengths
             </h3>
             <ul className="space-y-2">
                {report.keyStrengths.map((str, idx) => (
                    <li key={idx} className="flex gap-2 items-start text-sm text-gray-700">
                        <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-teal-400 flex-shrink-0" />
                        {str}
                    </li>
                ))}
             </ul>
           </div>

           <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-rose-500">
             <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
                <AlertTriangle className="h-5 w-5 text-rose-500" /> Risk Factors
             </h3>
             <ul className="space-y-2">
                {report.potentialRisks.map((risk, idx) => (
                    <li key={idx} className="flex gap-2 items-start text-sm text-gray-700">
                        <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-rose-400 flex-shrink-0" />
                        {risk}
                    </li>
                ))}
             </ul>
           </div>

           <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-500">
             <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
                <Droplet className="h-5 w-5 text-blue-500" /> Nutritional Advice
             </h3>
             <ul className="space-y-2">
                {report.nutritionalAdvice.map((tip, idx) => (
                    <li key={idx} className="flex gap-2 items-start text-sm text-gray-700">
                        <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-blue-400 flex-shrink-0" />
                        {tip}
                    </li>
                ))}
             </ul>
           </div>

           {/* Google Search Sources */}
           {report.sources && report.sources.length > 0 && (
             <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-gray-500">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
                    <ExternalLink className="h-5 w-5 text-gray-500" /> Verified Sources
                </h3>
                <ul className="space-y-2">
                    {report.sources.map((source, idx) => (
                        <li key={idx}>
                            <a 
                                href={source.uri} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-sm text-teal-600 hover:text-teal-800 hover:underline flex items-start gap-1"
                            >
                                <ExternalLink className="h-3 w-3 mt-1 flex-shrink-0" />
                                <span className="truncate">{source.title}</span>
                            </a>
                        </li>
                    ))}
                </ul>
                <p className="mt-3 text-xs text-gray-400">
                    Data verified via Google Search Grounding
                </p>
             </div>
           )}
        </div>

        {/* Daily Routine Column */}
        <div className="lg:col-span-2 space-y-8">
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
                    <h3 className="text-xl font-bold text-gray-800">Recommended Daily Routine</h3>
                    <span className="text-sm text-gray-500">Customized for you</span>
                </div>
                <div className="divide-y divide-gray-100">
                    {report.dailyRoutine.map((activity, idx) => (
                        <div key={idx} className="p-6 hover:bg-slate-50 transition-colors group">
                            <div className="flex items-start gap-4">
                                <div className="flex-shrink-0 mt-1">
                                    {getIconForActivity(activity.type)}
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                                            {getTimeIcon(activity.timeOfDay)}
                                            <span className="ml-1">{activity.timeOfDay}</span>
                                        </span>
                                        <h4 className="text-base font-semibold text-gray-900 group-hover:text-teal-700 transition-colors">
                                            {activity.title}
                                        </h4>
                                    </div>
                                    <p className="text-sm text-gray-600">{activity.description}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            
            <div className="mt-8 flex justify-center">
                 <button 
                    onClick={onReset}
                    className="text-teal-600 hover:text-teal-800 font-medium text-sm flex items-center gap-2 underline underline-offset-4"
                >
                    Start New Assessment
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default ReportDashboard;