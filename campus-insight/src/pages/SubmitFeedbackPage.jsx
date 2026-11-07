import React, { useState } from 'react';
import { Building2, Utensils, Bus, HeartPulse, Send, Loader2, EyeOff } from 'lucide-react';
import { saveFeedbackToFirestore } from '../services/firebaseDb';

const LOCATION_OPTIONS = {
  Dormitories: ['F1', 'F2', 'F3', 'F4', 'F5', 'S1', 'S2', 'S3', 'S4', 'S5', 'L1', 'L2', 'L3', 'L4', 'L5'],
  Canteen: ['M-Square', 'D1 Canteen', 'Lamduan Canteen', 'E1 Canteen', 'E2 Canteen'],
  Services: ['Shuttle Bus (Ngeap)', 'Library', 'Campus Wifi', 'Sports Center & General Facilities'],
  'Health Services': ['Inside Hospital', 'Student Health Clinic']
};

const CATEGORY_CRITERIA = {
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

const CATEGORIES = [
  { id: 'Dormitories', label: 'Dormitories', icon: Building2 },
  { id: 'Canteen', label: 'Canteens', icon: Utensils },
  { id: 'Services', label: 'Services & Wifi', icon: Bus },
  { id: 'Health Services', label: 'Health Services', icon: HeartPulse }
];

export default function SubmitFeedbackPage({ user, onSubmitted }) {
  const [category, setCategory] = useState('Dormitories');
  const [target, setTarget] = useState(LOCATION_OPTIONS['Dormitories'][0]);
  const [ratings, setRatings] = useState({
    facility: 5, security: 5, electric: 5, cleanliness: 5, water: 5
  });
  const [comment, setComment] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCategorySelect = (newCat) => {
    setCategory(newCat);
    setTarget(LOCATION_OPTIONS[newCat][0]);
    const defaultRatings = {};
    CATEGORY_CRITERIA[newCat].forEach((c) => {
      defaultRatings[c.key] = 5;
    });
    setRatings(defaultRatings);
  };

  const handleRatingChange = (key, value) => {
    setRatings((prev) => ({ ...prev, [key]: Number(value) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return alert('Please provide a short feedback comment.');

    setIsSubmitting(true);
    try {
      // Determine author name based on anonymous toggle & logged-in user profile
      const authorName = isAnonymous 
        ? "Anonymous MFU Student" 
        : (user?.displayName || user?.email || "MFU Student");

      await saveFeedbackToFirestore({
        category,
        target,
        author: authorName,
        userEmail: user?.email || null, // Stores user email for Profile history tracking
        isAnonymous,
        ratings,
        comment
      });

      alert('Feedback successfully submitted to Firestore!');
      if (onSubmitted) onSubmitted();
    } catch (err) {
      console.error(err);
      alert('Failed to connect to Firestore. Check rules or browser console.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: '780px', margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2.1rem', fontWeight: '800', margin: '0 0 0.4rem 0', color: '#0F172A', letterSpacing: '-0.02em' }}>
          Submit Campus Feedback
        </h1>
        <p style={{ color: '#475569', fontSize: '1rem', margin: 0, fontWeight: '500' }}>
          Your evaluation directly contributes to improving Mae Fah Luang University infrastructure.
        </p>
      </div>

      <form onSubmit={handleSubmit} style={{ background: '#FFFFFF', padding: '2.25rem', borderRadius: '16px', border: '1px solid #E2E8F0', boxShadow: '0 10px 30px -5px rgba(0,0,0,0.04)' }}>
        
        {/* Category Cards */}
        <div style={{ marginBottom: '2rem' }}>
          <label style={{ display: 'block', fontSize: '0.875rem', color: '#8B0000', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.85rem' }}>
            1. Select Campus Category
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem' }}>
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              const isSelected = category === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => handleCategorySelect(cat.id)}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '0.6rem',
                    padding: '1.1rem 0.75rem',
                    borderRadius: '12px',
                    border: isSelected ? '2px solid #8B0000' : '1px solid #E2E8F0',
                    backgroundColor: isSelected ? '#FFF5F5' : '#FFFFFF',
                    color: isSelected ? '#8B0000' : '#475569',
                    cursor: 'pointer',
                    fontWeight: isSelected ? '700' : '600',
                    fontSize: '0.85rem'
                  }}
                >
                  <Icon size={22} color={isSelected ? '#8B0000' : '#64748B'} strokeWidth={isSelected ? 2.3 : 1.8} />
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Location Dropdown */}
        <div style={{ marginBottom: '2rem' }}>
          <label style={{ display: 'block', fontSize: '0.875rem', color: '#8B0000', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.6rem' }}>
            2. Select Specific Location / Facility
          </label>
          <select 
            value={target} 
            onChange={(e) => setTarget(e.target.value)}
            style={{ width: '100%', padding: '0.85rem 1rem', background: '#F8FAFC', color: '#0F172A', border: '1px solid #CBD5E1', borderRadius: '10px', fontSize: '0.95rem', fontWeight: '600', outline: 'none' }}
          >
            {LOCATION_OPTIONS[category].map((loc) => (
              <option key={loc} value={loc} style={{ color: '#0F172A' }}>{loc}</option>
            ))}
          </select>
        </div>

        {/* Metrics */}
        <div style={{ marginBottom: '2rem', background: '#F8FAFC', padding: '1.5rem', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
          <label style={{ display: 'block', fontSize: '0.875rem', color: '#8B0000', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1.25rem' }}>
            3. Detailed Rating Metrics
          </label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.35rem' }}>
            {CATEGORY_CRITERIA[category].map((criterion) => {
              const currentScore = ratings[criterion.key] || 5;
              return (
                <div key={criterion.key}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.925rem', marginBottom: '0.4rem', fontWeight: '600', color: '#1E293B' }}>
                    <span>{criterion.label}</span>
                    <span style={{ color: '#B45309', fontWeight: '700' }}>{currentScore} / 5 Score</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    step="1"
                    value={currentScore}
                    onChange={(e) => handleRatingChange(criterion.key, e.target.value)}
                    style={{ width: '100%', accentColor: '#8B0000', cursor: 'pointer' }}
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* Text Feedback */}
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', fontSize: '0.875rem', color: '#8B0000', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.6rem' }}>
            4. Review & Recommendations
          </label>
          <textarea 
            rows="4" 
            placeholder="Share specific context, issues encountered, or recommended improvements..."
            value={comment} 
            onChange={(e) => setComment(e.target.value)} 
            style={{ width: '100%', padding: '0.85rem 1rem', background: '#F8FAFC', color: '#0F172A', border: '1px solid #CBD5E1', borderRadius: '10px', fontSize: '0.95rem', fontWeight: '500', resize: 'vertical', outline: 'none' }}
          />
        </div>

        {/* Anonymous Posting Option */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '2rem', background: '#F8FAFC', padding: '0.85rem 1rem', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
          <input 
            type="checkbox" 
            id="anonFeedbackToggle" 
            checked={isAnonymous} 
            onChange={(e) => setIsAnonymous(e.target.checked)} 
            style={{ accentColor: '#8B0000', width: '18px', height: '18px', cursor: 'pointer' }} 
          />
          <label htmlFor="anonFeedbackToggle" style={{ fontSize: '0.9rem', color: '#334155', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <EyeOff size={16} color="#64748B" /> Post feedback anonymously (hide my name on Category Feed)
          </label>
        </div>

        {/* Submit Button */}
        <button 
          type="submit" 
          disabled={isSubmitting}
          style={{ 
            width: '100%', 
            padding: '0.95rem', 
            background: isSubmitting ? '#94A3B8' : 'linear-gradient(135deg, #8B0000 0%, #A71930 100%)', 
            color: '#FFFFFF', 
            border: 'none', 
            borderRadius: '10px', 
            cursor: isSubmitting ? 'not-allowed' : 'pointer', 
            fontWeight: '700',
            fontSize: '1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.6rem',
            boxShadow: '0 4px 16px rgba(139, 0, 0, 0.3)'
          }}
        >
          {isSubmitting ? (
            <>
              <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
              Saving to Firestore...
            </>
          ) : (
            <>
              <Send size={18} />
              Submit Feedback Report
            </>
          )}
        </button>

      </form>
    </div>
  );
}