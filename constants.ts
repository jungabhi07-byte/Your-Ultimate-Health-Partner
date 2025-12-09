
export const BLOOD_GROUPS = [
  'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'
];

export const ACTIVITY_LEVELS = [
  { value: 'sedentary', label: 'I mostly sit (Desk job)' },
  { value: 'light', label: 'I walk a little (Occasional movement)' },
  { value: 'moderate', label: 'I exercise sometimes (2-3 times a week)' },
  { value: 'active', label: 'I exercise often (4-5 times a week)' },
  { value: 'athlete', label: 'I train hard (Daily or physical job)' }
];

export const DIETARY_PREFERENCES = [
  'I eat everything',
  'Vegetarian (No meat)',
  'Vegan (Plants only)',
  'Pescatarian (Fish allowed)',
  'Low Carb / Keto',
  'Gluten-Free',
  'Dairy-Free'
];

export const INITIAL_USER_PROFILE = {
  age: '',
  gender: '',
  bloodGroup: '',
  weight: '',
  height: '',
  activityLevel: 'moderate',
  medicalHistory: '',
  dietaryPreference: 'I eat everything'
};
