import { Building2, Bus, HeartPulse, Utensils } from 'lucide-react';

export const LOCATION_OPTIONS = {
  Dormitories: ['F1', 'F2', 'F3', 'F4', 'F5', 'S1', 'S2', 'S3', 'S4', 'S5', 'L1', 'L2', 'L3', 'L4', 'L5'],
  Canteen: ['M-Square', 'D1 Canteen', 'Lamduan Canteen', 'E1 Canteen', 'E2 Canteen'],
  Services: ['Shuttle Bus (Ngeap)', 'Library', 'Campus Wifi', 'Sports Center & General Facilities'],
  'Health Services': ['Inside Hospital', 'Student Health Clinic']
};

export const CATEGORY_CRITERIA = {
  Dormitories: [
    { key: 'facility', label: 'Facility Quality' },
    { key: 'security', label: 'Security & Access' },
    { key: 'electric', label: 'Electricity & Utilities' },
    { key: 'cleanliness', label: 'Cleanliness & Hygiene' },
    { key: 'water', label: 'Water Pressure & Supply' }
  ],
  Canteen: [
    { key: 'clean', label: 'Hygiene & Cleanliness' },
    { key: 'variety', label: 'Food Variety' },
    { key: 'religious', label: 'Halal & Dietary Suitability' },
    { key: 'healthy', label: 'Healthy & Balanced Options' },
    { key: 'delicious', label: 'Taste & Preparation' }
  ],
  Services: [
    { key: 'service', label: 'Staff Service Standard' },
    { key: 'speed', label: 'Speed & Timeliness' },
    { key: 'facility', label: 'Infrastructure & Equipment' }
  ],
  'Health Services': [
    { key: 'clean', label: 'Facility Cleanliness' },
    { key: 'insurance', label: 'Insurance & Coverage' },
    { key: 'service', label: 'Medical Staff Service' },
    { key: 'facility', label: 'Equipment & Readiness' },
    { key: 'fees', label: 'Fee Transparency' }
  ]
};

export const CATEGORIES = [
  { id: 'Dormitories', label: 'Dormitories', icon: Building2, color: '#762316' },
  { id: 'Canteen', label: 'Canteens', icon: Utensils, color: '#b59a43' },
  { id: 'Services', label: 'Services & Wifi', icon: Bus, color: '#5e73b7' },
  { id: 'Health Services', label: 'Health Services', icon: HeartPulse, color: '#86a965' }
];

export const getLocationCategory = (locationName) => {
  if (!locationName) return 'Dormitories';
  for (const [cat, locs] of Object.entries(LOCATION_OPTIONS)) {
    if (locs.includes(locationName)) {
      return cat;
    }
  }
  return 'Dormitories';
};
