import React from 'react';
import { Activity, ShieldCheck, HeartPulse, ArrowRight } from 'lucide-react';

interface HeroProps {
  onStart: () => void;
  onOpenBloodBlog: () => void;
}

const Hero: React.FC<HeroProps> = ({ onStart, onOpenBloodBlog }) => {
  const scrollToBlogs = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const element = document.getElementById('learn-more');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="relative isolate overflow-hidden">
      <div className="mx-auto max-w-7xl px-6 pb-24 pt-10 sm:pb-32 lg:flex lg:px-8 lg:py-40">
        <div className="mx-auto max-w-2xl lg:mx-0 lg:max-w-xl lg:flex-shrink-0 lg:pt-8">
          <div className="mt-24 sm:mt-32 lg:mt-16 flex flex-wrap items-center gap-4">
            <button 
                onClick={onStart}
                className="rounded-full bg-teal-600/10 px-3 py-1 text-sm font-semibold leading-6 text-teal-600 ring-1 ring-inset ring-teal-600/10 hover:bg-teal-600/20 transition-colors"
            >
                New Feature
            </button>
            <button 
                onClick={onOpenBloodBlog} 
                className="inline-flex items-center space-x-2 text-sm font-medium leading-6 text-gray-600 hover:text-teal-600 transition-colors"
            >
                <span>Blood type analysis</span>
                <span aria-hidden="true">&rarr;</span>
            </button>
          </div>
          <h1 className="mt-10 text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
            Unlock Your Body's <span className="text-teal-600">True Potential</span>
          </h1>
          <p className="mt-6 text-lg leading-8 text-gray-600">
            VitalSync AI analyzes your unique biological profile—including blood group, biometrics, and lifestyle—to generate a personalized health roadmap and daily routine designed just for you.
          </p>
          <div className="mt-10 flex items-center gap-x-6">
            <button
              onClick={onStart}
              className="rounded-md bg-teal-600 px-6 py-3.5 text-sm font-semibold text-white shadow-sm hover:bg-teal-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600 transition-all flex items-center gap-2"
            >
              Start Assessment <ArrowRight className="h-4 w-4" />
            </button>
            <a href="#learn-more" onClick={scrollToBlogs} className="text-sm font-semibold leading-6 text-gray-900 cursor-pointer flex items-center gap-1">
              Learn more <span aria-hidden="true">→</span>
            </a>
          </div>
        </div>
        
        {/* Visual Decoration */}
        <div className="mx-auto mt-16 flex max-w-2xl sm:mt-24 lg:ml-10 lg:mt-0 lg:mr-0 lg:max-w-none lg:flex-none xl:ml-32">
          <div className="max-w-3xl flex-none sm:max-w-5xl lg:max-w-none">
            <div className="-m-2 rounded-xl bg-gray-900/5 p-2 ring-1 ring-inset ring-gray-900/10 lg:-m-4 lg:rounded-2xl lg:p-4">
              <div className="rounded-md bg-white p-8 shadow-2xl ring-1 ring-gray-900/10 sm:p-10">
                 <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                    <div className="flex flex-col gap-4">
                        <div className="flex items-center gap-3 p-4 bg-teal-50 rounded-lg">
                            <Activity className="h-6 w-6 text-teal-600" />
                            <div>
                                <h3 className="font-semibold text-gray-900">Activity Analysis</h3>
                                <p className="text-xs text-gray-500">Tailored to your lifestyle</p>
                            </div>
                        </div>
                         <div className="flex items-center gap-3 p-4 bg-rose-50 rounded-lg">
                            <HeartPulse className="h-6 w-6 text-rose-600" />
                            <div>
                                <h3 className="font-semibold text-gray-900">Blood Group Insights</h3>
                                <p className="text-xs text-gray-500">Genetic compatibility checks</p>
                            </div>
                        </div>
                    </div>
                     <div className="flex flex-col gap-4">
                        <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg">
                            <ShieldCheck className="h-6 w-6 text-blue-600" />
                            <div>
                                <h3 className="font-semibold text-gray-900">Preventative Care</h3>
                                <p className="text-xs text-gray-500">AI risk assessment</p>
                            </div>
                        </div>
                         <div className="p-4 bg-slate-50 rounded-lg border-2 border-dashed border-slate-200 flex items-center justify-center text-slate-400 text-sm">
                            + Personalized Plan
                        </div>
                    </div>
                 </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hero;
