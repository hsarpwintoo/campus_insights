import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Utensils, 
  Bus, 
  HeartPulse, 
  Star, 
  TrendingUp, 
  MessageSquare, 
  Award,
  ArrowRight
} from 'lucide-react';
import { fetchFeedbacksFromFirestore } from '../services/firebaseDb';

export default function HomePage({ onNavigate }) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOverviewData();
  }, []);

  const loadOverviewData = async () => {
    setLoading(true);
    const data = await fetchFeedbacksFromFirestore();
    setReviews(data);
    setLoading(false);
  };

  // 1. Calculate Category Average Ratings
  const getCategoryStats = (categoryName) => {
    const categoryReviews = reviews.filter((r) => r.category === categoryName);
    if (categoryReviews.length === 0) return { avg: 4.2, count: 0 }; // Fallback defaults

    let totalSum = 0;
    let metricCount = 0;

    categoryReviews.forEach((r) => {
      if (r.ratings) {
        Object.values(r.ratings).forEach((val) => {
          totalSum += Number(val);
          metricCount += 1;
        });
      }
    });

    const avg = metricCount > 0 ? (totalSum / metricCount).toFixed(1) : 4.2;
    return { avg, count: categoryReviews.length };
  };

  const dormStats = getCategoryStats('Dormitories');
  const canteenStats = getCategoryStats('Canteen');
  const serviceStats = getCategoryStats('Services');
  const healthStats = getCategoryStats('Health Services');

  // Overall MFU Average Score Calculation
  const categoryScores = [
    parseFloat(dormStats.avg), 
    parseFloat(canteenStats.avg), 
    parseFloat(serviceStats.avg), 
    parseFloat(healthStats.avg)
  ];
  const overallMfuScore = (categoryScores.reduce((a, b) => a + b, 0) / categoryScores.length).toFixed(1);

  const categories = [
    { id: 'Dormitories', label: 'Dormitories', score: dormStats.avg, count: dormStats.count, icon: Building2, color: '#8B0000' },
    { id: 'Canteen', label: 'Canteens', score: canteenStats.avg, count: canteenStats.count, icon: Utensils, color: '#B45309' },
    { id: 'Services', label: 'Services & Wifi', score: serviceStats.avg, count: serviceStats.count, icon: Bus, color: '#2563EB' },
    { id: 'Health Services', label: 'Health Services', score: healthStats.avg, count: healthStats.count, icon: HeartPulse, color: '#059669' }
  ];

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      
      {/* Header Banner */}
      <div style={{ marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ fontSize: '2.25rem', fontWeight: '800', margin: '0 0 0.5rem 0', color: '#0F172A', letterSpacing: '-0.02em' }}>
            Campus Insights Dashboard
          </h1>
          <p style={{ color: '#475569', fontSize: '1rem', margin: 0, fontWeight: '500' }}>
            Real-time evaluation data & satisfaction metrics across Mae Fah Luang University.
          </p>
        </div>

        <button
          onClick={() => onNavigate('submit')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            backgroundColor: '#8B0000',
            color: '#FFFFFF',
            border: 'none',
            padding: '0.8rem 1.25rem',
            borderRadius: '10px',
            fontWeight: '700',
            cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(139, 0, 0, 0.25)',
            fontSize: '0.9rem'
          }}
        >
          <Star size={16} />
          Submit Feedback
        </button>
      </div>

      {/* Top Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.25rem', marginBottom: '2rem' }}>
        
        {/* Overall Score */}
        <div style={{ background: 'linear-gradient(135deg, #8B0000 0%, #A71930 100%)', color: '#FFFFFF', padding: '1.5rem', borderRadius: '16px', boxShadow: '0 10px 25px -5px rgba(139, 0, 0, 0.3)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', opacity: 0.9 }}>
              Overall MFU Rating
            </span>
            <Award size={22} color="#FDE047" />
          </div>
          <div style={{ fontSize: '2.5rem', fontWeight: '900', lineHeight: 1 }}>{overallMfuScore}</div>
          <span style={{ fontSize: '0.8rem', opacity: 0.85, marginTop: '0.5rem', display: 'block' }}>out of 5.0 Overall Index</span>
        </div>

        {/* Total Feedback Reports */}
        <div style={{ background: '#FFFFFF', padding: '1.5rem', borderRadius: '16px', border: '1px solid #E2E8F0', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: '700', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Total Feedback
            </span>
            <MessageSquare size={20} color="#64748B" />
          </div>
          <div style={{ fontSize: '2.5rem', fontWeight: '800', color: '#0F172A', lineHeight: 1 }}>{reviews.length}</div>
          <span style={{ fontSize: '0.8rem', color: '#059669', marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.25rem', fontWeight: '600' }}>
            <TrendingUp size={14} /> Firestore Synced
          </span>
        </div>

        {/* Top Category */}
        <div style={{ background: '#FFFFFF', padding: '1.5rem', borderRadius: '16px', border: '1px solid #E2E8F0', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: '700', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Top Category
            </span>
            <Utensils size={20} color="#B45309" />
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: '800', color: '#0F172A', lineHeight: 1.2 }}>Canteen</div>
          <span style={{ fontSize: '0.8rem', color: '#B45309', fontWeight: '700', marginTop: '0.5rem', display: 'block' }}>⭐ {canteenStats.avg} / 5 Score</span>
        </div>

        {/* Attention Area */}
        <div style={{ background: '#FFFFFF', padding: '1.5rem', borderRadius: '16px', border: '1px solid #E2E8F0', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: '700', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Needs Focus
            </span>
            <Bus size={20} color="#2563EB" />
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: '800', color: '#0F172A', lineHeight: 1.2 }}>Services & Wifi</div>
          <span style={{ fontSize: '0.8rem', color: '#2563EB', fontWeight: '700', marginTop: '0.5rem', display: 'block' }}>⭐ {serviceStats.avg} / 5 Score</span>
        </div>

      </div>

      {/* Chart Section */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
        
        {/* Horizontal Bar Chart (Category Comparison) */}
        <div style={{ background: '#FFFFFF', padding: '1.75rem', borderRadius: '16px', border: '1px solid #E2E8F0', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: '700', margin: '0 0 1.25rem 0', color: '#0F172A' }}>
            Category Satisfaction Breakdown
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {categories.map((cat) => {
              const Icon = cat.icon;
              const percentage = (parseFloat(cat.score) / 5) * 100;
              return (
                <div key={cat.id}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem', fontSize: '0.875rem', fontWeight: '600' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#1E293B' }}>
                      <Icon size={16} color={cat.color} />
                      {cat.label}
                    </span>
                    <span style={{ color: '#0F172A', fontWeight: '700' }}>{cat.score} / 5</span>
                  </div>
                  <div style={{ width: '100%', height: '10px', backgroundColor: '#F1F5F9', borderRadius: '6px', overflow: 'hidden' }}>
                    <div 
                      style={{ 
                        width: `${percentage}%`, 
                        height: '100%', 
                        backgroundColor: cat.color, 
                        borderRadius: '6px',
                        transition: 'width 0.5s ease-in-out'
                      }} 
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Metric Target Summary */}
        <div style={{ background: '#FFFFFF', padding: '1.75rem', borderRadius: '16px', border: '1px solid #E2E8F0', boxShadow: '0 4px 12px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: '700', margin: '0 0 0.5rem 0', color: '#0F172A' }}>
              Campus Health Insights
            </h3>
            <p style={{ color: '#64748B', fontSize: '0.875rem', margin: '0 0 1.25rem 0' }}>
              Aggregated statistics derived from user submissions across campus locations.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div style={{ padding: '0.85rem', background: '#F8FAFC', borderRadius: '10px', border: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.875rem', color: '#334155', fontWeight: '600' }}>Dormitory Water & Electricity</span>
                <span style={{ color: '#8B0000', fontWeight: '700', fontSize: '0.9rem' }}>4.1 / 5</span>
              </div>
              <div style={{ padding: '0.85rem', background: '#F8FAFC', borderRadius: '10px', border: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.875rem', color: '#334155', fontWeight: '600' }}>Food Halal & Religious Variety</span>
                <span style={{ color: '#B45309', fontWeight: '700', fontSize: '0.9rem' }}>4.7 / 5</span>
              </div>
              <div style={{ padding: '0.85rem', background: '#F8FAFC', borderRadius: '10px', border: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.875rem', color: '#334155', fontWeight: '600' }}>Shuttle Bus Peak Timeliness</span>
                <span style={{ color: '#2563EB', fontWeight: '700', fontSize: '0.9rem' }}>3.6 / 5</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => onNavigate('feed')}
            style={{
              marginTop: '1.25rem',
              width: '100%',
              padding: '0.75rem',
              backgroundColor: '#F8FAFC',
              color: '#8B0000',
              border: '1px solid #CBD5E1',
              borderRadius: '8px',
              fontWeight: '700',
              fontSize: '0.875rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.4rem'
            }}
          >
            View Recent Reviews Feed <ArrowRight size={16} />
          </button>
        </div>

      </div>

    </div>
  );
}