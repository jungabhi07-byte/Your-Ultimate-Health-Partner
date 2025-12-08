import React, { useState, useEffect } from 'react';
import { AppState, UserProfile, HealthReport } from './types';
import { INITIAL_USER_PROFILE } from './constants';
import { generateHealthReport, generateReportVisual } from './services/geminiService';
import { getHistory, saveReportToHistory, getLatestReport } from './services/storageService';
import Hero from './components/Hero';
import BlogSection from './components/BlogSection';
import HealthForm from './components/HealthForm';
import LoadingScreen from './components/LoadingScreen';
import ReportDashboard from './components/ReportDashboard';
import BloodTypeBlog from './components/BloodTypeBlog';
import { HeartPulse, ArrowUp } from 'lucide-react';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.LANDING);
  const [userProfile, setUserProfile] = useState<UserProfile>(INITIAL_USER_PROFILE);
  const [report, setReport] = useState<HealthReport | null>(null);
  const [previousReport, setPreviousReport] = useState<HealthReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Load history on mount
  useEffect(() => {
    const latest = getLatestReport();
    setPreviousReport(latest);
  }, []);

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
    window.scrollTo({ top: 0, behavior: 'smooth' });

    try {
      // Pass history to AI service
      const history = getHistory();
      const generatedReport = await generateHealthReport(data, history);
      
      setReport(generatedReport);
      
      // Save to local history
      saveReportToHistory(generatedReport);
      // Update previous report state for next time
      setPreviousReport(generatedReport);
      
      // Move to report screen immediately with the text data
      setAppState(AppState.REPORT);

      // Generate the visual in the background and update state when ready
      generateReportVisual(generatedReport.summary).then(base64Image => {
        if (base64Image) {
            setReport(prev => prev ? ({ ...prev, visualBase64: base64Image }) : null);
        }
      });

    } catch (err) {
      console.error(err);
      setError("We encountered an issue analyzing your profile. Please check your connection and try again.");
      setAppState(AppState.ERROR);
    }
  };

  const handleReset = () => {
    setUserProfile(INITIAL_USER_PROFILE);
    setReport(null);
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
            onReset={handleReset} 
            previousReport={previousReport} // Pass the "previous" one (logic handled in App to ensure it's not the same as current if freshly generated, but simple use case is fine)
          />
        )}

        {appState === AppState.ERROR && (
          <div className="max-w-md mx-auto mt-20 p-6 bg-white rounded-lg shadow-lg text-center">
            <div className="text-red-500 mb-4 flex justify-center">
                <HeartPulse className="h-12 w-12" />
            </div>
            <h3 className="text-lg font-medium text-gray-900">Analysis Failed</h3>
            <p className="mt-2 text-sm text-gray-500">{error}</p>
            <button
              onClick={() => setAppState(AppState.FORM)}
              className="mt-6 w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-teal-600 text-base font-medium text-white hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 sm:text-sm"
            >
              Try Again
            </button>
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