import { useEffect, useMemo, useState } from 'react';
import {
  Building2,
  HeartPulse,
  Layers3,
  Loader2,
  MessageSquare,
  Plus,
  Search,
  Star,
  Utensils,
  Bus,
  AlertCircle
} from 'lucide-react';
import { subscribeToFeedbacks } from '../services/firebaseDb';
import './FeedPage.css';

const CATEGORIES = [
  { id: 'all', label: 'All Reviews', icon: Layers3 },
  { id: 'Dormitories', label: 'Dormitories', icon: Building2 },
  { id: 'Canteen', label: 'Canteens', icon: Utensils },
  { id: 'Services', label: 'Services & Wifi', icon: Bus },
  { id: 'Health Services', label: 'Health Services', icon: HeartPulse }
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

export default function FeedPage({ onNavigate }) {
  const [feed, setFeed] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [search, setSearch] = useState('');

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
                  <strong className="feed-review-location">{item.target || 'Campus location not specified'}</strong>
                </div>

                {item.comment?.trim() ? (
                  <p className="feed-review-comment">{item.comment.trim()}</p>
                ) : (
                  <p className="feed-review-comment feed-missing-comment">No written comment provided.</p>
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
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
