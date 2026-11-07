import React, { useState, useEffect } from 'react';
import { Mail, ShieldCheck, LogOut, EyeOff, FileText, Calendar, Star } from 'lucide-react';
import { logoutUser, subscribeToFeedbacks } from '../services/firebaseDb';

export default function ProfilePage({ user }) {
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [userReviews, setUserReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showSignOutModal, setShowSignOutModal] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState('');

  const displayUser = user ? {
    displayName: user.displayName || "MFU Student",
    email: user.email || "",
    photoURL: user.photoURL
  } : {
    displayName: "Guest Student",
    email: "",
    photoURL: null
  };

  const isMfuEmail = displayUser.email?.endsWith('@lamduan.mfu.ac.th') || displayUser.email?.endsWith('@mfu.ac.th');

  const handleSignOut = async () => {
    setSigningOut(true);
    setSignOutError('');

    try {
      await logoutUser();
    } catch (error) {
      console.error('Sign-out failed:', error);
      setSignOutError('We could not sign you out. Please try again.');
      setSigningOut(false);
    }
  };

  // Load user's feedback history from Firestore real-time feed
  useEffect(() => {
    const unsubscribe = subscribeToFeedbacks((allReviews) => {
      if (!user) {
        setUserReviews([]);
        setLoading(false);
        return;
      }

      // Filter posts submitted by this user (by email match or displayName match)
      const myPosts = allReviews.filter(review => {
        const matchesEmail = review.userEmail && review.userEmail === user.email;
        const matchesName = review.author && (review.author === user.displayName || review.author === displayUser.displayName);
        return matchesEmail || matchesName;
      });

      setUserReviews(myPosts);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, displayUser.displayName]);

  return (
    <div style={{ maxWidth: '780px', margin: '0 auto' }}>
      
      {/* Page Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2.1rem', fontWeight: '800', margin: '0 0 0.4rem 0', color: '#0F172A', letterSpacing: '-0.02em' }}>
          User Profile & Settings
        </h1>
        <p style={{ color: '#475569', fontSize: '1rem', margin: 0, fontWeight: '500' }}>
          Manage your student identity, privacy preferences, and submission history.
        </p>
      </div>

      {/* Identity Profile Card */}
      <div style={{ background: '#FFFFFF', padding: '2rem', borderRadius: '16px', border: '1px solid #E2E8F0', boxShadow: '0 10px 30px -5px rgba(0,0,0,0.04)', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          {displayUser.photoURL ? (
            <img src={displayUser.photoURL} alt="Profile" style={{ width: '68px', height: '68px', borderRadius: '50%', border: '2px solid #8B0000' }} />
          ) : (
            <div style={{ width: '68px', height: '68px', borderRadius: '50%', background: 'linear-gradient(135deg, #8B0000 0%, #A71930 100%)', display: 'grid', placeItems: 'center', color: '#FFF', fontWeight: '800', fontSize: '1.5rem' }}>
              {displayUser.displayName?.charAt(0) || 'U'}
            </div>
          )}

          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <h2 style={{ fontSize: '1.3rem', fontWeight: '800', margin: 0, color: '#0F172A' }}>{displayUser.displayName}</h2>
              {isMfuEmail && (
                <span style={{ backgroundColor: '#DEF7EC', color: '#03543F', fontSize: '0.75rem', fontWeight: '700', padding: '0.2rem 0.5rem', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <ShieldCheck size={14} /> MFU Verified
                </span>
              )}
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#64748B', fontSize: '0.9rem', marginTop: '0.35rem' }}>
              <Mail size={15} />
              <span>{displayUser.email}</span>
            </div>
          </div>

          <button
            onClick={() => {
              setSignOutError('');
              setShowSignOutModal(true);
            }}
            style={{ padding: '0.6rem 1rem', background: '#FEE2E2', color: '#991B1B', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.875rem' }}
          >
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      </div>

      {/* Posting Privacy Preferences */}
      <div style={{ background: '#FFFFFF', padding: '1.75rem', borderRadius: '16px', border: '1px solid #E2E8F0', boxShadow: '0 4px 12px rgba(0,0,0,0.03)', marginBottom: '1.5rem' }}>
        <h3 style={{ fontSize: '1.05rem', fontWeight: '800', margin: '0 0 1.25rem 0', color: '#0F172A' }}>
          Posting Privacy
        </h3>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <EyeOff size={20} color="#64748B" />
            <div>
              <strong style={{ display: 'block', fontSize: '0.925rem', color: '#1E293B' }}>Default Anonymous Posting</strong>
              <span style={{ fontSize: '0.825rem', color: '#64748B' }}>Hide your name and student email when submitting new feedback</span>
            </div>
          </div>
          <input 
            type="checkbox" 
            checked={isAnonymous} 
            onChange={() => setIsAnonymous(!isAnonymous)}
            style={{ accentColor: '#8B0000', width: '20px', height: '20px', cursor: 'pointer' }} 
          />
        </div>
      </div>

      {/* My Feedback History List */}
      <div style={{ background: '#FFFFFF', padding: '1.75rem', borderRadius: '16px', border: '1px solid #E2E8F0', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <FileText size={20} color="#8B0000" />
            <h3 style={{ fontSize: '1.05rem', fontWeight: '800', margin: 0, color: '#0F172A' }}>
              My Feedback History
            </h3>
          </div>
          <span style={{ fontSize: '0.8rem', fontWeight: '700', background: '#F1F5F9', color: '#475569', padding: '0.2rem 0.6rem', borderRadius: '12px' }}>
            {userReviews.length} Submissions
          </span>
        </div>

        {loading ? (
          <p style={{ color: '#64748B', fontSize: '0.875rem' }}>Loading submission history...</p>
        ) : userReviews.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem 1rem', background: '#F8FAFC', borderRadius: '12px', border: '1px dashed #CBD5E1' }}>
            <p style={{ margin: 0, color: '#64748B', fontSize: '0.9rem', fontWeight: '600' }}>No feedback submissions found yet.</p>
            <span style={{ fontSize: '0.8rem', color: '#94A3B8' }}>Submissions posted under your account will appear here.</span>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {userReviews.map((review) => (
              <div key={review.id} style={{ padding: '1rem 1.25rem', background: '#F8FAFC', borderRadius: '12px', border: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: '800', background: '#8B0000', color: '#FFF', padding: '0.15rem 0.5rem', borderRadius: '4px' }}>
                      {review.category} {review.target ? `• ${review.target}` : ''}
                    </span>
                    {review.isAnonymous && (
                      <span style={{ fontSize: '0.7rem', fontWeight: '700', background: '#E2E8F0', color: '#475569', padding: '0.15rem 0.4rem', borderRadius: '4px' }}>
                        Posted Anonymously
                      </span>
                    )}
                    <span style={{ fontSize: '0.75rem', color: '#64748B', display: 'flex', alignItems: 'center', gap: '0.25rem', marginLeft: 'auto' }}>
                      <Calendar size={12} /> {review.createdAt}
                    </span>
                  </div>
                  <p style={{ margin: '0 0 0.4rem 0', fontSize: '0.9rem', color: '#1E293B', fontWeight: '500' }}>
                    "{review.comment}"
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showSignOutModal && (
        <div
          role="presentation"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
            background: 'rgba(15, 23, 42, 0.55)'
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="sign-out-title"
            aria-describedby="sign-out-description"
            style={{
              width: '100%',
              maxWidth: '440px',
              background: '#FFFFFF',
              borderRadius: '16px',
              padding: '1.75rem',
              boxShadow: '0 20px 45px rgba(15, 23, 42, 0.2)'
            }}
          >
            <h2 id="sign-out-title" style={{ margin: '0 0 0.65rem 0', color: '#0F172A', fontSize: '1.25rem', fontWeight: '800' }}>
              Sign out of Campus Insight?
            </h2>
            <p id="sign-out-description" style={{ margin: '0', color: '#475569', fontSize: '0.925rem', lineHeight: 1.6 }}>
              Are you sure you want to sign out? You will need to sign in again to access your account.
            </p>

            {signOutError && (
              <p role="alert" style={{ margin: '1rem 0 0 0', color: '#991B1B', background: '#FEE2E2', borderRadius: '8px', padding: '0.75rem', fontSize: '0.85rem', lineHeight: 1.4 }}>
                {signOutError}
              </p>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => {
                  setShowSignOutModal(false);
                  setSignOutError('');
                }}
                disabled={signingOut}
                style={{ padding: '0.65rem 1rem', background: '#FFFFFF', color: '#475569', border: '1px solid #CBD5E1', borderRadius: '8px', fontWeight: '700', cursor: signingOut ? 'not-allowed' : 'pointer', fontSize: '0.875rem' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSignOut}
                disabled={signingOut}
                style={{ padding: '0.65rem 1rem', background: signingOut ? '#94A3B8' : '#8B0000', color: '#FFFFFF', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: signingOut ? 'not-allowed' : 'pointer', fontSize: '0.875rem' }}
              >
                {signingOut ? 'Signing Out...' : 'Sign Out'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}