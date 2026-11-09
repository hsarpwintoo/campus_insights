import { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  Building2,
  Camera,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Download,
  ExternalLink,
  FileSpreadsheet,
  Loader2,
  MessageSquare,
  Search,
  Send,
  ShieldAlert,
  ShieldCheck,
  Star,
  Trash2,
  UserCheck,
  X
} from 'lucide-react';
import {
  deleteReviewAsAdmin,
  isAdminUser,
  resolveFeedbackReport,
  saveOfficialResponse,
  subscribeToFeedbacks,
  subscribeToReports
} from '../services/firebaseDb';
import { CATEGORIES } from '../data/campusLocations';
import './styles/AdminPortalPage.css';

const getRelativeTime = (timestamp) => {
  if (!timestamp) return 'Date unavailable';
  const elapsedSeconds = Math.floor((Date.now() - timestamp) / 1000);
  if (!Number.isFinite(elapsedSeconds)) return 'Date unavailable';
  if (elapsedSeconds < 60) return 'Just now';
  if (elapsedSeconds < 3600) return `${Math.floor(elapsedSeconds / 60)}m ago`;
  if (elapsedSeconds < 86400) return `${Math.floor(elapsedSeconds / 3600)}h ago`;
  if (elapsedSeconds < 604800) return `${Math.floor(elapsedSeconds / 86400)}d ago`;
  return new Date(timestamp).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
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

export default function AdminPortalPage({ user, onNavigate }) {
  const [activeTab, setActiveTab] = useState('moderation'); // 'moderation' | 'feedback' | 'analytics'
  const [reports, setReports] = useState(() => {
    try {
      const raw = localStorage.getItem('campus_cached_reports');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });
  const [reviews, setReviews] = useState(() => {
    try {
      const raw = localStorage.getItem('campus_cached_feedbacks');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });
  const [loadingReports, setLoadingReports] = useState(() => {
    try {
      const raw = localStorage.getItem('campus_cached_reports');
      return !(raw && JSON.parse(raw).length > 0);
    } catch {
      return true;
    }
  });
  const [loadingReviews, setLoadingReviews] = useState(() => {
    try {
      const raw = localStorage.getItem('campus_cached_feedbacks');
      return !(raw && JSON.parse(raw).length > 0);
    } catch {
      return true;
    }
  });
  const [error, setError] = useState('');
  const [notification, setNotification] = useState(null);
  const [processingId, setProcessingId] = useState(null);

  // Filter & Search states
  const [feedbackSearch, setFeedbackSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'flagged' | 'has_response' | 'has_photo'
  const [showResolvedHistory, setShowResolvedHistory] = useState(false);

  // Modals state
  const [responseModal, setResponseModal] = useState(null); // { review, text }
  const [deleteModal, setDeleteModal] = useState(null); // review
  const [isSubmittingResponse, setIsSubmittingResponse] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const isAdmin = isAdminUser(user?.email);

  // Subscribe to Reports & Reviews
  useEffect(() => {
    if (!isAdmin) return;

    const unsubReports = subscribeToReports(
      (data) => {
        setReports(data);
        setLoadingReports(false);
      },
      (err) => {
        console.error('Error loading reports:', err);
        setError('Unable to load moderation reports.');
        setLoadingReports(false);
      }
    );

    const unsubReviews = subscribeToFeedbacks(
      (data) => {
        setReviews(data);
        setLoadingReviews(false);
      },
      (err) => {
        console.error('Error loading reviews:', err);
        setError('Unable to load campus reviews.');
        setLoadingReviews(false);
      }
    );

    return () => {
      unsubReports?.();
      unsubReviews?.();
    };
  }, [isAdmin]);

  // Flash notification helper
  const showNotice = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  // Map reviews by ID for quick lookup
  const reviewsById = useMemo(() => {
    return new Map(reviews.map((r) => [r.id, r]));
  }, [reviews]);

  // Split reports into pending and resolved
  const pendingReports = useMemo(() => {
    return reports.filter((r) => !r.status || r.status === 'pending');
  }, [reports]);

  const resolvedReports = useMemo(() => {
    return reports.filter((r) => r.status && r.status !== 'pending');
  }, [reports]);

  // Filtered reviews for Tab 2
  const filteredReviews = useMemo(() => {
    return reviews.filter((item) => {
      // Category filter
      if (categoryFilter !== 'all' && item.category !== categoryFilter) return false;

      // Status filter
      if (statusFilter === 'flagged' && !item.isFlagged && (item.reportCount || 0) < 3) return false;
      if (statusFilter === 'has_response' && !item.officialResponse?.text) return false;
      if (statusFilter === 'has_photo' && !item.imageUrl) return false;

      // Text search
      const q = feedbackSearch.trim().toLowerCase();
      if (!q) return true;

      const searchable = [
        item.target,
        item.category,
        item.comment,
        item.author,
        item.userEmail,
        item.officialResponse?.text
      ].filter(Boolean).join(' ').toLowerCase();

      return searchable.includes(q);
    });
  }, [reviews, categoryFilter, statusFilter, feedbackSearch]);

  // Handle Report Actions
  const handleResolveReport = async (report, resolution) => {
    setProcessingId(report.id);
    try {
      await resolveFeedbackReport(
        report.id,
        report.reviewId,
        resolution,
        user?.email || 'admin@mfu.ac.th'
      );
      if (resolution === 'dismissed') {
        showNotice('success', 'Report dismissed. Review unflagged on Category Feed.');
      } else if (resolution === 'resolved_removed') {
        showNotice('success', 'Abusive review taken down and deleted.');
      } else if (resolution === 'resolved_shielded') {
        showNotice('success', 'Review permanently shielded from students.');
      }
    } catch (err) {
      console.error('Error resolving report:', err);
      showNotice('error', 'Failed to resolve report. Please try again.');
    } finally {
      setProcessingId(null);
    }
  };

  // Handle Official University Response Save
  const handleSaveResponse = async (e) => {
    e.preventDefault();
    if (!responseModal?.review) return;
    setIsSubmittingResponse(true);

    try {
      await saveOfficialResponse(
        responseModal.review.id,
        responseModal.text,
        user?.displayName || 'MFU Facility Management'
      );
      showNotice('success', 'Official university response published to review card.');
      setResponseModal(null);
    } catch (err) {
      console.error('Error saving official response:', err);
      showNotice('error', 'Failed to save official response.');
    } finally {
      setIsSubmittingResponse(false);
    }
  };

  // Handle Delete Review directly as Admin
  const handleDeleteReview = async () => {
    if (!deleteModal) return;
    setIsDeleting(true);
    try {
      await deleteReviewAsAdmin(deleteModal.id);
      showNotice('success', `Review for ${deleteModal.target} deleted successfully.`);
      setDeleteModal(null);
    } catch (err) {
      console.error('Error deleting review:', err);
      showNotice('error', 'Failed to delete review.');
    } finally {
      setIsDeleting(false);
    }
  };

  // CSV Export: All Feedback
  const handleExportFeedbackCSV = () => {
    if (!reviews.length) {
      showNotice('error', 'No feedback reviews available to export.');
      return;
    }

    const headers = [
      'Review ID',
      'Date Submitted',
      'Category',
      'Target Location',
      'Average Rating',
      'Comment',
      'Author',
      'Student Email',
      'Helpful Votes',
      'Report Count',
      'Is Flagged',
      'Official Response',
      'Has Photo'
    ];

    const rows = reviews.map((item) => {
      const avg = getRating(item.ratings);
      const dateStr = item.createdAtMillis
        ? new Date(item.createdAtMillis).toISOString().replace('T', ' ').substring(0, 19)
        : 'N/A';
      return [
        item.id,
        dateStr,
        item.category || 'General',
        `"${(item.target || '').replace(/"/g, '""')}"`,
        avg !== null ? avg.toFixed(2) : 'N/A',
        `"${(item.comment || '').replace(/"/g, '""').replace(/\n/g, ' ')}"`,
        `"${(item.author || '').replace(/"/g, '""')}"`,
        item.userEmail || (item.isAnonymous ? 'Anonymous' : 'N/A'),
        item.helpfulCount || 0,
        item.reportCount || 0,
        item.isFlagged ? 'YES' : 'NO',
        `"${(item.officialResponse?.text || '').replace(/"/g, '""').replace(/\n/g, ' ')}"`,
        item.imageUrl ? 'YES' : 'NO'
      ];
    });

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `MFU_Campus_Feedback_${new Date().toISOString().substring(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showNotice('success', 'Feedback CSV exported successfully.');
  };

  // CSV Export: Moderation Reports
  const handleExportReportsCSV = () => {
    if (!reports.length) {
      showNotice('error', 'No moderation reports available to export.');
      return;
    }

    const headers = [
      'Report ID',
      'Review ID',
      'Report Date',
      'Reporter Email',
      'Stated Reason',
      'Additional Details',
      'Status',
      'Resolved By',
      'Resolution Notes'
    ];

    const rows = reports.map((r) => {
      const dateStr = r.createdAtMillis
        ? new Date(r.createdAtMillis).toISOString().replace('T', ' ').substring(0, 19)
        : 'N/A';
      return [
        r.id,
        r.reviewId || 'N/A',
        dateStr,
        r.reporterEmail || 'Anonymous',
        `"${(r.reason || '').replace(/"/g, '""')}"`,
        `"${(r.details || '').replace(/"/g, '""').replace(/\n/g, ' ')}"`,
        r.status || 'pending',
        r.resolvedBy || 'Unassigned',
        `"${(r.notes || '').replace(/"/g, '""')}"`
      ];
    });

    const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `MFU_Moderation_Reports_${new Date().toISOString().substring(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showNotice('success', 'Moderation Audit CSV exported successfully.');
  };

  // Access Guard
  if (!isAdmin) {
    return (
      <div className="admin-portal-access-denied">
        <ShieldAlert size={48} className="admin-denied-icon" />
        <h2>Admin Access Required</h2>
        <p>
          You are currently signed in as <strong>{user?.email || 'Student'}</strong>. Only authorized Mae Fah Luang University facility managers and campus administrators can access this portal.
        </p>
        <button
          type="button"
          className="admin-denied-btn"
          onClick={() => onNavigate?.('home')}
        >
          Return to Student Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="admin-portal-page">
      {/* Portal Header */}
      <header className="admin-portal-header">
        <div className="admin-portal-title-block">
          <div className="admin-portal-badge">
            <ShieldCheck size={14} />
            <span>CAMPUS MODERATION &amp; FACILITY CONTROL</span>
          </div>
          <h1>Admin Portal</h1>
          <p>
            Audit reported student feedback, issue official university facility responses, and manage campus reviews.
          </p>
        </div>

        <div className="admin-signedin-pill">
          <UserCheck size={14} />
          <div>
            <strong>{user?.displayName || 'Campus Administrator'}</strong>
            <small>{user?.email}</small>
          </div>
        </div>
      </header>

      {/* Action Notification Banner */}
      {notification && (
        <div className={`admin-notification is-${notification.type}`} role="status">
          {notification.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          <span>{notification.message}</span>
          <button type="button" onClick={() => setNotification(null)} aria-label="Dismiss">
            <X size={14} />
          </button>
        </div>
      )}

      {error && (
        <div className="admin-error-banner" role="alert">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* KPI Cards Row */}
      <section className="admin-kpi-grid" aria-label="Key moderation metrics">
        <article className="admin-kpi-card is-pending">
          <div className="admin-kpi-label">
            Pending Reports <ShieldAlert size={15} />
          </div>
          <strong className="admin-kpi-val">{pendingReports.length}</strong>
          <span>Requires moderator review</span>
        </article>

        <article className="admin-kpi-card">
          <div className="admin-kpi-label">
            Total Reviews <MessageSquare size={15} />
          </div>
          <strong className="admin-kpi-val">{reviews.length}</strong>
          <span>Live campus submissions</span>
        </article>

        <article className="admin-kpi-card">
          <div className="admin-kpi-label">
            Official Responses <Building2 size={15} />
          </div>
          <strong className="admin-kpi-val">
            {reviews.filter((r) => r.officialResponse?.text).length}
          </strong>
          <span>Addressed by facility staff</span>
        </article>

        <article className="admin-kpi-card">
          <div className="admin-kpi-label">
            Resolved Flags <CheckCircle2 size={15} />
          </div>
          <strong className="admin-kpi-val">{resolvedReports.length}</strong>
          <span>Handled reports in audit log</span>
        </article>
      </section>

      {/* Portal Tabs Bar */}
      <nav className="admin-tabs-nav" aria-label="Admin portal sections">
        <button
          type="button"
          className={`admin-tab-btn${activeTab === 'moderation' ? ' is-active' : ''}`}
          onClick={() => setActiveTab('moderation')}
        >
          <ShieldAlert size={16} />
          <span>Moderation Queue</span>
          {pendingReports.length > 0 && (
            <span className="admin-tab-badge">{pendingReports.length}</span>
          )}
        </button>

        <button
          type="button"
          className={`admin-tab-btn${activeTab === 'feedback' ? ' is-active' : ''}`}
          onClick={() => setActiveTab('feedback')}
        >
          <MessageSquare size={16} />
          <span>Manage All Feedback</span>
          <span className="admin-tab-count">({reviews.length})</span>
        </button>

        <button
          type="button"
          className={`admin-tab-btn${activeTab === 'analytics' ? ' is-active' : ''}`}
          onClick={() => setActiveTab('analytics')}
        >
          <FileSpreadsheet size={16} />
          <span>Analytics &amp; CSV Export</span>
        </button>
      </nav>

      {/* =========================================================================
          TAB 1: MODERATION QUEUE
         ========================================================================= */}
      {activeTab === 'moderation' && (
        <section className="admin-tab-content" aria-label="Moderation queue">
          <div className="admin-section-header">
            <div>
              <h2>Reported Content Queue</h2>
              <p>Student reports logged for offensive language, harassment, spam, or false allegations.</p>
            </div>
          </div>

          {loadingReports ? (
            <div className="admin-loading-state">
              <Loader2 size={24} className="admin-spinner" />
              <span>Loading moderation queue...</span>
            </div>
          ) : pendingReports.length === 0 ? (
            <div className="admin-empty-queue">
              <CheckCircle2 size={44} className="admin-empty-icon" />
              <h3>All Clear! No Pending Reports</h3>
              <p>There are no flagged comments awaiting moderator review at this time.</p>
            </div>
          ) : (
            <div className="admin-reports-list">
              {pendingReports.map((report) => {
                const targetReview = reviewsById.get(report.reviewId);
                const isProcessing = processingId === report.id;

                return (
                  <article className="admin-report-card" key={report.id}>
                    {/* Report Topline */}
                    <div className="admin-report-topline">
                      <div className="admin-report-meta">
                        <span className="admin-reason-tag">
                          <AlertCircle size={12} />
                          {report.reason || 'Flagged review'}
                        </span>
                        <span className="admin-report-reporter">
                          Reported by <strong>{report.reporterEmail}</strong> • {getRelativeTime(report.createdAtMillis)}
                        </span>
                      </div>
                      <span className="admin-status-pill is-pending">Pending Review</span>
                    </div>

                    {/* Stated Details if any */}
                    {report.details && (
                      <div className="admin-reporter-notes">
                        <small>Reporter context:</small>
                        <p>&ldquo;{report.details}&rdquo;</p>
                      </div>
                    )}

                    {/* Associated Review Card */}
                    <div className="admin-reported-review-box">
                      {targetReview ? (
                        <>
                          <div className="admin-review-box-header">
                            <span className="admin-review-category">
                              {targetReview.category} • <strong>{targetReview.target}</strong>
                            </span>
                            <span className="admin-review-author-info">
                              Author: {targetReview.isAnonymous ? 'Anonymous Student' : targetReview.author}
                              {targetReview.userEmail ? ` (${targetReview.userEmail})` : ''}
                            </span>
                          </div>

                          <p className="admin-review-comment-text">
                            {targetReview.comment || <em>(No written text provided)</em>}
                          </p>

                          {targetReview.imageUrl && (
                            <div className="admin-review-photo-preview">
                              <a
                                href={targetReview.imageUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="admin-photo-link"
                              >
                                <Camera size={13} /> View Attached Evidence Photo <ExternalLink size={12} />
                              </a>
                            </div>
                          )}

                          <div className="admin-review-stats">
                            <span>Reports on doc: {targetReview.reportCount || 1}</span>
                            <span>Helpful votes: {targetReview.helpfulCount || 0}</span>
                            <span>Current status: {targetReview.isFlagged ? 'Shielded on Feed' : 'Visible'}</span>
                          </div>
                        </>
                      ) : (
                        <div className="admin-review-missing">
                          <AlertCircle size={16} />
                          <span>The original review has already been deleted or removed.</span>
                        </div>
                      )}
                    </div>

                    {/* Moderator Action Buttons */}
                    <div className="admin-report-actions">
                      <button
                        type="button"
                        className="admin-action-btn is-dismiss"
                        disabled={isProcessing}
                        onClick={() => handleResolveReport(report, 'dismissed')}
                        title="Dismiss report as false alarm or valid feedback"
                      >
                        {isProcessing ? <Loader2 size={14} className="admin-spinner" /> : <CheckCircle2 size={14} />}
                        Dismiss Flag (Keep Review)
                      </button>

                      {targetReview && (
                        <>
                          <button
                            type="button"
                            className="admin-action-btn is-respond"
                            disabled={isProcessing}
                            onClick={() =>
                              setResponseModal({
                                review: targetReview,
                                text: targetReview.officialResponse?.text || ''
                              })
                            }
                          >
                            <Building2 size={14} />
                            Post Official Facility Response
                          </button>

                          <button
                            type="button"
                            className="admin-action-btn is-remove"
                            disabled={isProcessing}
                            onClick={() => handleResolveReport(report, 'resolved_removed')}
                            title="Permanently remove abusive review from the feed"
                          >
                            {isProcessing ? <Loader2 size={14} className="admin-spinner" /> : <Trash2 size={14} />}
                            Take Down Review
                          </button>
                        </>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          {/* Resolved History Accordion */}
          {resolvedReports.length > 0 && (
            <div className="admin-resolved-history-section">
              <button
                type="button"
                className="admin-resolved-toggle-btn"
                onClick={() => setShowResolvedHistory((prev) => !prev)}
              >
                <span>Resolved &amp; Dismissed Audit History ({resolvedReports.length})</span>
                {showResolvedHistory ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>

              {showResolvedHistory && (
                <div className="admin-resolved-table-wrapper">
                  <table className="admin-resolved-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Reporter</th>
                        <th>Reason</th>
                        <th>Status</th>
                        <th>Resolved By</th>
                      </tr>
                    </thead>
                    <tbody>
                      {resolvedReports.map((r) => (
                        <tr key={r.id}>
                          <td>{getRelativeTime(r.createdAtMillis)}</td>
                          <td>{r.reporterEmail}</td>
                          <td>{r.reason}</td>
                          <td>
                            <span className={`admin-status-pill is-${r.status}`}>
                              {r.status === 'dismissed'
                                ? 'Dismissed'
                                : r.status === 'resolved_removed'
                                ? 'Taken Down'
                                : r.status}
                            </span>
                          </td>
                          <td>{r.resolvedBy || 'Admin'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </section>
      )}

      {/* =========================================================================
          TAB 2: MANAGE ALL FEEDBACK
         ========================================================================= */}
      {activeTab === 'feedback' && (
        <section className="admin-tab-content" aria-label="Manage campus feedback">
          <div className="admin-section-header">
            <div>
              <h2>All Campus Feedback Manager</h2>
              <p>Search, moderate, and attach official university facility responses across all reviews.</p>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="admin-filter-bar">
            <div className="admin-search-field">
              <Search size={16} className="admin-search-icon" />
              <input
                type="search"
                value={feedbackSearch}
                onChange={(e) => setFeedbackSearch(e.target.value)}
                placeholder="Search reviews by location, comment, student email, or author..."
                className="admin-search-input"
              />
              {feedbackSearch && (
                <button
                  type="button"
                  className="admin-search-clear"
                  onClick={() => setFeedbackSearch('')}
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <div className="admin-filter-selects">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="admin-select"
                aria-label="Filter by category"
              >
                <option value="all">All Categories</option>
                {CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="admin-select"
                aria-label="Filter by status"
              >
                <option value="all">All Statuses</option>
                <option value="flagged">Flagged / Shielded Only</option>
                <option value="has_response">Has Official Response</option>
                <option value="has_photo">Has Photo Evidence</option>
              </select>
            </div>
          </div>

          {/* Review Count Info */}
          <div className="admin-results-count">
            <span>Showing {filteredReviews.length} of {reviews.length} reviews</span>
          </div>

          {/* Reviews List */}
          {loadingReviews ? (
            <div className="admin-loading-state">
              <Loader2 size={24} className="admin-spinner" />
              <span>Loading campus reviews...</span>
            </div>
          ) : filteredReviews.length === 0 ? (
            <div className="admin-empty-queue">
              <MessageSquare size={36} className="admin-empty-icon" />
              <h3>No reviews match your filters</h3>
              <p>Try clearing your search terms or selecting &ldquo;All Categories&rdquo;.</p>
            </div>
          ) : (
            <div className="admin-feedback-table-list">
              {filteredReviews.map((item) => {
                const rating = getRating(item.ratings);
                const hasOfficial = Boolean(item.officialResponse?.text);

                return (
                  <article className="admin-feedback-row" key={item.id}>
                    <div className="admin-feedback-main">
                      <div className="admin-feedback-tags">
                        <span className="admin-tag-category">{item.category}</span>
                        <strong className="admin-tag-location">{item.target}</strong>
                        <span className="admin-tag-date">{getRelativeTime(item.createdAtMillis)}</span>
                        {item.isFlagged && (
                          <span className="admin-tag-flagged">
                            <ShieldAlert size={11} /> Flagged ({item.reportCount || 3})
                          </span>
                        )}
                        {item.imageUrl && (
                          <span className="admin-tag-photo">
                            <Camera size={11} /> Photo Evidence
                          </span>
                        )}
                      </div>

                      <div className="admin-feedback-author-row">
                        <span>
                          Author: <strong>{item.isAnonymous ? 'Anonymous Student' : item.author}</strong>
                          {item.userEmail && <small> ({item.userEmail})</small>}
                        </span>
                        <span className="admin-feedback-star">
                          <Star size={13} fill="currentColor" /> {rating !== null ? rating.toFixed(1) : '—'}
                        </span>
                      </div>

                      <p className="admin-feedback-text">
                        {item.comment?.trim() || <em>No written comment provided.</em>}
                      </p>

                      {/* Display Official Response if attached */}
                      {hasOfficial && (
                        <div className="admin-inline-official-box">
                          <Building2 size={13} />
                          <div>
                            <strong>{item.officialResponse.author}:</strong>{' '}
                            <span>{item.officialResponse.text}</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Actions Menu */}
                    <div className="admin-feedback-row-actions">
                      <button
                        type="button"
                        className="admin-row-action-btn is-response-btn"
                        onClick={() =>
                          setResponseModal({
                            review: item,
                            text: item.officialResponse?.text || ''
                          })
                        }
                      >
                        <Building2 size={13} />
                        {hasOfficial ? 'Edit Official Response' : 'Add Official Response'}
                      </button>

                      <button
                        type="button"
                        className="admin-row-action-btn is-delete-btn"
                        onClick={() => setDeleteModal(item)}
                      >
                        <Trash2 size={13} /> Delete
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* =========================================================================
          TAB 3: ANALYTICS & CSV EXPORT
         ========================================================================= */}
      {activeTab === 'analytics' && (
        <section className="admin-tab-content" aria-label="Analytics and export">
          <div className="admin-section-header">
            <div>
              <h2>Data Intelligence &amp; Export</h2>
              <p>Export feedback data to CSV for university committee meetings, facility audits, and compliance.</p>
            </div>
          </div>

          {/* Export Action Cards */}
          <div className="admin-export-grid">
            <div className="admin-export-card">
              <div className="admin-export-icon-box">
                <FileSpreadsheet size={28} />
              </div>
              <div className="admin-export-info">
                <h3>Export All Campus Feedback</h3>
                <p>
                  Download complete student feedback records ({reviews.length} reviews), including ratings breakdown, comments, target facilities, and official facility responses.
                </p>
                <button
                  type="button"
                  className="admin-download-btn"
                  onClick={handleExportFeedbackCSV}
                >
                  <Download size={15} /> Download Reviews (.CSV)
                </button>
              </div>
            </div>

            <div className="admin-export-card">
              <div className="admin-export-icon-box is-reports">
                <ShieldCheck size={28} />
              </div>
              <div className="admin-export-info">
                <h3>Export Moderation Audit Log</h3>
                <p>
                  Download student report history ({reports.length} audit logs), stated flag reasons, reporter emails, and resolution actions taken by campus moderators.
                </p>
                <button
                  type="button"
                  className="admin-download-btn"
                  onClick={handleExportReportsCSV}
                >
                  <Download size={15} /> Download Moderation Log (.CSV)
                </button>
              </div>
            </div>
          </div>

          {/* Breakdown Statistics */}
          <div className="admin-analytics-stats-grid">
            <div className="admin-stats-card">
              <h3>Report Reasons Distribution</h3>
              <div className="admin-stats-list">
                {['Inappropriate / Offensive Language', 'Harassment or Bullying', 'Spam or Commercial Promotion', 'False or Misleading Information', 'Other Concern'].map((reason) => {
                  const count = reports.filter((r) => (r.reason || '').toLowerCase().includes(reason.toLowerCase().split(' ')[0])).length;
                  const pct = reports.length ? Math.round((count / reports.length) * 100) : 0;
                  return (
                    <div className="admin-stat-row" key={reason}>
                      <div className="admin-stat-heading">
                        <span>{reason}</span>
                        <strong>{count} ({pct}%)</strong>
                      </div>
                      <div className="admin-stat-track">
                        <div className="admin-stat-fill" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="admin-stats-card">
              <h3>Facility Feedback Distribution</h3>
              <div className="admin-stats-list">
                {CATEGORIES.map((cat) => {
                  const count = reviews.filter((r) => r.category === cat.id).length;
                  const pct = reviews.length ? Math.round((count / reviews.length) * 100) : 0;
                  return (
                    <div className="admin-stat-row" key={cat.id}>
                      <div className="admin-stat-heading">
                        <span>{cat.label}</span>
                        <strong>{count} ({pct}%)</strong>
                      </div>
                      <div className="admin-stat-track">
                        <div className="admin-stat-fill is-gold" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* =========================================================================
          MODAL: OFFICIAL UNIVERSITY RESPONSE
         ========================================================================= */}
      {responseModal && (
        <div
          role="presentation"
          className="admin-modal-backdrop"
          onClick={() => !isSubmittingResponse && setResponseModal(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="official-response-title"
            className="admin-modal-dialog"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="admin-modal-header">
              <div className="admin-modal-title-row">
                <Building2 size={18} className="admin-modal-header-icon" />
                <h3 id="official-response-title">Official University Response</h3>
              </div>
              <button
                type="button"
                className="admin-modal-close"
                onClick={() => setResponseModal(null)}
                disabled={isSubmittingResponse}
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveResponse} className="admin-modal-form">
              <div className="admin-response-preview-box">
                <small>Responding to review for <strong>{responseModal.review.target}</strong> ({responseModal.review.category}):</small>
                <p>&ldquo;{responseModal.review.comment || 'Star rating submitted'}&rdquo;</p>
              </div>

              <div className="admin-field">
                <label htmlFor="admin-official-text">
                  Official Facility / Administrative Response Note:
                </label>
                <textarea
                  id="admin-official-text"
                  rows={4}
                  className="admin-textarea"
                  placeholder="e.g., Campus Maintenance inspected the room on Nov 10. Replacement parts have been ordered..."
                  value={responseModal.text}
                  onChange={(e) =>
                    setResponseModal((prev) => ({ ...prev, text: e.target.value }))
                  }
                  disabled={isSubmittingResponse}
                  maxLength={500}
                  required
                />
                <span className="admin-char-count">{responseModal.text.length}/500</span>
              </div>

              <div className="admin-modal-actions">
                <button
                  type="button"
                  className="admin-cancel-btn"
                  onClick={() => setResponseModal(null)}
                  disabled={isSubmittingResponse}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="admin-submit-btn"
                  disabled={isSubmittingResponse}
                >
                  {isSubmittingResponse ? (
                    <>
                      <Loader2 size={14} className="admin-spinner" /> Publishing...
                    </>
                  ) : (
                    <>
                      <Send size={14} /> Publish Official Response
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: CONFIRM DELETE REVIEW
         ========================================================================= */}
      {deleteModal && (
        <div
          role="presentation"
          className="admin-modal-backdrop"
          onClick={() => !isDeleting && setDeleteModal(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-delete-title"
            className="admin-modal-dialog is-danger"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="admin-modal-header is-danger">
              <div className="admin-modal-title-row">
                <Trash2 size={18} className="admin-danger-icon" />
                <h3 id="confirm-delete-title">Delete Campus Review</h3>
              </div>
              <button
                type="button"
                className="admin-modal-close"
                onClick={() => setDeleteModal(null)}
                disabled={isDeleting}
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <div className="admin-modal-form">
              <p className="admin-delete-warning">
                Are you sure you want to permanently delete this review for <strong>{deleteModal.target}</strong>? This action cannot be undone.
              </p>

              <div className="admin-response-preview-box">
                <small>Review Comment:</small>
                <p>&ldquo;{deleteModal.comment || 'Star rating submitted'}&rdquo;</p>
              </div>

              <div className="admin-modal-actions">
                <button
                  type="button"
                  className="admin-cancel-btn"
                  onClick={() => setDeleteModal(null)}
                  disabled={isDeleting}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="admin-danger-btn"
                  onClick={handleDeleteReview}
                  disabled={isDeleting}
                >
                  {isDeleting ? (
                    <>
                      <Loader2 size={14} className="admin-spinner" /> Deleting...
                    </>
                  ) : (
                    'Permanently Delete Review'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
