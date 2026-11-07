import React, { useState } from 'react';
import { Home, MessageSquare, Star, Sparkles, GraduationCap } from 'lucide-react';
import HomePage from './pages/HomePage';
import FeedPage from './pages/FeedPage';
import SubmitFeedbackPage from './pages/SubmitFeedbackPage';
import InsightsPage from './pages/InsightsPage';

export default function App() {
  const [activeTab, setActiveTab] = useState('submit');

  const navItems = [
    { id: 'home', label: 'Overview', icon: Home },
    { id: 'feed', label: 'Category Feed', icon: MessageSquare },
    { id: 'submit', label: 'Submit Feedback', icon: Star },
    { id: 'insights', label: 'AI Insights', icon: Sparkles }
  ];

  return (
    <div style={{ display: 'flex', width: '100vw', minHeight: '100vh', backgroundColor: '#F8FAFC', color: '#0F172A' }}>
      
      {/* Sidebar Navigation */}
      <aside style={{
        width: '270px',
        minWidth: '270px',
        backgroundColor: '#FFFFFF',
        borderRight: '1px solid #E2E8F0',
        padding: '2rem 1.25rem',
        display: 'flex',
        flexDirection: 'column'
      }}>
        
        {/* MFU Header Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '2.5rem', padding: '0 0.25rem' }}>
          <div style={{ 
            width: '44px', 
            height: '44px', 
            borderRadius: '12px', 
            background: 'linear-gradient(135deg, #8B0000 0%, #A71930 100%)', 
            display: 'grid', 
            placeItems: 'center', 
            color: '#FFFFFF',
            boxShadow: '0 4px 12px rgba(139, 0, 0, 0.25)'
          }}>
            <GraduationCap size={24} strokeWidth={2.2} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.1rem', fontWeight: '800', margin: 0, color: '#0F172A', letterSpacing: '-0.02em' }}>Campus Insight</h2>
            <span style={{ fontSize: '0.75rem', color: '#8B0000', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Mae Fah Luang Univ.</span>
          </div>
        </div>

        {/* Navigation Items */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.85rem',
                  padding: '0.85rem 1rem',
                  borderRadius: '10px',
                  border: 'none',
                  backgroundColor: isActive ? '#8B0000' : 'transparent',
                  color: isActive ? '#FFFFFF' : '#475569',
                  fontWeight: isActive ? '700' : '600',
                  fontSize: '0.925rem',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s ease-in-out',
                  boxShadow: isActive ? '0 4px 14px rgba(139, 0, 0, 0.25)' : 'none'
                }}
              >
                <Icon size={18} strokeWidth={isActive ? 2.3 : 1.8} color={isActive ? '#FFFFFF' : '#64748B'} />
                {item.label}
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Main Content Area */}
      <main style={{ flex: 1, padding: '2.5rem 3.5rem', overflowY: 'auto' }}>
        {activeTab === 'home' && <HomePage onNavigate={setActiveTab} />}
        {activeTab === 'feed' && <FeedPage />}
        {activeTab === 'submit' && <SubmitFeedbackPage onSubmitted={() => setActiveTab('feed')} />}
        {activeTab === 'insights' && <InsightsPage />}
      </main>

    </div>
  );
}