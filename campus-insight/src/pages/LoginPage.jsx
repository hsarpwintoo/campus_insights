import React, { useState } from 'react';
import { GraduationCap, ShieldCheck, ArrowRight, Loader2 } from 'lucide-react';
import { loginWithGoogle } from '../services/firebaseDb';

export default function LoginPage({ onLoginSuccess }) {
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const loggedUser = await loginWithGoogle();
      if (onLoginSuccess) onLoginSuccess(loggedUser);
    } catch (error) {
      console.error("Login failed:", error);
      alert("Failed to sign in with Google.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '2rem 1rem' }}>
      <div style={{ width: '100%', maxWidth: '480px', textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.55rem', marginBottom: '1.25rem', color: '#8B0000' }}>
          <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: 'linear-gradient(135deg, #8B0000 0%, #A71930 100%)', display: 'grid', placeItems: 'center', color: '#FFFFFF', boxShadow: '0 5px 12px rgba(139, 0, 0, 0.2)' }}>
            <GraduationCap size={19} strokeWidth={2.2} />
          </div>
          <span style={{ fontSize: '0.85rem', fontWeight: '800', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Campus Insight
          </span>
        </div>

        <div style={{ background: '#FFFFFF', padding: 'clamp(1.5rem, 5vw, 2.75rem)', borderRadius: '20px', border: '1px solid #E2E8F0', boxShadow: '0 20px 40px -15px rgba(0,0,0,0.08)', width: '100%', textAlign: 'center' }}>

          <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: 'linear-gradient(135deg, #8B0000 0%, #A71930 100%)', display: 'grid', placeItems: 'center', color: '#FFFFFF', margin: '0 auto 1.5rem auto', boxShadow: '0 8px 20px rgba(139, 0, 0, 0.25)' }}>
            <GraduationCap size={36} strokeWidth={2} />
          </div>

          <h1 style={{ fontSize: 'clamp(1.7rem, 5vw, 2rem)', lineHeight: 1.2, fontWeight: '800', margin: '0 0 0.75rem 0', color: '#0F172A', letterSpacing: '-0.03em' }}>
            Your campus. Your feedback.
            <span style={{ display: 'block', color: '#8B0000' }}>Better experiences.</span>
          </h1>
          <p style={{ color: '#475569', fontSize: '0.95rem', margin: '0 auto 0.55rem auto', lineHeight: 1.6, maxWidth: '360px' }}>
            Mae Fah Luang University student portal for feedback, campus ratings, and insights.
          </p>
          <p style={{ color: '#8B0000', fontSize: '0.8rem', margin: '0 0 2rem 0', lineHeight: 1.5, fontWeight: '700' }}>
            For Mae Fah Luang University students
          </p>

          <div style={{ background: '#F8FAFC', padding: '0.85rem 1rem', borderRadius: '10px', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.75rem', textAlign: 'left' }}>
            <ShieldCheck size={20} color="#059669" style={{ flexShrink: 0 }} />
            <span style={{ fontSize: '0.825rem', color: '#334155', fontWeight: '600', lineHeight: 1.45 }}>
              Use your <strong>@lamduan.mfu.ac.th</strong> or <strong>@mfu.ac.th</strong> email to sign in.
            </span>
          </div>

          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            style={{
              width: '100%',
              padding: '0.9rem',
              background: loading ? '#94A3B8' : '#8B0000',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '12px',
              fontWeight: '700',
              fontSize: '0.975rem',
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.6rem',
              boxShadow: '0 6px 18px rgba(139, 0, 0, 0.25)'
            }}
          >
            {loading ? (
              <>
                <Loader2 size={20} />
                Signing in...
              </>
            ) : (
              <>
                Sign in with Google
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </div>

        <p style={{ color: '#64748B', fontSize: '0.75rem', margin: '1.25rem 0 0 0' }}>
          Connect with your campus community and help shape better experiences.
        </p>
      </div>
    </div>
  );
}