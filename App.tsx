import React, { useState, useEffect } from 'react';
import { AppState, UserProfile, HealthReport } from './types';
import { INITIAL_USER_PROFILE } from './constants';
import { generateHealthReport, generateReportVisual, generateAudioSummary, generateFastSummary } from './services/geminiService';
import Hero from './components/Hero';
import BlogSection from './components/BlogSection';
import HealthForm from './components/HealthForm';
import LoadingScreen from './components/LoadingScreen';
import ReportDashboard from './components/ReportDashboard';
import BloodTypeBlog from './components/BloodTypeBlog';
import { HeartPulse, ArrowUp, RefreshCw, AlertCircle } from 'lucide-react';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.LANDING);
  const [userProfile, setUserProfile] = useState<UserProfile>(INITIAL_USER_PROFILE);
  const [report, setReport] = useState<HealthReport | null>(null);
  const [reportAudio, setReportAudio] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Scroll Listener for Floating Button
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 300) {
        setShowScrollTop(true);
      } else {
        setShowScrollTop(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const handleStart = () => {
    setAppState(AppState.FORM);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenBloodBlog = () => {
    setAppState(AppState.BLOOD_BLOG);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleFormSubmit = async (data: UserProfile) => {
    setUserProfile(data);
    setAppState(AppState.LOADING);
    setError(null);
    setReportAudio(null); // Reset previous audio
    window.scrollTo({ top: 0, behavior: 'smooth' });

    try {
      // --- PARALLEL EXECUTION STRATEGY ---
      // Instead of waiting for the report to generate before starting visuals/audio,
      // we start everything at once using the UserProfile data.

      // 1. Start Visual Generation (Uses Profile Data directly)
      const visualPromise = generateReportVisual(data);

      // 2. Start Fast Summary (Faster than full report)
      const summaryPromise = generateFastSummary(data);

      // 3. Start Full Detailed Report
      const reportPromise = generateHealthReport(data);

      // 4. Chain Audio Generation to Fast Summary
      // This ensures Audio is ready ~3-4 seconds faster than waiting for the full report
      const audioPromise = summaryPromise.then(summary => generateAudioSummary(summary));

      // 5. Await Critical Data (Report & Summary)
      // We need these before we can show the dashboard
      const [fastSummary, generatedReport] = await Promise.all([summaryPromise, reportPromise]);

      // 6. Inject Fast Summary into Report
      // This ensures the Text Summary on screen matches the Audio exactly
      generatedReport.summary = fastSummary;

      // 7. Update State
      setReport(generatedReport);
      setAppState(AppState.REPORT);

      // 8. Attach Async Visuals & Audio when ready
      visualPromise.then(base64Image => {
        if (base64Image) {
            setReport(prev => prev ? ({ ...prev, visualBase64: base64Image }) : null);
        }
      }).catch(e => console.error("Visual gen failed", e));

      audioPromise.then(base64Audio => {
        if (base64Audio) {
            setReportAudio(base64Audio);
        }
      }).catch(e => console.error("Audio gen failed", e));

    } catch (err: any) {
      console.error(err);
      
      // Refined Error Messages
      let msg = "An issue occurred while analyzing your profile. Please check your connection and try again.";
      if (err.message) {
          if (err.message.includes('429') || err.message.includes('Resource has been exhausted')) {
              msg = "The AI servers are currently experiencing high traffic. Please try again in a moment.";
          } else if (err.message.includes('404') || err.message.includes('Not Found')) {
              msg = "The AI service is currently unavailable (Model Not Found). Please contact support.";
          } else if (err.message.includes('API_KEY') || err.message.includes('403')) {
              msg = "Service configuration error: Invalid or missing API Key.";
          } else if (err.message.includes('Safety') || err.message.includes('blocked')) {
              msg = "The profile data triggered safety filters. Please review your entries and try again.";
          } else if (err.message.includes('parse')) {
              msg = "A malformed response was received from the AI. Please try again.";
          } else {
              msg = `Analysis failed: ${err.message}`;
          }
      }
      
      setError(msg);
      setAppState(AppState.ERROR);
    }
  };

  const handleRetry = () => {
      if (userProfile.age) {
          // Retry with existing data
          handleFormSubmit(userProfile);
      } else {
          // Fallback to form if no data
          setAppState(AppState.FORM);
      }
  };

  const handleEditProfile = () => {
    setAppState(AppState.FORM);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleReset = () => {
    setUserProfile(INITIAL_USER_PROFILE);
    setReport(null);
    setReportAudio(null);
    setAppState(AppState.LANDING);
    // Use timeout to allow render cycle to complete before scrolling
    setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 10);
  };

  const handleScrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen flex flex-col relative">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={handleReset}>
            <div className="bg-teal-600 p-1.5 rounded-lg">
                <HeartPulse className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900 tracking-tight">Your Ultimate Health Partner</span>
          </div>
          <div className="text-sm text-gray-500 hidden sm:block">
            Personalized Health Intelligence
          </div>
        </nav>
      </header>

      {/* Main Content */}
      <main className="flex-grow bg-slate-50">
        {appState === AppState.LANDING && (
          <>
            <Hero onStart={handleStart} onOpenBloodBlog={handleOpenBloodBlog} />
            <BlogSection />
          </>
        )}

        {appState === AppState.BLOOD_BLOG && (
          <BloodTypeBlog onBack={handleReset} />
        )}
        
        {appState === AppState.FORM && (
          <div className="py-8">
            <HealthForm initialData={userProfile} onSubmit={handleFormSubmit} onCancel={handleReset} />
          </div>
        )}

        {appState === AppState.LOADING && <LoadingScreen />}

        {appState === AppState.REPORT && report && (
          <ReportDashboard 
            report={report} 
            initialAudioBase64={reportAudio}
            onReset={handleReset} 
          />
        )}

        {appState === AppState.ERROR && (
          <div className="max-w-md mx-auto mt-20 p-8 bg-white rounded-2xl shadow-xl text-center border border-red-100 animate-fadeIn">
            <div className="bg-red-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 ring-4 ring-red-50">
                <AlertCircle className="h-10 w-10 text-red-500" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Analysis Interrupted</h3>
            <p className="text-gray-600 mb-8 leading-relaxed text-sm">{error}</p>
            
            <div className="flex flex-col gap-3">
                <button
                  onClick={handleRetry}
                  className="w-full inline-flex justify-center items-center gap-2 rounded-xl border border-transparent shadow-md px-6 py-3 bg-teal-600 text-base font-semibold text-white hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 transition-all active:scale-[0.98]"
                >
                  <RefreshCw className="h-5 w-5" />
                  Retry Analysis
                </button>
                <button
                  onClick={handleEditProfile}
                  className="w-full inline-flex justify-center items-center gap-2 rounded-xl border border-gray-200 px-6 py-3 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-200 transition-all"
                >
                  Edit Profile Details
                </button>
            </div>
          </div>
        )}
      </main>

      {/* Floating Scroll Top Button */}
      {showScrollTop && (
        <button
          onClick={handleScrollToTop}
          className="fixed bottom-8 right-8 z-50 p-4 rounded-full bg-teal-600 text-white shadow-xl hover:bg-teal-700 hover:shadow-2xl transition-all hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 animate-fadeIn"
          aria-label="Scroll to top"
          title="Scroll to top"
        >
          <ArrowUp className="h-6 w-6" />
        </button>
      )}

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-auto">
        <div className="mx-auto max-w-7xl px-6 py-8 md:flex md:items-center md:justify-between lg:px-8">
          <div className="mt-8 md:order-1 md:mt-0">
            <p className="text-xs leading-5 text-gray-500 text-center md:text-left">
              &copy; 2025 Your Ultimate Health Partner, All rights reserved. <br/>
              <span className="font-semibold text-gray-400">Disclaimer:</span> This application uses AI to provide general wellness suggestions. It is not a substitute for professional medical advice, diagnosis, or treatment. Always consult with a qualified healthcare provider for medical concerns.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
