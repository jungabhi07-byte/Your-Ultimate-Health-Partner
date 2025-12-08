import React from 'react';

export interface HealthChartProps {
  data: {
    subject: string;
    value: number;
    fullMark: number;
    previousValue?: number;
  }[];
}

const HealthChart: React.FC<HealthChartProps> = ({ data }) => {
  // Extract overall score for the donut chart
  const overallData = data.find(d => d.subject === 'Overall Wellness');
  const score = overallData?.value || 0;
  const prevScore = overallData?.previousValue;
  
  // Filter out the overall score for the bar list
  const detailedMetrics = data.filter(d => d.subject !== 'Overall Wellness');

  // SVG Config for Circular Progress
  const radius = 50;
  const stroke = 8;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  const getColor = (val: number) => {
    if (val >= 80) return 'text-teal-500';
    if (val >= 60) return 'text-yellow-500';
    return 'text-rose-500';
  };
  
  const getBgColor = (val: number) => {
    if (val >= 80) return 'bg-teal-500';
    if (val >= 60) return 'bg-yellow-500';
    return 'bg-rose-500';
  };

  return (
    <div className="w-full h-full flex flex-col justify-center animate-fadeIn py-2">
      
      {/* Top Section: Circular Overall Score */}
      <div className="flex items-center gap-6 mb-6">
        <div className="relative h-28 w-28 flex-shrink-0">
          <svg
            height="100%"
            width="100%"
            className="transform -rotate-90"
          >
            {/* Background Ring */}
            <circle
              stroke="#e2e8f0"
              strokeWidth={stroke}
              fill="transparent"
              r={normalizedRadius}
              cx="50%"
              cy="50%"
            />
            {/* Progress Ring */}
            <circle
              className={`transition-all duration-1000 ease-out ${getColor(score)}`}
              stroke="currentColor"
              strokeWidth={stroke}
              strokeDasharray={circumference + ' ' + circumference}
              style={{ strokeDashoffset }}
              strokeLinecap="round"
              fill="transparent"
              r={normalizedRadius}
              cx="50%"
              cy="50%"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-xl font-bold text-gray-900">
                {score}<span className="text-sm text-gray-400 font-normal">/100</span>
            </span>
            <span className="text-[10px] uppercase text-gray-400 font-semibold mt-0.5">Score</span>
            {prevScore !== undefined && (
                <span className={`text-[10px] font-medium mt-1 ${score >= prevScore ? 'text-green-500' : 'text-red-500'}`}>
                    {score >= prevScore ? '↑' : '↓'} {Math.abs(score - prevScore)}
                </span>
            )}
          </div>
        </div>
        
        <div className="flex-1">
            <h4 className="text-lg font-bold text-gray-900">Health Index</h4>
            <p className="text-sm text-gray-500 leading-tight mt-1">
                Your calculated wellness score based on biometrics, lifestyle, and risks.
            </p>
        </div>
      </div>

      {/* Bottom Section: Linear Progress Bars for Details */}
      <div className="space-y-4 w-full">
        {detailedMetrics.map((metric, idx) => (
            <div key={idx}>
                <div className="flex justify-between text-xs font-medium mb-1">
                    <span className="text-gray-600">{metric.subject}</span>
                    <div className="flex items-center gap-2">
                        {metric.previousValue !== undefined && (
                            <span className="text-gray-400 text-[10px]">Prev: {metric.previousValue}</span>
                        )}
                        <span className="text-gray-900">{metric.value}/100</span>
                    </div>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden relative">
                    {/* Previous Value Ghost Bar */}
                    {metric.previousValue !== undefined && (
                        <div 
                            className="absolute top-0 left-0 h-2.5 rounded-full bg-gray-300 opacity-50"
                            style={{ width: `${metric.previousValue}%` }}
                        ></div>
                    )}
                    {/* Current Value Bar */}
                    <div 
                        className={`absolute top-0 left-0 h-2.5 rounded-full transition-all duration-1000 ease-out ${getBgColor(metric.value)}`} 
                        style={{ width: `${metric.value}%` }}
                    ></div>
                </div>
            </div>
        ))}
      </div>

    </div>
  );
};

export default HealthChart;