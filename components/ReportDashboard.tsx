import React, { useState, useRef, useEffect } from 'react';
import { HealthReport } from '../types';
import { ResponsiveContainer, RadialBarChart, RadialBar } from 'recharts';
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
  Loader2
} from 'lucide-react';
import { generateAudioSummary } from '../services/geminiService';

interface ReportDashboardProps {
  report: HealthReport;
  onReset: () => void;
}

const ReportDashboard: React.FC<ReportDashboardProps> = ({ report, onReset }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const startTimeRef = useRef<number>(0);
  const pausedTimeRef = useRef<number>(0);

  // Data for the radial chart
  const scoreData = [
    {
      name: 'Health Score',
      value: report.overallHealthScore,
      fill: report.overallHealthScore > 75 ? '#0d9488' : report.overallHealthScore > 50 ? '#ca8a04' : '#dc2626',
    }
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

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (sourceNodeRef.current) {
        sourceNodeRef.current.stop();
      }
      if (audioContext && audioContext.state !== 'closed') {
        audioContext.close();
      }
    };
  }, []);

  const decodePCM = (base64Data: string, ctx: AudioContext): AudioBuffer => {
    const binaryString = atob(base64Data);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    // Convert to 16-bit PCM
    // Create a new ArrayBuffer view for Int16
    const int16Data = new Int16Array(bytes.buffer);
    const sampleRate = 24000; // Gemini default for this model
    const numChannels = 1;
    
    const buffer = ctx.createBuffer(numChannels, int16Data.length, sampleRate);
    const channelData = buffer.getChannelData(0);
    
    for (let i = 0; i < int16Data.length; i++) {
      // Convert Int16 to Float32 range [-1.0, 1.0]
      channelData[i] = int16Data[i] / 32768.0;
    }
    
    return buffer;
  };

  const handlePlayAudio = async () => {
    if (isPlaying) {
      // Pause logic
      if (sourceNodeRef.current && audioContext) {
        try {
            sourceNodeRef.current.stop();
        } catch (e) {
            // ignore if already stopped
        }
        pausedTimeRef.current = audioContext.currentTime - startTimeRef.current;
        setIsPlaying(false);
      }
      return;
    }

    // Initialize AudioContext if needed
    let ctx = audioContext;
    if (!ctx) {
        // Use standard AudioContext, fallback handled by browser usually
        ctx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        setAudioContext(ctx);
    }

    // Resume context if suspended (browser autoplay policy)
    if (ctx.state === 'suspended') {
        await ctx.resume();
    }

    if (!audioBuffer) {
      setIsLoadingAudio(true);
      try {
        const base64Audio = await generateAudioSummary(report.summary);
        
        // Decode raw PCM manually
        const decodedBuffer = decodePCM(base64Audio, ctx);
        
        setAudioBuffer(decodedBuffer);
        playBuffer(ctx, decodedBuffer, 0);
      } catch (err) {
        console.error("Audio playback failed", err);
        alert("Could not play audio summary. Please try again.");
      } finally {
        setIsLoadingAudio(false);
      }
    } else {
      // Resume from paused time
      playBuffer(ctx, audioBuffer, pausedTimeRef.current);
    }
  };

  const playBuffer = (ctx: AudioContext, buffer: AudioBuffer, startOffset: number) => {
    // If previous source exists, stop it
    if (sourceNodeRef.current) {
        try { sourceNodeRef.current.stop(); } catch(e) {}
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    
    source.onended = () => {
       // This fires when playback stops naturally or via stop()
       // We can check currentTime to see if it finished
       // But for simple UI sync, we rely on the duration timeout or manual stop updates
    };

    source.start(0, startOffset);
    startTimeRef.current = ctx.currentTime - startOffset;
    sourceNodeRef.current = source;
    setIsPlaying(true);
    
    // Auto-reset state when audio finishes
    const duration = buffer.duration - startOffset;
    // Clear any existing timeout if we were scrubbing/seeking (not implemented here but good practice)
    setTimeout(() => {
        // Only reset if we are still playing the same source
        if (sourceNodeRef.current === source) {
             setIsPlaying(false);
             pausedTimeRef.current = 0;
        }
    }, duration * 1000 + 200); // Small buffer
  };


  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 space-y-8 animate-fadeIn">
      
      {/* Header Summary */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="p-8 md:flex gap-8 items-center">
          <div className="flex-1 space-y-4">
            <div className="flex justify-between items-start">
               <h2 className="text-3xl font-bold text-gray-900">Your Health Report</h2>
               <button 
                onClick={handlePlayAudio}
                disabled={isLoadingAudio}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                    isPlaying 
                    ? 'bg-rose-100 text-rose-700 hover:bg-rose-200' 
                    : 'bg-teal-100 text-teal-700 hover:bg-teal-200'
                }`}
               >
                 {isLoadingAudio ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                 ) : isPlaying ? (
                    <Pause className="h-4 w-4" />
                 ) : (
                    <Play className="h-4 w-4" />
                 )}
                 {isPlaying ? 'Pause Summary' : 'Listen to Summary'}
               </button>
            </div>
            
            <div className="flex items-center gap-2">
                 <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                    report.bmiCategory === 'Normal' ? 'bg-green-100 text-green-800' : 
                    report.bmiCategory.includes('Over') ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                 }`}>
                    BMI: {report.bmi.toFixed(1)} ({report.bmiCategory})
                 </span>
            </div>
            <p className="text-gray-600 leading-relaxed">{report.summary}</p>
          </div>
          
          <div className="mt-8 md:mt-0 flex flex-col items-center justify-center p-4 bg-slate-50 rounded-xl min-w-[200px]">
            <div className="h-32 w-32 relative">
               <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart 
                  innerRadius="80%" 
                  outerRadius="100%" 
                  barSize={10} 
                  data={scoreData} 
                  startAngle={90} 
                  endAngle={-270}
                >
                  <RadialBar background dataKey="value" cornerRadius={30} />
                </RadialBarChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex items-center justify-center flex-col">
                <span className="text-3xl font-bold text-gray-900">{report.overallHealthScore}</span>
                <span className="text-xs text-gray-500 uppercase tracking-wider">Score</span>
              </div>
            </div>
            <p className="text-sm text-gray-500 mt-2 text-center">Wellness Index</p>
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
        <div className="lg:col-span-2">
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