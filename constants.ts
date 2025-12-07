export const BLOOD_GROUPS = [
  'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'
];

export const ACTIVITY_LEVELS = [
  { value: 'sedentary', label: 'Sedentary (Little to no exercise)' },
  { value: 'light', label: 'Lightly Active (Light exercise 1-3 days/week)' },
  { value: 'moderate', label: 'Moderately Active (Moderate exercise 3-5 days/week)' },
  { value: 'active', label: 'Very Active (Hard exercise 6-7 days/week)' },
  { value: 'athlete', label: 'Super Active (Physical job or training)' }
];

export const DIETARY_PREFERENCES = [
  'No Restrictions',
  'Vegetarian',
  'Vegan',
  'Pescatarian',
  'Keto',
  'Paleo',
  'Gluten-Free',
  'Lactose-Free'
];

export const INITIAL_USER_PROFILE = {
  age: '',
  gender: '',
  bloodGroup: '',
  weight: '',
  height: '',
  activityLevel: 'moderate',
  medicalHistory: '',
  dietaryPreference: 'No Restrictions'
};
