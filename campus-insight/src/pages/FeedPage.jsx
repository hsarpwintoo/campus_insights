import React, { useState, useEffect } from 'react';
import { fetchFeedbacksFromFirestore } from '../services/firebaseDb';

export default function FeedPage() {
  const [feed, setFeed] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFeed();
  }, []);

  const loadFeed = async () => {
    setLoading(true);
    const data = await fetchFeedbacksFromFirestore();
    setFeed(data);
    setLoading(false);
  };

  if (loading) {
    return <div style={{ color: '#475569', fontSize: '1rem' }}>Loading reviews from Firestore...</div>;
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '2.1rem', fontWeight: '800', margin: '0 0 1.5rem 0', color: '#0F172A' }}>
        Campus Feedback Feed
      </h1>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {feed.length === 0 ? (
          <p style={{ color: '#64748B' }}>No feedback submitted yet.</p>
        ) : (
          feed.map((item) => (
            <div key={item.id} style={{ background: '#FFFFFF', padding: '1.25rem', borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <strong style={{ color: '#8B0000', fontSize: '1rem' }}>{item.category} ({item.target})</strong>
                <span style={{ color: '#64748B', fontSize: '0.85rem' }}>{item.createdAt}</span>
              </div>
              <p style={{ margin: '0.5rem 0', color: '#1E293B', fontSize: '0.95rem' }}>"{item.comment}"</p>
              <span style={{ fontSize: '0.8rem', color: '#475569', fontWeight: '600' }}>Posted by {item.author || 'MFU Student'}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}