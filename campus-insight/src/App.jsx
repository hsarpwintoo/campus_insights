import { useState, useEffect } from 'react';
import { Home, MessageSquare, Plus, Sparkles, User, GraduationCap, Moon, Sun, ClipboardCheck } from 'lucide-react';
import HomePage from './pages/HomePage';
import FeedPage from './pages/FeedPage';
import SubmitFeedbackPage from './pages/SubmitFeedbackPage';
import InsightsPage from './pages/InsightsPage';
import ProfilePage from './pages/ProfilePage';
import LoginPage from './pages/LoginPage';
import EvaluationPage from './pages/EvaluationPage';
import LecturerDetailPage from './pages/LecturerDetailPage';
import LecturerEvaluationPage from './pages/LecturerEvaluationPage';
import { subscribeToAuth, subscribeToLecturerReviews, logoutUser, isMfuEmail } from './services/firebaseDb';
import './App.css';

const getSavedTheme = () => {
  try {
    return localStorage.getItem('campus-insight-theme') === 'dark' ? 'dark' : 'light';
  } catch (error) {
    console.warn('Unable to read saved appearance preference:', error);
    return 'light';
  }
};

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [theme, setTheme] = useState(getSavedTheme);
  const [user, setUser] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [selectedLecturerContext, setSelectedLecturerContext] = useState(null);
  const [lecturerReviews, setLecturerReviews] = useState([]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem('campus-insight-theme', theme);
    } catch (error) {
      console.warn('Unable to save appearance preference:', error);
    }
  }, [theme]);

  useEffect(() => {
    const unsubscribe = subscribeToAuth((currentUser) => {
      if (currentUser && !isMfuEmail(currentUser.email)) {
        logoutUser().catch((err) => console.error('Sign out failed:', err));
        setUser(null);
        setLoadingAuth(false);
        return;
      }
      setUser(currentUser);
      setLoadingAuth(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => subscribeToLecturerReviews(setLecturerReviews), []);

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
      <div className="login-shell" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', backgroundColor: '#F8FAFC', width: '100vw', fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>
        <LoginPage
          onLoginSuccess={() => setActiveTab('home')}
          theme={theme}
          onThemeToggle={() => setTheme((currentTheme) => currentTheme === 'dark' ? 'light' : 'dark')}
        />
      </div>
    );
  }

  // 2. MAIN DASHBOARD (Only visible after signing in)
  const navItems = [
    { id: 'home', label: 'Overview', icon: Home },
    { id: 'feed', label: 'Category Feed', icon: MessageSquare },
    { id: 'submit', label: 'Submit Feedback', icon: Plus },
    { id: 'evaluation', label: 'Evaluation', icon: ClipboardCheck },
    { id: 'insights', label: 'AI Insights', icon: Sparkles },
    { id: 'profile', label: 'Profile & Settings', icon: User }
  ];
  const openEvaluation = () => {
    setSelectedLecturerContext(null);
    setActiveTab('evaluation');
  };

  return (
    <div className="dashboard-shell">
      
      {/* Sidebar Navigation */}
      <aside className="dashboard-sidebar">
        
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
                  onClick={item.id === 'evaluation' ? openEvaluation : () => setActiveTab(item.id)}
                  className={`dashboard-nav-button${isActive ? ' is-active' : ''}`}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.85rem',
                    padding: '0.85rem 1rem',
                    borderRadius: '10px',
                    border: 'none',
                    backgroundColor: isActive ? '#762316' : 'transparent',
                    color: isActive ? '#FFFFFF' : '#475569',
                    fontWeight: isActive ? '700' : '600',
                    fontSize: '0.925rem',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.15s ease-in-out',
                    boxShadow: isActive ? '0 4px 14px rgba(118, 35, 22, 0.25)' : 'none'
                  }}
                >
                  <Icon size={18} strokeWidth={isActive ? 2.3 : 1.8} />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* User account and appearance controls */}
        <div className="sidebar-footer" style={{ paddingTop: '1rem', borderTop: '1px solid #F1F5F9', display: 'flex', alignItems: 'center' }}>
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
            type="button"
            className="theme-toggle-button"
            onClick={() => setTheme((currentTheme) => currentTheme === 'dark' ? 'light' : 'dark')}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>

      </aside>

      {/* Main Content Viewport */}
      <main className="dashboard-main">
        {activeTab === 'home' && <HomePage onNavigate={setActiveTab} user={user} />}
        {activeTab === 'feed' && <FeedPage onNavigate={setActiveTab} user={user} />}
        {activeTab === 'submit' && <SubmitFeedbackPage user={user} onSubmitted={() => setActiveTab('feed')} />}
        {activeTab === 'evaluation' && !selectedLecturerContext && (
          <EvaluationPage onSelectLecturer={(school, lecturer, reviews) => setSelectedLecturerContext({ school, lecturer, reviews, view: 'detail' })} />
        )}
        {activeTab === 'evaluation' && selectedLecturerContext?.view === 'detail' && (
          <LecturerDetailPage
            school={selectedLecturerContext.school}
            lecturer={selectedLecturerContext.lecturer}
            reviews={lecturerReviews.filter(({ lecturerId }) => lecturerId === selectedLecturerContext.lecturer.id)}
            onBack={() => setSelectedLecturerContext(null)}
            onEvaluate={() => setSelectedLecturerContext((current) => ({ ...current, view: 'form' }))}
          />
        )}
        {activeTab === 'evaluation' && selectedLecturerContext?.view === 'form' && (
          <LecturerEvaluationPage
            user={user}
            school={selectedLecturerContext.school}
            lecturer={selectedLecturerContext.lecturer}
            onBack={() => setSelectedLecturerContext((current) => ({ ...current, view: 'detail' }))}
          />
        )}
        {activeTab === 'insights' && <InsightsPage />}
        {activeTab === 'profile' && <ProfilePage user={user} />}
      </main>

    </div>
  );
}