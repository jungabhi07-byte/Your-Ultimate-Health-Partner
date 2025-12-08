import React from 'react';
import { Activity, ShieldCheck, HeartPulse, ArrowRight, Stethoscope, BookOpen, GraduationCap } from 'lucide-react';

interface HeroProps {
  onStart: () => void;
  onOpenBloodBlog: () => void;
}

const Hero: React.FC<HeroProps> = ({ onStart, onOpenBloodBlog }) => {
  const scrollToBlogs = (e: React.MouseEvent<HTMLAnchorElement> | React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    const element = document.getElementById('learn-more');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="relative isolate overflow-hidden">
      {/* Reduced padding from pb-24/pt-6 to pb-8/pt-4 and lg:py-20 to lg:py-10 */}
      <div className="mx-auto max-w-7xl px-6 pb-8 pt-4 sm:pb-12 lg:flex lg:px-8 lg:py-10">
        <div className="mx-auto max-w-2xl lg:mx-0 lg:max-w-xl lg:flex-shrink-0 lg:pt-4">
          
          <h1 className="mt-2 text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
            Unlock Your Body's <span className="text-teal-600">True Potential</span>
          </h1>
          
          {/* Reduced margins from mt-6 mb-8 to mt-4 mb-6 */}
          <div className="mt-4 mb-6 flex justify-start">
            <div 
                onClick={onOpenBloodBlog}
                className="cursor-pointer flex items-center gap-2 rounded-full bg-white p-1 pr-4 text-sm leading-6 text-gray-600 ring-1 ring-gray-900/10 hover:ring-gray-900/20 transition-all hover:shadow-sm"
            >
                <span className="rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-600">New Feature</span>
                <span className="font-medium">Blood type analysis <span aria-hidden="true">&rarr;</span></span>
            </div>
          </div>

          <p className="mt-2 text-lg leading-8 text-gray-600">
            Your Ultimate Health Partner analyzes your unique biological profile—including blood group, biometrics, and lifestyle—to generate a personalized health roadmap and daily routine designed just for you.
          </p>
          
          <div className="mt-8 flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <button
              onClick={onStart}
              className="group rounded-full bg-gradient-to-r from-teal-600 to-emerald-500 px-8 py-4 text-base font-bold text-white shadow-lg shadow-teal-200 hover:shadow-xl hover:-translate-y-1 transition-all flex items-center gap-3"
            >
              <Stethoscope className="h-6 w-6 animate-[pulse_2s_ease-in-out_infinite]" />
              <span>Start Assessment</span>
              <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </button>
            
            <a 
              href="#learn-more" 
              onClick={scrollToBlogs} 
              className="group rounded-full bg-white px-8 py-4 text-base font-bold text-indigo-600 shadow-md ring-1 ring-indigo-50 hover:bg-indigo-50 hover:ring-indigo-200 hover:-translate-y-1 transition-all flex items-center gap-3"
            >
              <div className="relative">
                <BookOpen className="h-6 w-6" />
                <GraduationCap className="h-3 w-3 absolute -top-1 -right-1 text-indigo-400" />
              </div>
              <span>Read Health Blogs</span>
              <span aria-hidden="true" className="group-hover:translate-x-1 transition-transform">→</span>
            </a>
          </div>
        </div>
        
        {/* Visual Decoration - Reduced mt-16 to mt-8 and reduced left margins */}
        <div className="mx-auto mt-8 flex max-w-2xl sm:mt-12 lg:ml-6 lg:mt-0 lg:mr-0 lg:max-w-none lg:flex-none xl:ml-16">
          <div className="max-w-3xl flex-none sm:max-w-5xl lg:max-w-none">
            <div className="-m-2 rounded-xl bg-gray-900/5 p-2 ring-1 ring-inset ring-gray-900/10 lg:-m-4 lg:rounded-2xl lg:p-4">
              <div className="rounded-md bg-white p-8 shadow-2xl ring-1 ring-gray-900/10 sm:p-10">
                 <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                    <div className="flex flex-col gap-4">
                        {/* Activity Analysis -> Leads to Assessment (Fit Check) */}
                        <div 
                            onClick={onStart}
                            className="flex items-center gap-3 p-4 bg-teal-50 rounded-lg cursor-pointer hover:shadow-md transition-all hover:scale-[1.02] group"
                        >
                            <Activity className="h-6 w-6 text-teal-600 group-hover:text-teal-700" />
                            <div>
                                <h3 className="font-semibold text-gray-900 group-hover:text-teal-800">Activity Analysis</h3>
                                <p className="text-xs text-gray-500">Tailored to your lifestyle</p>
                            </div>
                        </div>

                        {/* Blood Group Insights -> Leads to Blood Blog */}
                         <div 
                            onClick={onOpenBloodBlog}
                            className="flex items-center gap-3 p-4 bg-rose-50 rounded-lg cursor-pointer hover:shadow-md transition-all hover:scale-[1.02] group"
                        >
                            <HeartPulse className="h-6 w-6 text-rose-600 group-hover:text-rose-700" />
                            <div>
                                <h3 className="font-semibold text-gray-900 group-hover:text-rose-800">Blood Group Insights</h3>
                                <p className="text-xs text-gray-500">Genetic compatibility checks</p>
                            </div>
                        </div>
                    </div>
                     <div className="flex flex-col gap-4">
                        {/* Preventative Care -> Leads to Blogs */}
                        <div 
                            onClick={scrollToBlogs}
                            className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg cursor-pointer hover:shadow-md transition-all hover:scale-[1.02] group"
                        >
                            <ShieldCheck className="h-6 w-6 text-blue-600 group-hover:text-blue-700" />
                            <div>
                                <h3 className="font-semibold text-gray-900 group-hover:text-blue-800">Preventative Care</h3>
                                <p className="text-xs text-gray-500">AI risk assessment</p>
                            </div>
                        </div>

                        {/* Personalized Plan -> Leads to Assessment for Premium */}
                         <div 
                            onClick={onStart}
                            className="p-4 bg-slate-50 rounded-lg border-2 border-dashed border-slate-200 flex items-center justify-center text-slate-400 text-sm cursor-pointer hover:bg-slate-100 hover:border-teal-300 hover:text-teal-600 transition-all font-medium"
                        >
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