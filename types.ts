export interface UserProfile {
  age: string;
  gender: string;
  bloodGroup: string;
  weight: string; // stored as string for input, parsed to number
  height: string; // stored as string for input, parsed to number
  activityLevel: string;
  medicalHistory: string;
  dietaryPreference: string;
}

export interface DailyActivity {
  timeOfDay: string;
  title: string;
  description: string;
  type: 'exercise' | 'diet' | 'lifestyle' | 'mindfulness';
}

export interface Source {
  title: string;
  uri: string;
}

export interface HealthReport {
  bmi: number;
  bmiCategory: string;
  overallHealthScore: number; // 0-100
  summary: string;
  potentialRisks: string[];
  keyStrengths: string[];
  dailyRoutine: DailyActivity[];
  nutritionalAdvice: string[];
  sources?: Source[];
  visualBase64?: string;
  date?: string; // ISO String date of assessment
  trendAnalysis?: string; // AI insight on progress since last check
}

export enum AppState {
  LANDING = 'LANDING',
  FORM = 'FORM',
  LOADING = 'LOADING',
  REPORT = 'REPORT',
  ERROR = 'ERROR',
  BLOOD_BLOG = 'BLOOD_BLOG'
}