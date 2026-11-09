import { useState } from 'react';
import {
  ArrowRight,
  Eye,
  EyeOff,
  GraduationCap,
  KeyRound,
  Loader2,
  Lock,
  Mail,
  Moon,
  ShieldCheck,
  Sun
} from 'lucide-react';
import {
  loginWithGoogle,
  loginWithAdminCredentials,
  logoutUser,
  isMfuEmail
} from '../services/firebaseDb';
import './styles/LoginPage.css';

function CampusIllustration() {
  return (
    <svg className="login-campus-art" viewBox="0 0 620 230" role="img" aria-label="Illustration of a university campus">
      <path className="campus-mountain" d="M66 89 113 55l35 13 40-31 34 27 33-10 38 25 26-15 41 22 26-26 37 19 32-32 31 30 39-12 44 31v51H66z" />
      <path className="campus-ground" d="M18 168 106 151h407l78 20-84 25H102z" />
      <path className="campus-walkway" d="m244 131 132 0 102 73H141z" />
      <path className="campus-walkway-line" d="m309 137-3 25m-8 9-4 23m27-57 11 25m-1 8 21 24" />

      <g className="campus-building">
        <path d="m40 116 96-48 103 20v69l-98 17-101-17z" />
        <path className="campus-roof" d="m34 111 99-55 114 23-10 19-101-20-94 48z" />
        <path className="campus-window" d="m54 117 75-39v65l-75 15z" />
        <path className="campus-window" d="m140 80 80 17v60l-80 13z" />
        <path className="campus-line" d="m64 119 0 35m17-44 0 40m17-49 0 45m17-54 0 50m33-45v61m19-57v54m19-50v47m19-43v39" />
        <path className="campus-line" d="m45 164 94 18 105-18" />
      </g>

      <g className="campus-building">
        <path d="m389 88 104-20 92 48v71l-102 17-94-18z" />
        <path className="campus-roof" d="m379 79 113-23 100 55-12 15-91-48-100 21z" />
        <path className="campus-window" d="m397 97 82-16v76l-82-13z" />
        <path className="campus-window" d="m489 80 76 39v50l-76-12z" />
        <path className="campus-line" d="m409 98v44m18-47v50m18-53v56m18-59v62m37-68v76m19-67v70m18-61v64m17-55v58" />
        <path className="campus-line" d="m390 166 94 18 100-17" />
      </g>

      <g className="campus-building campus-center">
        <path d="m241 113 69-26 70 26v43H241z" />
        <path className="campus-roof" d="m231 111 79-32 80 32v9H231z" />
        <path className="campus-window" d="M264 119h93v37h-93z" />
        <path className="campus-line" d="M278 120v35m19-35v35m19-35v35m19-35v35m19-35v35" />
      </g>

      <g className="campus-tree">
        <path d="M47 164v30m18-31v31m481-30v29m17-33v33" />
        <circle cx="54" cy="147" r="20" />
        <circle cx="37" cy="155" r="13" />
        <circle cx="68" cy="159" r="13" />
        <circle cx="540" cy="146" r="20" />
        <circle cx="523" cy="156" r="13" />
        <circle cx="555" cy="157" r="13" />
        <circle cx="223" cy="145" r="17" />
        <circle cx="208" cy="153" r="11" />
        <circle cx="238" cy="154" r="11" />
        <path d="M223 158v28" />
      </g>
    </svg>
  );
}

export default function LoginPage({ onLoginSuccess, theme, onThemeToggle }) {
  const [loginMode, setLoginMode] = useState('student'); // 'student' | 'admin'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Admin form state
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      const loggedUser = await loginWithGoogle();
      if (!isMfuEmail(loggedUser?.email)) {
        await logoutUser();
        setError(`Access restricted: Please sign in with your official MFU email address (@lamduan.mfu.ac.th or @mfu.ac.th). The account "${loggedUser?.email || 'selected'}" is not authorized.`);
        return;
      }
      if (onLoginSuccess) onLoginSuccess(loggedUser);
    } catch (loginError) {
      if (loginError?.code === 'auth/popup-closed-by-user') {
        return;
      }
      console.error('Login failed:', loginError);
      setError('We could not sign you in. Please try again with your university Google account.');
    } finally {
      setLoading(false);
    }
  };

  const handleAdminLogin = async (e) => {
    e?.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (!adminEmail.trim()) {
        setError('Please enter your administrator email.');
        setLoading(false);
        return;
      }
      if (!adminPassword.trim()) {
        setError('Please enter your administrator password.');
        setLoading(false);
        return;
      }

      const adminUser = await loginWithAdminCredentials(adminEmail, adminPassword);
      if (onLoginSuccess) onLoginSuccess(adminUser);
    } catch (adminError) {
      console.error('Admin authentication failed:', adminError);
      setError(adminError?.message || 'Invalid administrator email or password.');
    } finally {
      setLoading(false);
    }
  };

  const handleFillDemoAdmin = () => {
    setAdminEmail('campusadmin@mfu.ac.th');
    setAdminPassword('campus67');
    setError('');
  };

  return (
    <div className="login-page">
      <header className="login-topbar">
        <div className="login-brand">
          <span className="login-brand-mark"><GraduationCap size={24} strokeWidth={2} /></span>
          <span className="login-brand-copy">
            <strong>Campus Insight</strong>
            <small>Mae Fah Luang University</small>
          </span>
        </div>
        <div className="login-topbar-actions">
          <span className="login-community-badge">
            <GraduationCap size={14} />
            For the MFU community
          </span>
          <button
            type="button"
            className="theme-toggle-button"
            onClick={onThemeToggle}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>
      </header>

      <main className="login-content">
        <section className="login-welcome-panel">
          <div className="login-welcome-kicker"><span /> Campus Insight</div>
          <h1>Your campus.<br />Your feedback.</h1>
          <p>Share your experience and help improve campus life.</p>
          <div className="login-campus-art-wrap">
            <CampusIllustration />
          </div>
          <div className="login-panel-footer">
            <span>Feedback</span>
            <span>/</span>
            <span>Campus ratings</span>
          </div>
        </section>

        <section className="login-signin-panel">
          {/* Mode Switcher Tabs */}
          <div className="login-mode-switcher" role="tablist" aria-label="Sign-in role selection">
            <button
              type="button"
              role="tab"
              aria-selected={loginMode === 'student'}
              className={`login-mode-btn ${loginMode === 'student' ? 'is-active' : ''}`}
              onClick={() => {
                setLoginMode('student');
                setError('');
              }}
            >
              <GraduationCap size={16} />
              <span>Student Portal</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={loginMode === 'admin'}
              className={`login-mode-btn ${loginMode === 'admin' ? 'is-active' : ''}`}
              onClick={() => {
                setLoginMode('admin');
                setError('');
              }}
            >
              <ShieldCheck size={16} />
              <span>Campus Admin</span>
            </button>
          </div>

          {loginMode === 'student' ? (
            <>
              <div className="login-signin-copy">
                <span className="login-signin-eyebrow">Student Access</span>
                <h2>Sign in to Campus Insight</h2>
                <p>Use your university Google account to review facilities and evaluate lecturers.</p>
              </div>

              <div className="login-university-note">
                <div className="login-note-heading">
                  <ShieldCheck size={16} />
                  <strong>For Mae Fah Luang University students</strong>
                </div>
                <div className="login-email-domains">
                  <strong>@lamduan.mfu.ac.th</strong>
                  <span>or</span>
                  <strong>@mfu.ac.th</strong>
                </div>
              </div>

              {error && <p className="login-error" role="alert">{error}</p>}

              <button className="login-google-button" onClick={handleGoogleLogin} disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="login-spinner" size={18} />
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign in with Lamduan Email
                    <ArrowRight size={17} />
                  </>
                )}
              </button>
            </>
          ) : (
            <form className="login-admin-form" onSubmit={handleAdminLogin}>
              <div className="login-signin-copy">
                <span className="login-signin-eyebrow">Facility &amp; Moderation</span>
                <h2>Administrator Sign-in</h2>
                <p>Sign in with your campus administrative credentials to manage feedback and facility actions.</p>
              </div>

              {error && <p className="login-error" role="alert">{error}</p>}

              <div className="login-input-group">
                <label htmlFor="admin-email">Administrator Email</label>
                <div className="login-input-wrap">
                  <Mail size={16} className="login-input-icon" />
                  <input
                    id="admin-email"
                    type="email"
                    required
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    placeholder="Enter admin email"
                    autoComplete="username"
                    className="login-input"
                  />
                </div>
              </div>

              <div className="login-input-group">
                <label htmlFor="admin-password">Password</label>
                <div className="login-input-wrap">
                  <Lock size={16} className="login-input-icon" />
                  <input
                    id="admin-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    placeholder="Enter admin password"
                    autoComplete="current-password"
                    className="login-input"
                  />
                  <button
                    type="button"
                    className="login-toggle-pw"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              

              <button
                type="submit"
                className="login-admin-submit-btn"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="login-spinner" size={18} />
                    Authenticating...
                  </>
                ) : (
                  <>
                    <span>Sign in as Administrator</span>
                    <ArrowRight size={17} />
                  </>
                )}
              </button>
            </form>
          )}
        </section>
      </main>
      <div className="login-bottom-space" aria-hidden="true" />
    </div>
  );
}
