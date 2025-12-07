import React from 'react';
import { Loader2 } from 'lucide-react';

const LoadingScreen: React.FC = () => {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 text-center animate-fadeIn">
      <div className="relative">
        <div className="absolute inset-0 bg-teal-200 rounded-full opacity-20 animate-ping"></div>
        <div className="relative bg-white p-4 rounded-full shadow-lg border border-teal-100">
           <Loader2 className="h-12 w-12 text-teal-600 animate-spin" />
        </div>
      </div>
      <h2 className="mt-8 text-2xl font-bold text-gray-900">Analyzing Bio-Profile</h2>
      <p className="mt-2 text-gray-600 max-w-md">
        Our AI is calculating your BMI, assessing metabolic risks based on your blood group, and structuring your personalized wellness plan...
      </p>
      
      <div className="mt-8 w-64 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full bg-teal-500 animate-[loading_2s_ease-in-out_infinite]" style={{width: '50%'}}></div>
      </div>
      <style>{`
        @keyframes loading {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(200%); }
        }
      `}</style>
    </div>
  );
};

export default LoadingScreen;
