import React, { useState, useEffect } from 'react';
import { subscribeToFeedbacks } from '../services/firebaseDb';
import { Building2, Utensils, Bus, HeartPulse, Loader2 } from 'lucide-react';

const CATEGORY_ICONS = {
  Dormitories: Building2,
  Canteen: Utensils,
  Services: Bus,
  'Health Services': HeartPulse
};

export default function FeedPage() {
  const [feed, setFeed] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Subscribe to instant Firestore updates
    const unsubscribe = subscribeToFeedbacks((updatedFeed) => {
      setFeed(updatedFeed);
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#64748B', fontSize: '1rem', padding: '2rem 0' }}>
        <Loader2 className="animate-spin" size={20} color="#8B0000" />
        Loading campus reviews...
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2.1rem', fontWeight: '800', margin: '0 0 0.4rem 0', color: '#0F172A', letterSpacing: '-0.02em' }}>
          Campus Feedback Feed
        </h1>
        <p style={{ color: '#475569', fontSize: '1rem', margin: 0, fontWeight: '500' }}>
          Live feedback submitted by students across MFU facilities.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {feed.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', background: '#FFFFFF', borderRadius: '12px', border: '1px solid #E2E8F0', color: '#64748B' }}>
            No feedback submitted yet.
          </div>
        ) : (
          feed.map((item) => {
            const Icon = CATEGORY_ICONS[item.category] || Building2;
            return (
              <div 
                key={item.id} 
                style={{ 
                  background: '#FFFFFF', 
                  padding: '1.4rem', 
                  borderRadius: '14px', 
                  border: '1px solid #E2E8F0', 
                  boxShadow: '0 4px 14px rgba(0,0,0,0.03)',
                  transition: 'transform 0.15s ease'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#8B0000', fontWeight: '700', fontSize: '0.95rem' }}>
                    <Icon size={18} color="#8B0000" />
                    <span>{item.category} ({item.target})</span>
                  </div>
                  <span style={{ color: '#64748B', fontSize: '0.825rem', fontWeight: '500' }}>{item.createdAt}</span>
                </div>
                
                <p style={{ margin: '0.6rem 0', color: '#1E293B', fontSize: '0.975rem', lineHeight: 1.5, fontWeight: '500' }}>
                  "{item.comment}"
                </p>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.85rem', paddingTop: '0.6rem', borderTop: '1px solid #F1F5F9' }}>
                  <span style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: '600' }}>
                    Posted by {item.author || 'MFU Student'}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}