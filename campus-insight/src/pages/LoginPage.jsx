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
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '70vh', padding: '1rem' }}>
      <div style={{ background: '#FFFFFF', padding: '2.5rem', borderRadius: '20px', border: '1px solid #E2E8F0', boxShadow: '0 20px 40px -15px rgba(0,0,0,0.05)', maxWidth: '440px', width: '100%', textAlign: 'center' }}>
        
        <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: 'linear-gradient(135deg, #8B0000 0%, #A71930 100%)', display: 'grid', placeItems: 'center', color: '#FFFFFF', margin: '0 auto 1.5rem auto', boxShadow: '0 8px 20px rgba(139, 0, 0, 0.25)' }}>
          <GraduationCap size={36} strokeWidth={2} />
        </div>

        <h1 style={{ fontSize: '1.75rem', fontWeight: '800', margin: '0 0 0.5rem 0', color: '#0F172A' }}>
          Welcome to Campus Insight
        </h1>
        <p style={{ color: '#475569', fontSize: '0.925rem', margin: '0 0 2rem 0', lineHeight: 1.5 }}>
          Mae Fah Luang University student portal for feedback, campus ratings, and analytics.
        </p>

        <div style={{ background: '#F8FAFC', padding: '0.85rem 1rem', borderRadius: '10px', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.75rem', textAlign: 'left' }}>
          <ShieldCheck size={20} color="#059669" style={{ flexShrink: 0 }} />
          <span style={{ fontSize: '0.825rem', color: '#334155', fontWeight: '600' }}>
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
              Sign In with Google
              <ArrowRight size={16} />
            </>
          )}
        </button>
      </div>
    </div>
  );
}