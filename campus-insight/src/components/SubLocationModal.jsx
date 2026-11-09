import { useEffect, useMemo } from 'react';
import {
  Building2,
  Calendar,
  MessageSquare,
  Plus,
  Star,
  ThumbsUp,
  X
} from 'lucide-react';
import { CATEGORIES, CATEGORY_CRITERIA, getLocationCategory } from '../data/campusLocations';
import './styles/SubLocationModal.css';

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

export default function SubLocationModal({
  isOpen,
  onClose,
  locationName,
  category: propCategory,
  reviews = [],
  onNavigate
}) {
  const category = propCategory || getLocationCategory(locationName);
  const categoryInfo = CATEGORIES.find((cat) => cat.id === category) || {
    id: category,
    label: category,
    icon: Building2,
    color: '#762316'
  };
  const CategoryIcon = categoryInfo.icon || Building2;
  const criteriaList = useMemo(() => CATEGORY_CRITERIA[category] || [], [category]);

  // Filter reviews for this specific sub-location
  const locationReviews = useMemo(() => {
    if (!locationName) return [];
    return reviews.filter(
      (r) => r.target?.toLowerCase() === locationName.toLowerCase()
    );
  }, [reviews, locationName]);

  // Compute criteria averages
  const criteriaScores = useMemo(() => {
    return criteriaList.map((crit) => {
      const values = locationReviews
        .map((r) => r.ratings?.[crit.key])
        .filter((v) => Number.isFinite(Number(v)) && Number(v) >= 1 && Number(v) <= 5)
        .map(Number);

      const avg = values.length
        ? values.reduce((sum, v) => sum + v, 0) / values.length
        : null;

      return {
        key: crit.key,
        label: crit.label,
        average: avg,
        count: values.length
      };
    });
  }, [criteriaList, locationReviews]);

  // Overall location average
  const overallAverage = useMemo(() => {
    const validScores = criteriaScores
      .map((c) => c.average)
      .filter((avg) => avg !== null);
    if (!validScores.length) return null;
    return validScores.reduce((sum, v) => sum + v, 0) / validScores.length;
  }, [criteriaScores]);

  // Escape key handler
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !locationName) return null;

  // Radar Chart coordinates computation
  const svgSize = 340;
  const cx = svgSize / 2;
  const cy = svgSize / 2 + 5;
  const maxRadius = 100;
  const numAxes = criteriaScores.length;

  const getAxisPoint = (axisIndex, valueRatio, offset = 0) => {
    const angle = -Math.PI / 2 + (2 * Math.PI * axisIndex) / numAxes;
    const r = maxRadius * valueRatio + offset;
    return {
      x: cx + r * Math.cos(angle),
      y: cy + r * Math.sin(angle)
    };
  };

  // Polygon grid lines (1 to 5 stars)
  const gridLevels = [1, 2, 3, 4, 5];
  const gridPolygons = gridLevels.map((level) => {
    const ratio = level / 5;
    return criteriaScores
      .map((_, i) => {
        const pt = getAxisPoint(i, ratio);
        return `${pt.x},${pt.y}`;
      })
      .join(' ');
  });

  // Data polygon points
  const hasData = criteriaScores.some((c) => c.average !== null);
  const dataPoints = criteriaScores.map((c, i) => {
    const ratio = c.average !== null ? c.average / 5 : 0.05;
    return getAxisPoint(i, ratio);
  });
  const dataPolygonString = dataPoints.map((pt) => `${pt.x},${pt.y}`).join(' ');

  return (
    <div
      role="presentation"
      className="sub-location-modal-backdrop"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="sub-location-modal-title"
        className="sub-location-modal-dialog"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <header className="sub-location-modal-header">
          <div className="sub-location-header-left">
            <span
              className="sub-location-category-badge"
              style={{ backgroundColor: `${categoryInfo.color}15`, color: categoryInfo.color }}
            >
              <CategoryIcon size={14} />
              {categoryInfo.label}
            </span>
            <h2 id="sub-location-modal-title" className="sub-location-title">
              {locationName}
            </h2>
          </div>
          <button
            type="button"
            className="sub-location-close-btn"
            onClick={onClose}
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </header>

        {/* Modal Scrollable Body */}
        <div className="sub-location-modal-body">
          {/* Top Score Banner */}
          <div className="sub-location-overview-card">
            <div className="sub-location-score-block">
              <span className="sub-location-score-val">
                {overallAverage !== null ? overallAverage.toFixed(1) : '—'}
              </span>
              <div className="sub-location-score-meta">
                <div className="sub-location-stars">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      size={14}
                      fill={
                        overallAverage !== null && star <= Math.round(overallAverage)
                          ? '#d97706'
                          : 'none'
                      }
                      color="#d97706"
                    />
                  ))}
                </div>
                <span>
                  {locationReviews.length}{' '}
                  {locationReviews.length === 1 ? 'student review' : 'student reviews'}
                </span>
              </div>
            </div>

            <div className="sub-location-action-prompt">
              <button
                type="button"
                className="sub-location-review-now-btn"
                onClick={() => {
                  onClose?.();
                  onNavigate?.('submit');
                }}
              >
                <Plus size={15} /> Rate {locationName}
              </button>
            </div>
          </div>

          {/* Section: Radar Chart & Criteria Breakdown */}
          <div className="sub-location-grid">
            {/* Visual Radar Chart */}
            <div className="sub-location-chart-card">
              <div className="sub-location-section-heading">
                <h3>Criteria Radar Analysis</h3>
                <span className="sub-location-scale-tag">5-Point Scale</span>
              </div>

              <div className="sub-location-radar-wrapper">
                <svg
                  viewBox={`0 0 ${svgSize} ${svgSize}`}
                  className="sub-location-radar-svg"
                  aria-label={`Radar chart showing satisfaction scores for ${locationName}`}
                >
                  {/* Concentric grid polygons */}
                  {gridPolygons.map((points, idx) => (
                    <polygon
                      key={idx}
                      points={points}
                      className="radar-grid-line"
                      stroke={idx === 4 ? '#b8b2a7' : '#e4dfd7'}
                    />
                  ))}

                  {/* Radial Axis Lines */}
                  {criteriaScores.map((_, i) => {
                    const endPt = getAxisPoint(i, 1);
                    return (
                      <line
                        key={i}
                        x1={cx}
                        y1={cy}
                        x2={endPt.x}
                        y2={endPt.y}
                        className="radar-axis-line"
                      />
                    );
                  })}

                  {/* Filled Data Polygon */}
                  {hasData && (
                    <polygon
                      points={dataPolygonString}
                      className="radar-data-polygon"
                      style={{
                        fill: `${categoryInfo.color}35`,
                        stroke: categoryInfo.color
                      }}
                    />
                  )}

                  {/* Vertex Markers */}
                  {hasData &&
                    dataPoints.map((pt, i) => (
                      <circle
                        key={i}
                        cx={pt.x}
                        cy={pt.y}
                        r={4.5}
                        className="radar-data-point"
                        style={{ fill: categoryInfo.color }}
                      />
                    ))}

                  {/* Axis Vertex Labels */}
                  {criteriaScores.map((c, i) => {
                    const labelPt = getAxisPoint(i, 1, 24);
                    const isLeft = labelPt.x < cx - 10;
                    const isRight = labelPt.x > cx + 10;
                    const anchor = isLeft ? 'end' : isRight ? 'start' : 'middle';

                    return (
                      <text
                        key={c.key}
                        x={labelPt.x}
                        y={labelPt.y}
                        textAnchor={anchor}
                        className="radar-axis-label"
                      >
                        {c.label}
                        <tspan className="radar-axis-score" dy="1.1em" x={labelPt.x}>
                          {c.average !== null ? `(${c.average.toFixed(1)}/5)` : '(—)'}
                        </tspan>
                      </text>
                    );
                  })}
                </svg>

                {!hasData && (
                  <div className="sub-location-no-radar-overlay">
                    <p>No criteria ratings yet for this specific sub-location.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Criteria Scores List */}
            <div className="sub-location-breakdown-card">
              <div className="sub-location-section-heading">
                <h3>Detailed Metrics</h3>
                <span>{criteriaList.length} Criteria</span>
              </div>

              <div className="sub-location-bars-list">
                {criteriaScores.map((crit) => {
                  const pct = crit.average !== null ? (crit.average / 5) * 100 : 0;
                  return (
                    <div className="sub-location-bar-item" key={crit.key}>
                      <div className="sub-location-bar-header">
                        <span className="sub-location-bar-label">{crit.label}</span>
                        <strong className="sub-location-bar-val">
                          {crit.average !== null ? `${crit.average.toFixed(1)} / 5.0` : 'Not rated'}
                        </strong>
                      </div>
                      <div className="sub-location-progress-track">
                        <div
                          className="sub-location-progress-fill"
                          style={{
                            width: `${pct}%`,
                            backgroundColor: categoryInfo.color
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Section: Recent Filtered Comments */}
          <div className="sub-location-comments-section">
            <div className="sub-location-section-heading">
              <div className="sub-location-heading-group">
                <MessageSquare size={16} />
                <h3>Student Feedback for {locationName}</h3>
              </div>
              <span>{locationReviews.length} Submissions</span>
            </div>

            {locationReviews.length === 0 ? (
              <div className="sub-location-empty-reviews">
                <p>No written reviews submitted specifically for {locationName} yet.</p>
                <button
                  type="button"
                  className="sub-location-be-first-btn"
                  onClick={() => {
                    onClose?.();
                    onNavigate?.('submit');
                  }}
                >
                  Be the first student to review {locationName}
                </button>
              </div>
            ) : (
              <div className="sub-location-reviews-list">
                {locationReviews.map((item) => {
                  const author = item.isAnonymous ? 'Anonymous student' : item.author || 'MFU Student';
                  return (
                    <article className="sub-location-review-card" key={item.id}>
                      <div className="sub-location-review-top">
                        <div className="sub-location-review-author">
                          <strong>{author}</strong>
                          <span className="sub-location-review-date">
                            <Calendar size={12} /> {getRelativeTime(item.createdAtMillis)}
                          </span>
                        </div>
                        {item.helpfulCount > 0 && (
                          <span className="sub-location-helpful-pill">
                            <ThumbsUp size={11} /> {item.helpfulCount} helpful
                          </span>
                        )}
                      </div>

                      {item.comment?.trim() ? (
                        <p className="sub-location-review-text">{item.comment.trim()}</p>
                      ) : (
                        <p className="sub-location-review-text sub-location-text-muted">
                          Star rating submitted without written comment.
                        </p>
                      )}
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
