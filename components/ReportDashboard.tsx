import React from 'react';
import { HealthReport, DailyActivity } from '../types';
import { ResponsiveContainer, RadialBarChart, RadialBar, Tooltip } from 'recharts';
import { 
  AlertTriangle, 
  CheckCircle, 
  Calendar, 
  Coffee, 
  Moon, 
  Sun, 
  Utensils, 
  Activity, 
  Droplet 
} from 'lucide-react';

interface ReportDashboardProps {
  report: HealthReport;
  onReset: () => void;
}

const ReportDashboard: React.FC<ReportDashboardProps> = ({ report, onReset }) => {
  
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

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 space-y-8 animate-fadeIn">
      
      {/* Header Summary */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="p-8 md:flex gap-8 items-center">
          <div className="flex-1 space-y-4">
            <h2 className="text-3xl font-bold text-gray-900">Your Health Report</h2>
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
