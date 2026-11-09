import { useEffect, useState } from 'react';
import {
  ArrowRight,
  Award,
  Building2,
  Bus,
  HeartPulse,
  Loader2,
  MessageSquare,
  Plus,
  Sparkles,
  Utensils
} from 'lucide-react';
import { analyzeFeedback } from '../services/insightsAnalyzer';
import { subscribeToFeedbacks } from '../services/firebaseDb';
import './styles/HomePage.css';

const CATEGORIES = [
  { id: 'Dormitories', label: 'Dormitories', icon: Building2, color: '#762316' },
  { id: 'Canteen', label: 'Canteens', icon: Utensils, color: '#b59a43' },
  { id: 'Services', label: 'Services & Wifi', icon: Bus, color: '#5e73b7' },
  { id: 'Health Services', label: 'Health Services', icon: HeartPulse, color: '#86a965' }
];

const displayScore = (score) => score === null ? '—' : score.toFixed(1);

const getInitials = (name = '') => name
  .trim()
  .split(/\s+/)
  .slice(0, 2)
  .map((part) => part[0])
  .join('')
  .toUpperCase() || 'S';

export default function HomePage({ onNavigate, user }) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const unsubscribe = subscribeToFeedbacks(
      (updatedReviews) => {
        setReviews(updatedReviews);
        setError('');
        setLoading(false);
      },
      (loadError) => {
        console.error('Unable to load dashboard feedback:', loadError);
        setError('Campus ratings could not be loaded. Please try again later.');
        setLoading(false);
      }
    );

    return unsubscribe;
  }, []);

  const insights = analyzeFeedback(reviews);
  const categoryScores = new Map(
    insights.categoryAverages.map((item) => [item.name, item.average])
  );
  const categoriesWithScores = CATEGORIES.map((category) => ({
    ...category,
    score: categoryScores.get(category.id) ?? null
  }));
  const ratedCategories = categoriesWithScores.filter((category) => category.score !== null);
  const highestCategory = ratedCategories.reduce(
    (best, category) => !best || category.score > best.score ? category : best,
    null
  );
  const lowestCategory = ratedCategories.reduce(
    (worst, category) => !worst || category.score < worst.score ? category : worst,
    null
  );
  const topLocations = [...insights.locationAverages]
    .sort((a, b) => b.average - a.average)
    .slice(0, 3);
  const studentName = user?.displayName || user?.email || 'Campus student';
  const isMfuEmail = user?.email?.endsWith('@lamduan.mfu.ac.th') || user?.email?.endsWith('@mfu.ac.th');

  if (loading) {
    return (
      <div className="dashboard-loading" role="status">
        <Loader2 className="dashboard-spinner" size={20} />
        Loading campus ratings...
      </div>
    );
  }

  return (
    <div className="dashboard-home">
      <header className="dashboard-header">
        <div>
          <h1>Campus Insights Dashboard</h1>
          <p>Real-time evaluation data &amp; satisfaction metrics across Mae Fah Luang University.</p>
        </div>
        <button className="dashboard-submit-button" onClick={() => onNavigate('submit')}>
          <Plus size={16} />
          Submit Feedback
        </button>
      </header>

      <section className="dashboard-student-card" aria-label="Signed-in student">
        {user?.photoURL ? (
          <img className="dashboard-avatar" src={user.photoURL} alt="" />
        ) : (
          <div className="dashboard-avatar dashboard-avatar-initials">{getInitials(studentName)}</div>
        )}
        <div className="dashboard-student-details">
          <strong>{studentName}</strong>
          <span>
            {user?.email || 'Signed in'}
            <span className="dashboard-detail-separator">•</span>
            <span className={isMfuEmail ? 'dashboard-status-verified' : 'dashboard-status'}>
              <span className="dashboard-status-dot" />
              {isMfuEmail ? 'MFU account' : 'Student account'}
            </span>
          </span>
        </div>
      </section>

      {error && <div className="dashboard-error" role="alert">{error}</div>}

      <section className="dashboard-metrics" aria-label="Campus rating summary">
        <article className="dashboard-metric-card dashboard-overall-card">
          <div className="dashboard-metric-label">Overall rating <Award size={15} /></div>
          <strong className="dashboard-overall-score">{displayScore(insights.overallAverage)}</strong>
          <span>out of 5.0 overall average</span>
        </article>

        <article className="dashboard-metric-card">
          <div className="dashboard-metric-label">Total feedback <MessageSquare size={15} /></div>
          <strong className="dashboard-metric-value">{insights.totalSubmissions}</strong>
          <span className="dashboard-live-label"><span className="dashboard-status-dot" /> Live from campus feedback</span>
        </article>

        <article className="dashboard-metric-card">
          <div className="dashboard-metric-label">Top category <Utensils size={15} /></div>
          <strong className="dashboard-metric-title">{highestCategory?.label ?? 'Not rated yet'}</strong>
          <span className="dashboard-highlight-score">
            {highestCategory ? `${displayScore(highestCategory.score)} / 5 average` : 'No ratings submitted'}
          </span>
        </article>

        <article className="dashboard-metric-card">
          <div className="dashboard-metric-label">Needs focus <Bus size={15} /></div>
          <strong className="dashboard-metric-title">{lowestCategory?.label ?? 'Not rated yet'}</strong>
          <span className="dashboard-focus-score">
            {lowestCategory ? `${displayScore(lowestCategory.score)} / 5 average` : 'No ratings submitted'}
          </span>
        </article>
      </section>

      <section className="dashboard-panels">
        <article className="dashboard-panel dashboard-category-panel">
          <h2>Category Satisfaction Breakdown</h2>
          {ratedCategories.length === 0 ? (
            <p className="dashboard-empty-state">Category averages will appear after students submit ratings.</p>
          ) : (
            <div className="dashboard-category-list">
              {categoriesWithScores.map((category, index) => {
                const Icon = category.icon;
                return (
                  <div className="dashboard-category-row" key={category.id}>
                    <div className="dashboard-category-heading">
                      <span className="dashboard-category-name">
                        <Icon size={15} color={category.color} />
                        {category.label}
                      </span>
                      <strong>{displayScore(category.score)} / 5</strong>
                    </div>
                    <div
                      className="dashboard-progress-track"
                      role="progressbar"
                      aria-label={`${category.label} average rating`}
                      aria-valuemin={0}
                      aria-valuemax={5}
                      aria-valuenow={category.score ?? 0}
                    >
                      <span
                        className="dashboard-progress-fill"
                        style={{
                          width: `${category.score === null ? 0 : (category.score / 5) * 100}%`,
                          backgroundColor: category.color,
                          animationDelay: `${index * 90}ms`
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </article>

        <article className="dashboard-panel dashboard-insights-panel">
          <div className="dashboard-panel-heading">
            <div>
              <h2>Campus Health Insights</h2>
              <p>Highest-rated locations based on submitted student feedback.</p>
            </div>
            <Sparkles size={18} color="#762316" />
          </div>

          {topLocations.length === 0 ? (
            <p className="dashboard-empty-state">Location ratings will appear after students submit feedback.</p>
          ) : (
            <div className="dashboard-location-list">
              {topLocations.map((location) => (
                <div className="dashboard-location-row" key={location.name}>
                  <span>{location.name}</span>
                  <strong>{displayScore(location.average)} / 5</strong>
                </div>
              ))}
            </div>
          )}

          <button className="dashboard-feed-button" onClick={() => onNavigate('feed')}>
            View Recent Reviews Feed <ArrowRight size={16} />
          </button>
        </article>
      </section>
    </div>
  );
}
