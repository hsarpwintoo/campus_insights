import React, { useState, useEffect } from 'react';
import { Home, MessageSquare, Star, Sparkles, User, LogOut, GraduationCap } from 'lucide-react';
import HomePage from './pages/HomePage';
import FeedPage from './pages/FeedPage';
import SubmitFeedbackPage from './pages/SubmitFeedbackPage';
import InsightsPage from './pages/InsightsPage';
import ProfilePage from './pages/ProfilePage';
import LoginPage from './pages/LoginPage';
import { subscribeToAuth, logoutUser } from './services/firebaseDb';

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [user, setUser] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeToAuth((currentUser) => {
      setUser(currentUser);
      setLoadingAuth(false);
    });
    return () => unsubscribe();
  }, []);

  // Show neutral loading state while checking Google auth status
  if (loadingAuth) {
    return (
      <div style={{ display: 'grid', placeItems: 'center', minHeight: '100vh', backgroundColor: '#F8FAFC', color: '#64748B', fontFamily: 'system-ui, sans-serif' }}>
        <p style={{ fontWeight: '600', fontSize: '1rem' }}>Loading Campus Insight...</p>
      </div>
    );
  }

  // 1. STANDALONE LOGIN SCREEN (If user is not logged in)
  if (!user) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', backgroundColor: '#F8FAFC', width: '100vw', fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>
        <LoginPage onLoginSuccess={() => setActiveTab('home')} />
      </div>
    );
  }

  // 2. MAIN DASHBOARD (Only visible after signing in)
  const navItems = [
    { id: 'home', label: 'Overview', icon: Home },
    { id: 'feed', label: 'Category Feed', icon: MessageSquare },
    { id: 'submit', label: 'Submit Feedback', icon: Star },
    { id: 'insights', label: 'AI Insights', icon: Sparkles },
    { id: 'profile', label: 'Profile & Settings', icon: User }
  ];

  return (
    <div style={{ display: 'flex', width: '100vw', minHeight: '100vh', backgroundColor: '#F8FAFC', color: '#0F172A', fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>
      
      {/* Sidebar Navigation */}
      <aside style={{ width: '270px', minWidth: '270px', backgroundColor: '#FFFFFF', borderRight: '1px solid #E2E8F0', padding: '2rem 1.25rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        
        <div>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '2.5rem', padding: '0 0.25rem' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'linear-gradient(135deg, #8B0000 0%, #A71930 100%)', display: 'grid', placeItems: 'center', color: '#FFFFFF', boxShadow: '0 4px 12px rgba(139, 0, 0, 0.25)' }}>
              <GraduationCap size={24} strokeWidth={2.2} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.1rem', fontWeight: '800', margin: 0, color: '#0F172A', letterSpacing: '-0.02em' }}>Campus Insight</h2>
              <span style={{ fontSize: '0.75rem', color: '#8B0000', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Mae Fah Luang Univ.</span>
            </div>
          </div>

          {/* Nav Items */}
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
        </div>

        {/* User Account & Sign Out Footer */}
        <div style={{ paddingTop: '1rem', borderTop: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button
            onClick={() => setActiveTab('profile')}
            style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem', borderRadius: '10px', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left' }}
          >
            {user.photoURL ? (
              <img src={user.photoURL} alt="Profile" style={{ width: '34px', height: '34px', borderRadius: '50%' }} />
            ) : (
              <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: '#8B0000', color: '#FFF', display: 'grid', placeItems: 'center', fontWeight: '700', fontSize: '0.85rem' }}>
                {user.displayName?.charAt(0) || 'U'}
              </div>
            )}
            <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: '700', color: '#0F172A', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.displayName || 'MFU Student'}</div>
              <div style={{ fontSize: '0.725rem', color: '#64748B' }}>View Profile</div>
            </div>
          </button>

          <button
            onClick={logoutUser}
            title="Sign Out"
            style={{ padding: '0.5rem', background: '#FEE2E2', color: '#991B1B', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'grid', placeItems: 'center' }}
          >
            <LogOut size={16} />
          </button>
        </div>

      </aside>

      {/* Main Content Viewport */}
      <main style={{ flex: 1, padding: '2.5rem 3.5rem', overflowY: 'auto' }}>
        {activeTab === 'home' && <HomePage onNavigate={setActiveTab} />}
        {activeTab === 'feed' && <FeedPage />}
        {activeTab === 'submit' && <SubmitFeedbackPage user={user} onSubmitted={() => setActiveTab('feed')} />}
        {activeTab === 'insights' && <InsightsPage />}
        {activeTab === 'profile' && <ProfilePage user={user} />}
      </main>

    </div>
  );
}