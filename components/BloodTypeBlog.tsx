
import React, { useState } from 'react';
import { ArrowLeft, Droplet, Shield, Dna, CreditCard, Check, Download } from 'lucide-react';
import PaymentModal from './PaymentModal';

interface BloodTypeBlogProps {
  onBack: () => void;
}

const BloodTypeBlog: React.FC<BloodTypeBlogProps> = ({ onBack }) => {
  const [showModal, setShowModal] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);

  const handlePaymentSuccess = () => {
    setIsUnlocked(true);
  };

  return (
    <div className="bg-white min-h-screen animate-fadeIn">
      {/* Header - Reduced padding from py-12 to py-8 */}
      <div className="bg-slate-900 text-white py-8 px-6">
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

      {/* Content - Reduced padding from py-12 to py-8 */}
      <div className="max-w-4xl mx-auto px-6 py-8 space-y-12">
        
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
            <p className="text-gray-600 mb-4">
                Emerging research in nutrigenomics suggests that your blood type may influence how you digest certain foods and handle stress. While not a rigid rulebook, these tendencies can guide personalized lifestyle choices.
            </p>
            
            <div className="space-y-6">
                {/* Type O */}
                <div className="bg-gradient-to-br from-white to-teal-50 p-6 rounded-xl shadow-sm border border-teal-100 transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
                    <div className="flex gap-4 items-start">
                         <span className="bg-teal-100 text-teal-800 font-bold px-3 py-1 rounded text-sm min-w-[3rem] text-center mt-1 shadow-sm">Type O</span>
                         <div>
                             <h4 className="font-semibold text-gray-900 text-lg">The Hunter (Original)</h4>
                             <div className="mt-3 space-y-2 text-gray-600 text-sm">
                                <p><strong className="text-gray-800">Traits:</strong> Often characterized by higher stomach acid levels, which aids in protein digestion but can increase ulcer risk. Generally robust immune response and lower risk of heart disease.</p>
                                <p><strong className="text-gray-800">Dietary Focus:</strong> Thrives on high-protein diets (lean meat, poultry, fish). Vegetables are beneficial, but grains, beans, and dairy might cause digestive issues due to metabolic tendencies.</p>
                                <p><strong className="text-gray-800">Ideal Exercise:</strong> Vigorous physical activity stimulates the cardiovascular system and helps manage stress (e.g., running, interval training, martial arts).</p>
                             </div>
                         </div>
                    </div>
                </div>

                {/* Type A */}
                 <div className="bg-gradient-to-br from-white to-indigo-50 p-6 rounded-xl shadow-sm border border-indigo-100 transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
                    <div className="flex gap-4 items-start">
                         <span className="bg-indigo-100 text-indigo-800 font-bold px-3 py-1 rounded text-sm min-w-[3rem] text-center mt-1 shadow-sm">Type A</span>
                         <div>
                             <h4 className="font-semibold text-gray-900 text-lg">The Agrarian (Cultivator)</h4>
                             <div className="mt-3 space-y-2 text-gray-600 text-sm">
                                <p><strong className="text-gray-800">Traits:</strong> Naturally higher cortisol levels make stress management crucial. May have a more sensitive digestive tract and immune system. Slightly elevated risk for cardiovascular issues.</p>
                                <p><strong className="text-gray-800">Dietary Focus:</strong> Flourishes on a plant-based or vegetarian diet. Fresh, organic foods are best. Red meat is often difficult to digest and may cause lethargy.</p>
                                <p><strong className="text-gray-800">Ideal Exercise:</strong> Calming, centering exercises that lower cortisol are most effective (e.g., Yoga, Tai Chi, light hiking).</p>
                             </div>
                         </div>
                    </div>
                </div>

                {/* Type B */}
                 <div className="bg-gradient-to-br from-white to-amber-50 p-6 rounded-xl shadow-sm border border-amber-100 transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
                    <div className="flex gap-4 items-start">
                         <span className="bg-amber-100 text-amber-800 font-bold px-3 py-1 rounded text-sm min-w-[3rem] text-center mt-1 shadow-sm">Type B</span>
                         <div>
                             <h4 className="font-semibold text-gray-900 text-lg">The Nomad (Balanced)</h4>
                             <div className="mt-3 space-y-2 text-gray-600 text-sm">
                                <p><strong className="text-gray-800">Traits:</strong> Generally has a tolerant digestive system and robust immunity. However, susceptible to inflammation and cortisol imbalances if out of sync.</p>
                                <p><strong className="text-gray-800">Dietary Focus:</strong> The most balanced diet, tolerating a variety of foods including meat (avoid chicken), dairy, grains, beans, and produce. Corn and wheat may affect metabolism.</p>
                                <p><strong className="text-gray-800">Ideal Exercise:</strong> Moderate activities that combine physical and mental balance (e.g., Tennis, swimming, hiking, cycling).</p>
                             </div>
                         </div>
                    </div>
                </div>

                {/* Type AB */}
                 <div className="bg-gradient-to-br from-white to-purple-50 p-6 rounded-xl shadow-sm border border-purple-100 transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
                    <div className="flex gap-4 items-start">
                         <span className="bg-purple-100 text-purple-800 font-bold px-3 py-1 rounded text-sm min-w-[3rem] text-center mt-1 shadow-sm">Type AB</span>
                         <div>
                             <h4 className="font-semibold text-gray-900 text-lg">The Enigma (Modern)</h4>
                             <div className="mt-3 space-y-2 text-gray-600 text-sm">
                                <p><strong className="text-gray-800">Traits:</strong> A biological complex with Type A's low stomach acid and Type B's adaptation to meats. Immune system is friendly but can be vulnerable to microbes. Cognitive health is a key focus.</p>
                                <p><strong className="text-gray-800">Dietary Focus:</strong> Mixed diet. Tofu, seafood, dairy, and green vegetables are excellent. Avoid caffeine and alcohol when stressed. Eat smaller, frequent meals.</p>
                                <p><strong className="text-gray-800">Ideal Exercise:</strong> A combination of calming activities and moderate intensity exercise works best to maintain equilibrium.</p>
                             </div>
                         </div>
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

                {isUnlocked ? (
                  <button className="w-full bg-green-500 hover:bg-green-400 text-white font-bold py-4 px-8 rounded-xl transition-all shadow-lg flex items-center justify-center gap-3 animate-bounce">
                    <Download className="h-5 w-5" />
                    Download Your Genetic Map (PDF)
                  </button>
                ) : (
                  <button 
                    onClick={() => setShowModal(true)}
                    className="w-full bg-teal-500 hover:bg-teal-400 text-white font-bold py-4 px-8 rounded-xl transition-all shadow-lg hover:shadow-teal-500/25 flex items-center justify-center gap-3 group transform hover:-translate-y-0.5"
                  >
                    <CreditCard className="h-5 w-5" />
                    Buy Now — Unlock Premium Report ($19.99)
                  </button>
                )}
                
                <p className="mt-4 text-xs text-slate-400">
                    Secure 256-bit SSL encrypted payment. 30-day money-back guarantee.
                </p>
            </div>
        </div>

        <PaymentModal 
          isOpen={showModal} 
          onClose={() => setShowModal(false)} 
          onSuccess={handlePaymentSuccess}
          price="$19.99"
        />
      </div>
    </div>
  );
};

export default BloodTypeBlog;
