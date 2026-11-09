import { useState, useEffect } from 'react';
import { Mail, ShieldCheck, LogOut, EyeOff, FileText, Calendar, Trash2, Pencil, Loader2, FileImage } from 'lucide-react';
import {
  logoutUser,
  subscribeToFeedbacks,
  isMfuEmail,
  deleteFeedbackFromFirestore,
  updateFeedbackInFirestore
} from '../services/firebaseDb';

export default function ProfilePage({ user }) {
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [userReviews, setUserReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showSignOutModal, setShowSignOutModal] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState('');

  // Delete modal state
  const [reviewToDelete, setReviewToDelete] = useState(null);
  const [deletingReview, setDeletingReview] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  // Edit modal state
  const [reviewToEdit, setReviewToEdit] = useState(null);
  const [editComment, setEditComment] = useState('');
  const [editAnonymous, setEditAnonymous] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState('');

  const displayUser = user ? {
    displayName: user.displayName || "MFU Student",
    email: user.email || "",
    photoURL: user.photoURL
  } : {
    displayName: "Guest Student",
    email: "",
    photoURL: null
  };

  const isMfu = isMfuEmail(displayUser.email);

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

  const handleDeleteReview = async () => {
    if (!reviewToDelete) return;
    setDeletingReview(true);
    setDeleteError('');
    try {
      await deleteFeedbackFromFirestore(reviewToDelete.id);
      setReviewToDelete(null);
    } catch (err) {
      console.error('Failed to delete review:', err);
      setDeleteError('Could not delete this review. Please try again.');
    } finally {
      setDeletingReview(false);
    }
  };

  const handleStartEdit = (review) => {
    setReviewToEdit(review);
    setEditComment(review.comment || '');
    setEditAnonymous(!!review.isAnonymous);
    setEditError('');
  };

  const handleSaveEdit = async () => {
    if (!reviewToEdit) return;
    if (!editComment.trim()) {
      setEditError('Comment cannot be empty.');
      return;
    }
    setSavingEdit(true);
    setEditError('');
    try {
      const authorName = editAnonymous
        ? 'Anonymous MFU Student'
        : user?.displayName || user?.email || 'MFU Student';

      await updateFeedbackInFirestore(reviewToEdit.id, {
        comment: editComment.trim(),
        isAnonymous: editAnonymous,
        author: authorName
      });
      setReviewToEdit(null);
    } catch (err) {
      console.error('Failed to update review:', err);
      setEditError('Could not update review. Please try again.');
    } finally {
      setSavingEdit(false);
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
    <div className="profile-page" style={{ maxWidth: '780px', margin: '0 auto' }}>
      
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
      <div className="profile-card" style={{ background: '#FFFFFF', padding: '2rem', borderRadius: '16px', border: '1px solid #E2E8F0', boxShadow: '0 10px 30px -5px rgba(0,0,0,0.04)', marginBottom: '1.5rem' }}>
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
              {isMfu && (
                <span className="profile-verified-badge" style={{ backgroundColor: '#DEF7EC', color: '#03543F', fontSize: '0.75rem', fontWeight: '700', padding: '0.2rem 0.5rem', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
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
            className="profile-signout-button"
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
      <div className="profile-card" style={{ background: '#FFFFFF', padding: '1.75rem', borderRadius: '16px', border: '1px solid #E2E8F0', boxShadow: '0 4px 12px rgba(0,0,0,0.03)', marginBottom: '1.5rem' }}>
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
      <div className="profile-card" style={{ background: '#FFFFFF', padding: '1.75rem', borderRadius: '16px', border: '1px solid #E2E8F0', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <FileText size={20} color="#8B0000" />
            <h3 style={{ fontSize: '1.05rem', fontWeight: '800', margin: 0, color: '#0F172A' }}>
              My Feedback History
            </h3>
          </div>
          <span className="profile-submission-count" style={{ fontSize: '0.8rem', fontWeight: '700', background: '#F1F5F9', color: '#475569', padding: '0.2rem 0.6rem', borderRadius: '12px' }}>
            {userReviews.length} Submissions
          </span>
        </div>

        {loading ? (
          <p style={{ color: '#64748B', fontSize: '0.875rem' }}>Loading submission history...</p>
        ) : userReviews.length === 0 ? (
          <div className="profile-empty-state" style={{ textAlign: 'center', padding: '2rem 1rem', background: '#F8FAFC', borderRadius: '12px', border: '1px dashed #CBD5E1' }}>
            <p style={{ margin: 0, color: '#64748B', fontSize: '0.9rem', fontWeight: '600' }}>No feedback submissions found yet.</p>
            <span style={{ fontSize: '0.8rem', color: '#94A3B8' }}>Submissions posted under your account will appear here.</span>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {userReviews.map((review) => (
              <div
                className="profile-review-item"
                key={review.id}
                style={{
                  padding: '1.1rem 1.25rem',
                  background: '#F8FAFC',
                  borderRadius: '12px',
                  border: '1px solid #E2E8F0',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  gap: '1rem',
                  flexWrap: 'wrap'
                }}
              >
                <div style={{ flex: '1 1 300px', minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.45rem', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: '800', background: '#8B0000', color: '#FFF', padding: '0.15rem 0.5rem', borderRadius: '4px' }}>
                      {review.category} {review.target ? `• ${review.target}` : ''}
                    </span>
                    {review.isAnonymous && (
                      <span className="profile-anonymous-badge" style={{ fontSize: '0.7rem', fontWeight: '700', background: '#E2E8F0', color: '#475569', padding: '0.15rem 0.4rem', borderRadius: '4px' }}>
                        Posted Anonymously
                      </span>
                    )}
                    <span style={{ fontSize: '0.75rem', color: '#64748B', display: 'flex', alignItems: 'center', gap: '0.25rem', marginLeft: 'auto' }}>
                      <Calendar size={12} /> {review.createdAt}
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.9rem', color: '#1E293B', fontWeight: '500', lineHeight: 1.5 }}>
                    "{review.comment}"
                  </p>
                  {review.imageUrl && (
                    <div style={{ marginTop: '0.6rem' }}>
                      <a
                        href={review.imageUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          padding: '0.25rem 0.55rem',
                          borderRadius: '6px',
                          background: '#EFF6FF',
                          color: '#1D4ED8',
                          fontSize: '0.75rem',
                          fontWeight: '700',
                          textDecoration: 'none',
                          border: '1px solid #BFDBFE'
                        }}
                      >
                        <FileImage size={13} /> View Attached Evidence Photo
                      </a>
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexShrink: 0, marginTop: '0.15rem' }}>
                  <button
                    type="button"
                    className="profile-edit-btn"
                    onClick={() => handleStartEdit(review)}
                    title="Edit feedback comment"
                    aria-label="Edit feedback comment"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      padding: '0.45rem 0.75rem',
                      background: '#F1F5F9',
                      color: '#334155',
                      border: '1px solid #CBD5E1',
                      borderRadius: '8px',
                      fontSize: '0.8rem',
                      fontWeight: '700',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <Pencil size={13} /> Edit
                  </button>
                  <button
                    type="button"
                    className="profile-delete-btn"
                    onClick={() => {
                      setDeleteError('');
                      setReviewToDelete(review);
                    }}
                    title="Delete feedback review"
                    aria-label="Delete feedback review"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      padding: '0.45rem 0.75rem',
                      background: '#FEE2E2',
                      color: '#991B1B',
                      border: '1px solid #FECACA',
                      borderRadius: '8px',
                      fontSize: '0.8rem',
                      fontWeight: '700',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <Trash2 size={13} /> Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Review Confirmation Modal */}
      {reviewToDelete && (
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
            aria-labelledby="delete-review-title"
            aria-describedby="delete-review-description"
            style={{
              width: '100%',
              maxWidth: '440px',
              background: '#FFFFFF',
              borderRadius: '16px',
              padding: '1.75rem',
              boxShadow: '0 20px 45px rgba(15, 23, 42, 0.2)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.75rem' }}>
              <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: '#FEE2E2', display: 'grid', placeItems: 'center', color: '#991B1B' }}>
                <Trash2 size={19} />
              </div>
              <h2 id="delete-review-title" style={{ margin: 0, color: '#0F172A', fontSize: '1.25rem', fontWeight: '800' }}>
                Delete Feedback?
              </h2>
            </div>

            <p id="delete-review-description" style={{ margin: 0, color: '#475569', fontSize: '0.925rem', lineHeight: 1.6 }}>
              Are you sure you want to delete your feedback for <strong>{reviewToDelete.category} {reviewToDelete.target ? `• ${reviewToDelete.target}` : ''}</strong>? This action cannot be undone and will remove it from the public campus feed.
            </p>

            {deleteError && (
              <p role="alert" style={{ margin: '1rem 0 0', color: '#991B1B', background: '#FEE2E2', borderRadius: '8px', padding: '0.75rem', fontSize: '0.85rem' }}>
                {deleteError}
              </p>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => {
                  setReviewToDelete(null);
                  setDeleteError('');
                }}
                disabled={deletingReview}
                style={{ padding: '0.65rem 1rem', background: '#FFFFFF', color: '#475569', border: '1px solid #CBD5E1', borderRadius: '8px', fontWeight: '700', cursor: deletingReview ? 'not-allowed' : 'pointer', fontSize: '0.875rem' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteReview}
                disabled={deletingReview}
                style={{ padding: '0.65rem 1.1rem', background: deletingReview ? '#94A3B8' : '#991B1B', color: '#FFFFFF', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: deletingReview ? 'not-allowed' : 'pointer', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
              >
                {deletingReview ? (
                  <>
                    <Loader2 size={15} className="is-spinning" /> Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 size={15} /> Delete Review
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Review Modal */}
      {reviewToEdit && (
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
            aria-labelledby="edit-review-title"
            style={{
              width: '100%',
              maxWidth: '520px',
              background: '#FFFFFF',
              borderRadius: '16px',
              padding: '1.75rem',
              boxShadow: '0 20px 45px rgba(15, 23, 42, 0.2)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.65rem' }}>
              <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: '#FEF3C7', display: 'grid', placeItems: 'center', color: '#B45309' }}>
                <Pencil size={19} />
              </div>
              <div>
                <h2 id="edit-review-title" style={{ margin: 0, color: '#0F172A', fontSize: '1.25rem', fontWeight: '800' }}>
                  Edit Feedback
                </h2>
                <span style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: '600' }}>
                  {reviewToEdit.category} {reviewToEdit.target ? `• ${reviewToEdit.target}` : ''}
                </span>
              </div>
            </div>

            <div style={{ marginTop: '1.1rem' }}>
              <label htmlFor="edit-review-comment" style={{ display: 'block', fontSize: '0.875rem', fontWeight: '700', color: '#1E293B', marginBottom: '0.4rem' }}>
                Your Feedback Comment
              </label>
              <textarea
                id="edit-review-comment"
                rows={4}
                maxLength={2000}
                value={editComment}
                onChange={(e) => setEditComment(e.target.value)}
                placeholder="Update your feedback details..."
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '10px',
                  border: '1px solid #CBD5E1',
                  fontSize: '0.9rem',
                  fontFamily: 'inherit',
                  resize: 'vertical',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', fontSize: '0.75rem', color: '#94A3B8', marginTop: '0.25rem' }}>
                {editComment.length} / 2000
              </div>
            </div>

            <div style={{ marginTop: '0.75rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.85rem', color: '#334155' }}>
                <input
                  type="checkbox"
                  checked={editAnonymous}
                  onChange={(e) => setEditAnonymous(e.target.checked)}
                  style={{ accentColor: '#8B0000', width: '17px', height: '17px', cursor: 'pointer' }}
                />
                <span>Post feedback anonymously (hide my name on Category Feed)</span>
              </label>
            </div>

            {editError && (
              <p role="alert" style={{ margin: '1rem 0 0', color: '#991B1B', background: '#FEE2E2', borderRadius: '8px', padding: '0.75rem', fontSize: '0.85rem' }}>
                {editError}
              </p>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => {
                  setReviewToEdit(null);
                  setEditError('');
                }}
                disabled={savingEdit}
                style={{ padding: '0.65rem 1rem', background: '#FFFFFF', color: '#475569', border: '1px solid #CBD5E1', borderRadius: '8px', fontWeight: '700', cursor: savingEdit ? 'not-allowed' : 'pointer', fontSize: '0.875rem' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                disabled={savingEdit}
                style={{ padding: '0.65rem 1.1rem', background: savingEdit ? '#94A3B8' : '#8B0000', color: '#FFFFFF', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: savingEdit ? 'not-allowed' : 'pointer', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
              >
                {savingEdit ? (
                  <>
                    <Loader2 size={15} className="is-spinning" /> Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

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