import React from 'react';
import { ArrowLeft, Droplet, Shield, Dna, CreditCard, Check } from 'lucide-react';

interface BloodTypeBlogProps {
  onBack: () => void;
}

const BloodTypeBlog: React.FC<BloodTypeBlogProps> = ({ onBack }) => {
  return (
    <div className="bg-white min-h-screen animate-fadeIn">
      {/* Header */}
      <div className="bg-slate-900 text-white py-12 px-6">
        <div className="max-w-4xl mx-auto">
          <button 
            onClick={onBack}
            className="flex items-center text-slate-400 hover:text-white transition-colors mb-6"
          >
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Home
          </button>
          <h1 className="text-3xl md:text-5xl font-bold mb-4">The Science of Blood Groups</h1>
          <p className="text-xl text-slate-300">Understanding the biological traits that define your unique physiology.</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-12 space-y-12">
        
        {/* Intro */}
        <div className="prose prose-lg text-gray-600">
          <p className="lead text-xl text-gray-800">
            Your blood type is more than just a letter. It is a key genetic marker that influences your immune system, metabolism, and susceptibility to certain health conditions.
          </p>
        </div>

        {/* Scientific Cards */}
        <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-slate-50 p-6 rounded-xl border border-slate-100">
                <div className="h-10 w-10 bg-rose-100 rounded-lg flex items-center justify-center mb-4">
                    <Droplet className="h-6 w-6 text-rose-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">The ABO System</h3>
                <p className="text-gray-600">
                    Discovered by Karl Landsteiner in 1901, the ABO system classifies blood based on the presence of antigens A and B on red blood cells. These antigens trigger immune responses if incompatible blood is introduced.
                </p>
            </div>
             <div className="bg-slate-50 p-6 rounded-xl border border-slate-100">
                <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                    <Dna className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Rh Factor</h3>
                <p className="text-gray-600">
                    The Rhesus (Rh) system determines whether your blood is positive (+) or negative (-). This protein affects compatibility, especially during pregnancy and transfusions.
                </p>
            </div>
        </div>

        {/* Detailed Breakdown */}
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 border-b pb-4">Blood Group Traits & Susceptibilities</h2>
            
            <div className="space-y-4">
                <div className="flex gap-4 items-start">
                    <span className="bg-teal-100 text-teal-800 font-bold px-3 py-1 rounded text-sm min-w-[3rem] text-center mt-1">Type O</span>
                    <div>
                        <h4 className="font-semibold text-gray-900">The Universal Donor (O-)</h4>
                        <p className="text-gray-600 text-sm mt-1">
                            Scientific studies suggest Type O individuals may have a lower risk of heart disease and blood clots but might be more susceptible to H. pylori infections and ulcers.
                        </p>
                    </div>
                </div>

                <div className="flex gap-4 items-start">
                    <span className="bg-indigo-100 text-indigo-800 font-bold px-3 py-1 rounded text-sm min-w-[3rem] text-center mt-1">Type A</span>
                    <div>
                        <h4 className="font-semibold text-gray-900">The Agrarian Type</h4>
                        <p className="text-gray-600 text-sm mt-1">
                            Research indicates Type A individuals often have naturally higher levels of cortisol (stress hormone) and may have a slightly elevated risk for cardiovascular issues compared to Type O.
                        </p>
                    </div>
                </div>

                <div className="flex gap-4 items-start">
                    <span className="bg-amber-100 text-amber-800 font-bold px-3 py-1 rounded text-sm min-w-[3rem] text-center mt-1">Type B</span>
                    <div>
                        <h4 className="font-semibold text-gray-900">The Nomad</h4>
                        <p className="text-gray-600 text-sm mt-1">
                            Type B has been associated with a robust immune system. However, some studies link it to higher inflammation markers which requires a balanced diet rich in antioxidants.
                        </p>
                    </div>
                </div>
                 <div className="flex gap-4 items-start">
                    <span className="bg-purple-100 text-purple-800 font-bold px-3 py-1 rounded text-sm min-w-[3rem] text-center mt-1">Type AB</span>
                    <div>
                        <h4 className="font-semibold text-gray-900">The Universal Recipient (AB+)</h4>
                        <p className="text-gray-600 text-sm mt-1">
                            The rarest blood type. Biologically, AB individuals share characteristics of both A and B types. Cognitive health preservation is a key focus area in recent longevity studies for this group.
                        </p>
                    </div>
                </div>
            </div>
        </div>

        {/* Premium Section */}
        <div className="mt-16 bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-8 md:p-12 text-center text-white shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 -mr-16 -mt-16 h-64 w-64 rounded-full bg-teal-500 opacity-10 blur-3xl"></div>
            <div className="absolute bottom-0 left-0 -ml-16 -mb-16 h-64 w-64 rounded-full bg-rose-500 opacity-10 blur-3xl"></div>
            
            <div className="relative z-10 max-w-lg mx-auto">
                <div className="inline-flex items-center justify-center p-3 bg-white/10 rounded-full mb-6">
                    <Shield className="h-6 w-6 text-teal-400" />
                </div>
                <h2 className="text-3xl font-bold mb-4">Get Your Full Genetic Health Map</h2>
                <p className="text-slate-300 mb-8">
                    Unlock a detailed 20-page PDF report analyzing your specific blood marker risks, metabolic compatibility, and a 30-day meal plan designed for your DNA.
                </p>

                <div className="bg-white/5 rounded-2xl p-6 mb-8 text-left space-y-3 backdrop-blur-sm border border-white/10">
                    <div className="flex items-center gap-3">
                        <Check className="h-5 w-5 text-teal-400" />
                        <span className="text-sm">Deep metabolic analysis based on Rh factor</span>
                    </div>
                     <div className="flex items-center gap-3">
                        <Check className="h-5 w-5 text-teal-400" />
                        <span className="text-sm">Disease susceptibility risk scoring</span>
                    </div>
                     <div className="flex items-center gap-3">
                        <Check className="h-5 w-5 text-teal-400" />
                        <span className="text-sm">Personalized grocery list & recipes</span>
                    </div>
                </div>

                <button className="w-full bg-teal-500 hover:bg-teal-400 text-white font-bold py-4 px-8 rounded-xl transition-all shadow-lg hover:shadow-teal-500/25 flex items-center justify-center gap-3 group">
                    <CreditCard className="h-5 w-5" />
                    Unlock Premium Report — $19.99
                </button>
                <p className="mt-4 text-xs text-slate-400">
                    Secure 256-bit SSL encrypted payment. 30-day money-back guarantee.
                </p>
            </div>
        </div>
      </div>
    </div>
  );
};

export default BloodTypeBlog;
