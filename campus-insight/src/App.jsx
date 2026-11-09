import { useState, useEffect, lazy, Suspense } from 'react';
import { Home, MessageSquare, Plus, Sparkles, User, GraduationCap, Moon, Sun, ClipboardCheck, ShieldCheck, Loader2 } from 'lucide-react';
import HomePage from './pages/HomePage';
import FeedPage from './pages/FeedPage';
import LoginPage from './pages/LoginPage';

// Code-split secondary views so the initial bundle is tiny (<100KB) and loads in <150ms
const SubmitFeedbackPage = lazy(() => import('./pages/SubmitFeedbackPage'));
const InsightsPage = lazy(() => import('./pages/InsightsPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const EvaluationPage = lazy(() => import('./pages/EvaluationPage'));
const LecturerDetailPage = lazy(() => import('./pages/LecturerDetailPage'));
const LecturerEvaluationPage = lazy(() => import('./pages/LecturerEvaluationPage'));
const AdminPortalPage = lazy(() => import('./pages/AdminPortalPage'));
import {
  subscribeToAuth,
  subscribeToLecturerReviews,
  logoutUser,
  isMfuEmail,
  isAdminUser,
  getSavedAdminSession
} from './services/firebaseDb';
import './App.css';

const getSavedTheme = () => {
  try {
    return localStorage.getItem('campus-insight-theme') === 'dark' ? 'dark' : 'light';
  } catch (error) {
    console.warn('Unable to read saved appearance preference:', error);
    return 'light';
  }
};

const getCachedUser = () => {
  const savedAdmin = getSavedAdminSession();
  if (savedAdmin) return savedAdmin;
  try {
    const raw = localStorage.getItem('campus_user_cache');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export default function App() {
  const [activeTab, setActiveTab] = useState(() => {
    const savedAdmin = getSavedAdminSession();
    return savedAdmin ? 'admin' : 'home';
  });
  const [theme, setTheme] = useState(getSavedTheme);
  const [user, setUser] = useState(getCachedUser);
  const [loadingAuth, setLoadingAuth] = useState(() => !getCachedUser());
  const [selectedLecturerContext, setSelectedLecturerContext] = useState(null);
  const [lecturerReviews, setLecturerReviews] = useState(() => {
    try {
      const cached = localStorage.getItem('campus_cached_lecturer_reviews');
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem('campus-insight-theme', theme);
    } catch (error) {
      console.warn('Unable to save appearance preference:', error);
    }
  }, [theme]);

  useEffect(() => {
    // 300ms watchdog: if Firebase Auth is slow over the network, render login view immediately
    const watchdogTimer = setTimeout(() => {
      setLoadingAuth(false);
    }, 300);

    const unsubscribe = subscribeToAuth((currentUser) => {
      clearTimeout(watchdogTimer);
      if (currentUser && !isMfuEmail(currentUser.email)) {
        logoutUser().catch((err) => console.error('Sign out failed:', err));
        setUser(null);
        try {
          localStorage.removeItem('campus_user_cache');
        } catch {
          // Ignore storage error
        }
        setLoadingAuth(false);
        return;
      }
      setUser(currentUser);
      if (currentUser) {
        try {
          localStorage.setItem('campus_user_cache', JSON.stringify({
            uid: currentUser.uid,
            email: currentUser.email,
            displayName: currentUser.displayName,
            photoURL: currentUser.photoURL
          }));
        } catch {
          // Ignore storage quota error
        }
      } else {
        try {
          localStorage.removeItem('campus_user_cache');
        } catch {
          // Ignore storage error
        }
      }
      if (currentUser && isAdminUser(currentUser.email)) {
        setActiveTab('admin');
      }
      setLoadingAuth(false);
    });

    return () => {
      clearTimeout(watchdogTimer);
      unsubscribe();
    };
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
          onLoginSuccess={(loggedUser) => {
            if (isAdminUser(loggedUser?.email)) {
              setActiveTab('admin');
            } else {
              setActiveTab('home');
            }
          }}
          theme={theme}
          onThemeToggle={() => setTheme((currentTheme) => currentTheme === 'dark' ? 'light' : 'dark')}
        />
      </div>
    );
  }

  // 2. MAIN DASHBOARD (Only visible after signing in)
  const isAdmin = isAdminUser(user?.email);

  // Admin users can only see admin-relevant sections: Admin Portal, AI Executive Briefing, Account & Settings
  const adminNavItems = [
    { id: 'admin', label: 'Admin Portal', icon: ShieldCheck },
    { id: 'insights', label: 'AI Executive Briefing', icon: Sparkles },
    { id: 'profile', label: 'Account & Settings', icon: User }
  ];

  const studentNavItems = [
    { id: 'home', label: 'Overview', icon: Home },
    { id: 'feed', label: 'Category Feed', icon: MessageSquare },
    { id: 'submit', label: 'Submit Feedback', icon: Plus },
    { id: 'evaluation', label: 'Evaluation', icon: ClipboardCheck },
    { id: 'insights', label: 'AI Insights', icon: Sparkles },
    { id: 'profile', label: 'Profile & Settings', icon: User }
  ];

  const navItems = isAdmin ? adminNavItems : studentNavItems;
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
              {isAdmin ? <ShieldCheck size={24} strokeWidth={2.2} /> : <GraduationCap size={24} strokeWidth={2.2} />}
            </div>
            <div>
              <h2 style={{ fontSize: '1.1rem', fontWeight: '800', margin: 0, color: '#0F172A', letterSpacing: '-0.02em' }}>Campus Insight</h2>
              <span style={{ fontSize: '0.75rem', color: '#8B0000', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {isAdmin ? 'Facility Admin' : 'Mae Fah Luang Univ.'}
              </span>
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
              <div style={{ fontSize: '0.85rem', fontWeight: '700', color: '#0F172A', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user.displayName || (isAdmin ? 'Campus Admin' : 'MFU Student')}
              </div>
              <div style={{ fontSize: '0.725rem', color: '#64748B' }}>
                {isAdmin ? 'Admin Settings' : 'View Profile'}
              </div>
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
        <Suspense fallback={<div className="dashboard-loading" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '3rem', color: '#64748B', gap: '0.5rem' }}><Loader2 size={22} className="dashboard-spinner" /> Loading...</div>}>
          {isAdmin ? (
            <>
              {activeTab === 'admin' && <AdminPortalPage user={user} onNavigate={setActiveTab} />}
              {activeTab === 'insights' && <InsightsPage />}
              {activeTab === 'profile' && <ProfilePage user={user} onNavigate={setActiveTab} />}
              {!['admin', 'insights', 'profile'].includes(activeTab) && (
                <AdminPortalPage user={user} onNavigate={setActiveTab} />
              )}
            </>
          ) : (
            <>
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
              {activeTab === 'profile' && <ProfilePage user={user} onNavigate={setActiveTab} />}
            </>
          )}
        </Suspense>
      </main>

    </div>
  );
}