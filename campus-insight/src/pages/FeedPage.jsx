import { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  Building2,
  Bus,
  Camera,
  CheckCircle2,
  ChevronRight,
  Flag,
  HeartPulse,
  Layers3,
  Loader2,
  MapPin,
  MessageSquare,
  Plus,
  Search,
  ShieldAlert,
  Star,
  ThumbsUp,
  Utensils,
  X
} from 'lucide-react';
import {
  reportFeedback,
  subscribeToFeedbacks,
  toggleHelpfulFeedback
} from '../services/firebaseDb';
import SubLocationModal from '../components/SubLocationModal';
import './styles/FeedPage.css';

const CATEGORIES = [
  { id: 'all', label: 'All Reviews', icon: Layers3 },
  { id: 'Dormitories', label: 'Dormitories', icon: Building2 },
  { id: 'Canteen', label: 'Canteens', icon: Utensils },
  { id: 'Services', label: 'Services & Wifi', icon: Bus },
  { id: 'Health Services', label: 'Health Services', icon: HeartPulse }
];

const REPORT_REASONS = [
  'Inappropriate / Offensive Language',
  'Harassment or Bullying',
  'Spam or Commercial Promotion',
  'False or Misleading Information',
  'Other Policy Violation'
];

const RATING_LABELS = {
  Dormitories: {
    facility: 'Facility quality',
    security: 'Security & access',
    electric: 'Electricity & utilities',
    cleanliness: 'Cleanliness & hygiene',
    water: 'Water pressure & supply'
  },
  Canteen: {
    clean: 'Hygiene & cleanliness',
    variety: 'Food variety',
    religious: 'Halal & dietary suitability',
    healthy: 'Healthy & balanced options',
    delicious: 'Taste & preparation'
  },
  Services: {
    service: 'Staff service standard',
    speed: 'Speed & timeliness',
    facility: 'Infrastructure & equipment'
  },
  'Health Services': {
    clean: 'Facility cleanliness',
    insurance: 'Insurance & coverage',
    service: 'Medical staff service',
    facility: 'Equipment & readiness',
    fees: 'Fee transparency'
  }
};

const getRating = (ratings) => {
  if (!ratings || typeof ratings !== 'object') return null;

  const values = Object.values(ratings)
    .map(Number)
    .filter((score) => Number.isFinite(score) && score >= 1 && score <= 5);
  return values.length
    ? values.reduce((total, score) => total + score, 0) / values.length
    : null;
};

const getInitials = (name = '') => name
  .trim()
  .split(/\s+/)
  .slice(0, 2)
  .map((part) => part[0])
  .join('')
  .toUpperCase() || 'S';

const getRelativeTime = (timestamp) => {
  if (!timestamp) return 'Date unavailable';

  const elapsedSeconds = Math.floor((Date.now() - timestamp) / 1000);
  if (!Number.isFinite(elapsedSeconds)) return 'Date unavailable';
  if (elapsedSeconds < 60) return 'Just now';
  if (elapsedSeconds < 3600) return `${Math.floor(elapsedSeconds / 60)} min ago`;
  if (elapsedSeconds < 86400) return `${Math.floor(elapsedSeconds / 3600)} hr ago`;
  if (elapsedSeconds < 604800) return `${Math.floor(elapsedSeconds / 86400)} days ago`;
  return new Date(timestamp).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

export default function FeedPage({ onNavigate, user }) {
  const [feed, setFeed] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [lightboxImage, setLightboxImage] = useState(null);
  const [selectedSubLocation, setSelectedSubLocation] = useState(null);

  // Moderation and Engagement states
  const [reportingReview, setReportingReview] = useState(null);
  const [reportReason, setReportReason] = useState(REPORT_REASONS[0]);
  const [reportDetails, setReportDetails] = useState('');
  const [submittingReport, setSubmittingReport] = useState(false);
  const [reportSuccess, setReportSuccess] = useState(false);
  const [reportError, setReportError] = useState('');
  const [revealedFlagged, setRevealedFlagged] = useState(() => new Set());
  const [votingIds, setVotingIds] = useState(() => new Set());

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        if (selectedSubLocation) setSelectedSubLocation(null);
        if (lightboxImage) setLightboxImage(null);
        if (reportingReview && !submittingReport) setReportingReview(null);
      }
    };
    if (lightboxImage || reportingReview || selectedSubLocation) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxImage, reportingReview, submittingReport, selectedSubLocation]);

  useEffect(() => {
    const unsubscribe = subscribeToFeedbacks(
      (updatedFeed) => {
        setFeed(updatedFeed);
        setError('');
        setLoading(false);
      },
      (loadError) => {
        console.error('Unable to load feedback feed:', loadError);
        setError('We could not load reviews right now. Please try again later.');
        setLoading(false);
      }
    );

    return unsubscribe;
  }, []);

  const handleToggleHelpful = async (reviewId) => {
    if (!user?.email) {
      alert('Please log in with your MFU student account to vote.');
      return;
    }
    if (votingIds.has(reviewId)) return;

    setVotingIds((prev) => new Set(prev).add(reviewId));
    try {
      await toggleHelpfulFeedback(reviewId, user.email);
    } catch (err) {
      console.error('Error toggling helpful vote:', err);
    } finally {
      setVotingIds((prev) => {
        const next = new Set(prev);
        next.delete(reviewId);
        return next;
      });
    }
  };

  const handleOpenReport = (review) => {
    setReportingReview(review);
    setReportReason(REPORT_REASONS[0]);
    setReportDetails('');
    setReportError('');
    setReportSuccess(false);
  };

  const handleCloseReport = () => {
    if (submittingReport) return;
    setReportingReview(null);
    setReportError('');
    setReportSuccess(false);
  };

  const handleSubmitReport = async (e) => {
    e.preventDefault();
    if (!reportingReview) return;
    setSubmittingReport(true);
    setReportError('');

    try {
      await reportFeedback(
        reportingReview.id,
        user?.email || 'anonymous',
        reportReason,
        reportDetails
      );
      setReportSuccess(true);
      setTimeout(() => {
        setReportingReview(null);
        setReportSuccess(false);
      }, 1600);
    } catch (err) {
      console.error('Error submitting feedback report:', err);
      setReportError('Unable to submit your report right now. Please try again.');
    } finally {
      setSubmittingReport(false);
    }
  };

  const filteredFeed = useMemo(() => {
    const searchTerm = search.trim().toLocaleLowerCase();
    return feed.filter((item) => {
      if (selectedCategory !== 'all' && item.category !== selectedCategory) return false;
      if (!searchTerm) return true;

      const searchableText = [
        item.category,
        item.target,
        item.comment,
        item.isAnonymous ? 'anonymous student' : item.author,
        ...Object.keys(item.ratings || {})
      ].filter(Boolean).join(' ').toLocaleLowerCase();
      return searchableText.includes(searchTerm);
    });
  }, [feed, search, selectedCategory]);

  if (loading) {
    return (
      <div className="feed-loading" role="status">
        <Loader2 className="feed-spinner" size={20} />
        Loading campus reviews...
      </div>
    );
  }

  return (
    <div className="feedback-feed">
      <header className="feed-header">
        <div>
          <h1>Category Feedback Feed</h1>
          <p>Live student evaluations and comments from Mae Fah Luang University.</p>
        </div>
        <button className="feed-submit-button" onClick={() => onNavigate?.('submit')}>
          <Plus size={16} />
          Submit Feedback
        </button>
      </header>

      <label className="feed-search">
        <Search size={18} aria-hidden="true" />
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search category, location, or comment..."
          aria-label="Search reviews"
        />
      </label>

      <nav className="feed-category-tabs" aria-label="Filter reviews by category">
        {CATEGORIES.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            className={`feed-category-tab${selectedCategory === id ? ' is-selected' : ''}`}
            onClick={() => setSelectedCategory(id)}
            aria-pressed={selectedCategory === id}
          >
            <Icon size={15} />
            {label}
          </button>
        ))}
      </nav>

      <div className="feed-section-heading">
        <h2>{selectedCategory === 'all' ? 'Recent reviews' : `${CATEGORIES.find((category) => category.id === selectedCategory)?.label} reviews`}</h2>
        <span><span className="feed-live-dot" /> Live from your campus</span>
      </div>

      {error ? (
        <div className="feed-empty-state" role="alert">
          <AlertCircle size={23} />
          <p>{error}</p>
        </div>
      ) : filteredFeed.length === 0 ? (
        <div className="feed-empty-state">
          <MessageSquare size={25} />
          <p>{feed.length === 0 ? 'No feedback has been submitted yet.' : 'No reviews match your search.'}</p>
          {feed.length === 0 && (
            <button onClick={() => onNavigate?.('submit')}>Be the first to submit feedback</button>
          )}
        </div>
      ) : (
        <div className="feed-review-list">
          {filteredFeed.map((item) => {
            const category = CATEGORIES.find((entry) => entry.id === item.category);
            const Icon = category?.icon || Building2;
            const rating = getRating(item.ratings);
            const author = item.isAnonymous ? 'Anonymous student' : item.author || 'MFU Student';
            const hasVotedHelpful = Boolean(user?.email && item.helpfulUsers?.includes(user.email));
            const hasReported = Boolean(user?.email && item.reportedUsers?.includes(user.email));
            const isFlagged = Boolean((Number(item.reportCount) >= 3) || item.isFlagged);
            const isRevealed = revealedFlagged.has(item.id);

            return (
              <article className="feed-review-card" key={item.id}>
                <div className="feed-review-topline">
                  <div className="feed-author">
                    <span className="feed-author-avatar" aria-hidden="true">{getInitials(author)}</span>
                    <strong>{author}</strong>
                    <span className="feed-review-time">{getRelativeTime(item.createdAtMillis)}</span>
                  </div>
                  <span className={`feed-rating${rating === null ? ' feed-rating-unavailable' : ''}`} aria-label={rating === null ? 'Rating unavailable' : `Average rating ${rating.toFixed(1)} out of 5`}>
                    <Star size={13} fill="currentColor" />
                    {rating === null ? 'No rating' : rating.toFixed(1)}
                  </span>
                </div>

                <div className="feed-review-details">
                  <span className="feed-review-category">
                    <Icon size={13} />
                    {category?.label || item.category || 'Campus'}
                  </span>
                  {item.target ? (
                    <button
                      type="button"
                      className="feed-review-location-btn"
                      onClick={() => setSelectedSubLocation({
                        location: item.target,
                        category: item.category
                      })}
                      title={`Click to view ${item.target} radar chart & criteria scores`}
                    >
                      <MapPin size={12} className="feed-location-pin" />
                      <span>{item.target}</span>
                      <ChevronRight size={11} className="feed-location-chevron" />
                    </button>
                  ) : (
                    <strong className="feed-review-location">Campus location not specified</strong>
                  )}
                </div>

                {isFlagged && !isRevealed ? (
                  <div className="feed-flagged-shield">
                    <div className="feed-flagged-header">
                      <ShieldAlert size={16} className="feed-flagged-icon" />
                      <strong>Flagged by student community</strong>
                    </div>
                    <p className="feed-flagged-text">
                      This review has received {item.reportCount || 3}+ reports for potentially violating community guidelines.
                    </p>
                    <button
                      type="button"
                      className="feed-flagged-reveal-btn"
                      onClick={() => setRevealedFlagged((prev) => new Set(prev).add(item.id))}
                    >
                      Show comment anyway
                    </button>
                  </div>
                ) : (
                  <>
                    {isFlagged && isRevealed && (
                      <div className="feed-flagged-badge">
                        <ShieldAlert size={12} />
                        <span>Flagged review revealed ({item.reportCount || 3} reports)</span>
                      </div>
                    )}

                    {item.comment?.trim() ? (
                      <p className="feed-review-comment">{item.comment.trim()}</p>
                    ) : (
                      <p className="feed-review-comment feed-missing-comment">No written comment provided.</p>
                    )}

                    {item.imageUrl && (
                      <div className="feed-review-photo-container">
                        <button
                          type="button"
                          className="feed-review-photo-btn"
                          onClick={() => setLightboxImage({ url: item.imageUrl, title: `${item.category} • ${item.target}` })}
                          title="Click to zoom photo evidence"
                        >
                          <img src={item.imageUrl} alt={`Photo evidence for ${item.target}`} className="feed-review-photo-thumb" loading="lazy" />
                          <span className="feed-review-photo-badge">
                            <Camera size={12} /> Photo Evidence
                          </span>
                        </button>
                      </div>
                    )}
                  </>
                )}

                {rating !== null && (
                  <details className="feed-rating-details">
                    <summary>View rating breakdown</summary>
                    <div className="feed-rating-metrics">
                      {Object.entries(item.ratings || {})
                        .map(([criterion, value]) => [criterion, Number(value)])
                        .filter(([, value]) => Number.isFinite(value) && value >= 1 && value <= 5)
                        .map(([criterion, value]) => (
                          <span key={criterion}>
                            <span>{RATING_LABELS[item.category]?.[criterion] || criterion.replace(/([A-Z])/g, ' $1').replace(/^./, (letter) => letter.toUpperCase())}</span>
                            <strong>{value} / 5</strong>
                          </span>
                        ))}
                    </div>
                  </details>
                )}

                {/* Community Engagement Actions */}
                <div className="feed-review-actions">
                  <button
                    type="button"
                    className={`feed-action-btn feed-helpful-btn${hasVotedHelpful ? ' is-active' : ''}`}
                    onClick={() => handleToggleHelpful(item.id)}
                    disabled={votingIds.has(item.id)}
                    aria-pressed={hasVotedHelpful}
                    title={hasVotedHelpful ? 'Remove helpful mark' : 'Mark this review as helpful'}
                  >
                    <ThumbsUp size={13} className={hasVotedHelpful ? 'feed-icon-filled' : ''} />
                    <span>Helpful</span>
                    <span className="feed-helpful-count">({item.helpfulCount || 0})</span>
                  </button>

                  <button
                    type="button"
                    className={`feed-action-btn feed-report-btn${hasReported ? ' is-reported' : ''}`}
                    onClick={() => !hasReported && handleOpenReport(item)}
                    disabled={hasReported}
                    title={hasReported ? 'You reported this review' : 'Report inappropriate feedback'}
                  >
                    <Flag size={13} className={hasReported ? 'feed-icon-filled' : ''} />
                    <span>{hasReported ? 'Reported' : 'Report'}</span>
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Full-screen Lightbox Modal */}
      {lightboxImage && (
        <div
          role="presentation"
          className="feed-lightbox-backdrop"
          onClick={() => setLightboxImage(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Photo evidence preview"
            className="feed-lightbox-dialog"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="feed-lightbox-close"
              onClick={() => setLightboxImage(null)}
              aria-label="Close photo preview"
            >
              <X size={18} />
            </button>
            <img src={lightboxImage.url} alt={lightboxImage.title || 'Photo evidence'} className="feed-lightbox-img" />
            {lightboxImage.title && (
              <div className="feed-lightbox-caption">
                <Camera size={14} /> {lightboxImage.title}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Content Moderation / Report Modal */}
      {reportingReview && (
        <div
          role="presentation"
          className="feed-report-backdrop"
          onClick={handleCloseReport}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="feed-report-modal-title"
            className="feed-report-dialog"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="feed-report-header">
              <div className="feed-report-title-row">
                <ShieldAlert size={19} className="feed-report-header-icon" />
                <h3 id="feed-report-modal-title">Report Feedback</h3>
              </div>
              <button
                type="button"
                className="feed-report-close-btn"
                onClick={handleCloseReport}
                aria-label="Close dialog"
                disabled={submittingReport}
              >
                <X size={18} />
              </button>
            </div>

            {reportSuccess ? (
              <div className="feed-report-success">
                <CheckCircle2 size={38} className="feed-report-success-icon" />
                <h4>Thank you for keeping MFU safe!</h4>
                <p>Your report has been submitted to campus moderators for review.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmitReport} className="feed-report-form">
                <p className="feed-report-desc">
                  Report this review for <strong>{reportingReview.target}</strong> ({reportingReview.category}).
                </p>

                {reportError && (
                  <div className="feed-report-error" role="alert">
                    <AlertCircle size={15} />
                    <span>{reportError}</span>
                  </div>
                )}

                <div className="feed-report-field">
                  <label className="feed-report-label" htmlFor="feed-report-reason">
                    Reason for reporting
                  </label>
                  <select
                    id="feed-report-reason"
                    className="feed-report-select"
                    value={reportReason}
                    onChange={(e) => setReportReason(e.target.value)}
                    disabled={submittingReport}
                  >
                    {REPORT_REASONS.map((reason) => (
                      <option key={reason} value={reason}>
                        {reason}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="feed-report-field">
                  <label className="feed-report-label" htmlFor="feed-report-details">
                    Additional details (optional)
                  </label>
                  <textarea
                    id="feed-report-details"
                    className="feed-report-textarea"
                    rows={3}
                    placeholder="Provide additional context for moderators..."
                    value={reportDetails}
                    onChange={(e) => setReportDetails(e.target.value)}
                    disabled={submittingReport}
                    maxLength={300}
                  />
                  <div className="feed-report-counter">{reportDetails.length}/300</div>
                </div>

                <div className="feed-report-actions">
                  <button
                    type="button"
                    className="feed-report-cancel-btn"
                    onClick={handleCloseReport}
                    disabled={submittingReport}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="feed-report-submit-btn"
                    disabled={submittingReport}
                  >
                    {submittingReport ? (
                      <>
                        <Loader2 size={15} className="feed-spinner" /> Submitting...
                      </>
                    ) : (
                      'Submit Report'
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Sub-location Drill-down Modal */}
      <SubLocationModal
        isOpen={Boolean(selectedSubLocation)}
        locationName={selectedSubLocation?.location}
        category={selectedSubLocation?.category}
        reviews={feed}
        onClose={() => setSelectedSubLocation(null)}
        onNavigate={onNavigate}
      />
    </div>
  );
}
