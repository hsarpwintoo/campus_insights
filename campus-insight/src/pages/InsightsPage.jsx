import { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  BarChart3,
  Building2,
  HeartPulse,
  MessageSquare,
  RefreshCw,
  Star,
  TrendingDown,
  TrendingUp,
  Utensils,
  Bus,
  Brain
} from 'lucide-react';
import { fetchFeedbacksFromFirestore, subscribeToFeedbacks } from '../services/firebaseDb';
import { analyzeFeedback } from '../services/insightsAnalyzer';
import './styles/InsightsPage.css';

const CATEGORY_ICONS = {
  Dormitories: Building2,
  Canteen: Utensils,
  Services: Bus,
  'Health Services': HeartPulse
};

const formatScore = (score) => score === null ? '—' : `${Number(score.toFixed(2))} / 5`;
const formatCount = (count, singular, plural = `${singular}s`) => `${count} ${count === 1 ? singular : plural}`;

function MetricCard({ icon: Icon, label, value, detail, highlight = false }) {
  return (
    <article className={`insights-metric-card${highlight ? ' is-highlight' : ''}`}>
      <div className="insights-metric-label">
        <span>{label}</span>
        <Icon size={16} />
      </div>
      <div className="insights-metric-value">{value}</div>
      <div className="insights-metric-detail">{detail}</div>
    </article>
  );
}

function RankingCard({ title, items, kind }) {
  const isCategory = kind === 'category';
  return (
    <section className="insights-card insights-ranking-card">
      <div className="insights-card-heading">
        <div>
          <h2>{title}</h2>
          <p>{isCategory ? 'Student ratings on a 5-point scale' : 'Ratings based on submitted reviews'}</p>
        </div>
        {!isCategory && <span className="insights-scale-label">OUT OF 5</span>}
      </div>

      {items.length === 0 ? (
        <p className="insights-empty-text">Ratings will appear here after students submit feedback.</p>
      ) : (
        <div className={`insights-ranking-list${isCategory ? ' is-category' : ' is-location'}`}>
          {items.map((item) => {
            const Icon = CATEGORY_ICONS[item.name];
            return (
              <div className="insights-ranking-row" key={item.name}>
                <div className="insights-ranking-info">
                  <div className="insights-ranking-name">
                    {isCategory && Icon && <Icon size={14} />}
                    <strong>{item.name}</strong>
                  </div>
                  <span>{formatCount(item.submissionCount, 'submission')}</span>
                </div>
                <div
                  className="insights-rating-track"
                  role="progressbar"
                  aria-label={`${item.name} average rating`}
                  aria-valuemin={0}
                  aria-valuemax={5}
                  aria-valuenow={item.average}
                >
                  <span style={{ width: `${(item.average / 5) * 100}%` }} />
                </div>
                <strong className="insights-ranking-score">{formatScore(item.average)}</strong>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

function SummaryCard({ insights }) {
  const highlights = [
    insights.highestRatedCategory && {
      label: 'Highest-rated category',
      name: insights.highestRatedCategory.name,
      score: formatScore(insights.highestRatedCategory.average)
    },
    insights.lowestRatedCategory && {
      label: 'Lowest-rated category',
      name: insights.lowestRatedCategory.name,
      score: formatScore(insights.lowestRatedCategory.average)
    },
    insights.highestRatedLocation && {
      label: 'Highest-rated location',
      name: insights.highestRatedLocation.name,
      score: formatScore(insights.highestRatedLocation.average)
    },
    insights.lowestRatedLocation && {
      label: 'Lowest-rated location',
      name: insights.lowestRatedLocation.name,
      score: formatScore(insights.lowestRatedLocation.average)
    },
    insights.complaintTopics[0] && {
      label: 'Most frequent complaint keyword',
      name: `“${insights.complaintTopics[0].keyword}”`,
      score: formatCount(insights.complaintTopics[0].mentions, 'mention')
    }
  ].filter(Boolean);

  return (
    <section className="insights-card insights-summary-card">
      <div className="insights-card-heading">
        <h2>Data-derived summary</h2>
        <span className="insights-feedback-badge">BASED ON FEEDBACK</span>
      </div>
      {highlights.length === 0 ? (
        <p className="insights-empty-text">Insights will appear when ratings and comments have been submitted.</p>
      ) : (
        <ol className="insights-highlights">
          {highlights.map((item, index) => (
            <li key={item.label}>
              <span className="insights-highlight-number">{String(index + 1).padStart(2, '0')}</span>
              <span className="insights-highlight-title">{item.label}: <strong>{item.name}</strong></span>
              <strong className="insights-highlight-value">{item.score}</strong>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

function SentimentCard({ insights }) {
  const total = Object.values(insights.sentiment).reduce((sum, count) => sum + count, 0);
  const positivePercentage = total ? Math.round((insights.sentiment.positive / total) * 100) : 0;
  const negativePercentage = total ? Math.round((insights.sentiment.negative / total) * 100) : 0;
  const positiveEnd = positivePercentage;
  const negativeEnd = positiveEnd + negativePercentage;
  const donutStyle = total
    ? { '--donut-background': `conic-gradient(#477a5b 0% ${positiveEnd}%, #a84b43 ${positiveEnd}% ${negativeEnd}%, #c39a46 ${negativeEnd}% 100%)` }
    : { '--donut-background': '#eae7e1' };

  return (
    <section className="insights-card insights-sentiment-card">
      <h2>Sentiment indicators</h2>
      <div className="insights-sentiment-content">
        <div className="insights-donut" style={donutStyle} role="img" aria-label={`${positivePercentage}% positive, ${negativePercentage}% negative sentiment`}>
          <div className="insights-donut-hole">
            <strong>{total}</strong>
            <span>{total === 1 ? 'submission' : 'submissions'}</span>
          </div>
        </div>
        <div className="insights-sentiment-legend">
          {[
            { label: 'Positive', count: insights.sentiment.positive, color: '#477a5b' },
            { label: 'Negative', count: insights.sentiment.negative, color: '#a84b43' },
            { label: 'Neutral', count: insights.sentiment.neutral, color: '#c39a46' }
          ].map(({ label, count, color }) => (
            <div className="insights-legend-row" key={label}>
              <span className="insights-legend-dot" style={{ backgroundColor: color }} />
              <span>{label}</span>
              <strong>{count}</strong>
            </div>
          ))}
        </div>
      </div>
      <p className="insights-footnote">Sentiment is estimated from keywords in submitted comments.</p>
    </section>
  );
}

function ComplaintCard({ topics }) {
  return (
    <section className="insights-card insights-complaint-card">
      <div className="insights-card-heading">
        <h2>Frequently mentioned complaint topics</h2>
      </div>
      {topics.length ? (
        <div className="insights-topic-list">
          {topics.map(({ keyword, mentions }) => (
            <span className="insights-topic-chip" key={keyword}>
              {keyword} <strong>{mentions}</strong>
            </span>
          ))}
        </div>
      ) : (
        <p className="insights-empty-text">Complaint topics will appear when negative feedback mentions recurring issues.</p>
      )}
    </section>
  );
}

export default function InsightsPage() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const insights = useMemo(() => analyzeFeedback(reviews), [reviews]);

  useEffect(() => {
    const unsubscribe = subscribeToFeedbacks(
      (updatedReviews) => {
        setReviews(updatedReviews);
        setError('');
        setLoading(false);
      },
      (loadError) => {
        console.error('Unable to load insights feedback:', loadError);
        setError('We could not load campus feedback right now. Please try again.');
        setLoading(false);
      }
    );

    return unsubscribe;
  }, []);

  const refreshInsights = async () => {
    setRefreshing(true);
    setError('');
    try {
      const currentReviews = await fetchFeedbacksFromFirestore({ throwOnError: true });
      setReviews(currentReviews);
    } catch (loadError) {
      console.error('Unable to refresh insights:', loadError);
      setError('We could not refresh campus feedback right now. Please try again.');
    } finally {
      setRefreshing(false);
    }
  };

  if (loading) {
    return <div className="insights-loading" role="status">Loading campus insights...</div>;
  }

  const positivePercentage = insights.totalSubmissions
    ? Math.round((insights.sentiment.positive / insights.totalSubmissions) * 100)
    : 0;
  const negativePercentage = insights.totalSubmissions
    ? Math.round((insights.sentiment.negative / insights.totalSubmissions) * 100)
    : 0;

  return (
    <div className="campus-insights-page">
      <header className="insights-page-header">
        <div>
          <span className="insights-eyebrow">CAMPUS VOICES, IN FOCUS</span>
          <h1>AI-Assisted Insights</h1>
          <p>Campus feedback trends based on submissions from students.</p>
        </div>
        <button className="insights-refresh-button" onClick={refreshInsights} disabled={refreshing}>
          <RefreshCw size={15} className={refreshing ? 'is-spinning' : ''} />
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </header>

      {error && (
        <div className="insights-error" role="alert">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      <section className="insights-metrics-grid" aria-label="Feedback summary metrics">
        <MetricCard
          icon={MessageSquare}
          label="Total feedback"
          value={insights.totalSubmissions}
          detail={formatCount(insights.totalSubmissions, 'submission')}
        />
        <MetricCard
          icon={Star}
          label="Overall average"
          value={insights.overallAverage === null ? '—' : insights.overallAverage.toFixed(2)}
          detail={insights.overallAverage === null ? 'No ratings yet' : 'out of 5'}
          highlight
        />
        <MetricCard
          icon={TrendingUp}
          label="Positive sentiment"
          value={`${positivePercentage}%`}
          detail={`${insights.sentiment.positive} indicators`}
        />
        <MetricCard
          icon={TrendingDown}
          label="Negative sentiment"
          value={`${negativePercentage}%`}
          detail={`${insights.sentiment.negative} indicators`}
        />
      </section>

      <section className="insights-top-grid">
        <SummaryCard insights={insights} />
        <SentimentCard insights={insights} />
      </section>

      <section className="insights-rankings-grid">
        <RankingCard
          title="Average by category"
          items={[...insights.categoryAverages].sort((a, b) => a.average - b.average)}
          kind="category"
        />
        <RankingCard
          title="Average by facility / location"
          items={[...insights.locationAverages].sort((a, b) => a.average - b.average)}
          kind="location"
        />
      </section>

      <section className="insights-bottom-grid">
        <ComplaintCard topics={insights.complaintTopics} />
        <section className="insights-card insights-about-card">
          <div className="insights-card-heading">
            <Brain size={17} />
            <h2>About these insights</h2>
          </div>
          <p>
            These insights summarize campus feedback submitted by students. The numbers show how many submissions were received,
            how students rated different areas, and which topics appeared most often in comments. Sentiment is estimated using
            simple keyword indicators and is not an AI-generated assessment.
          </p>
          <BarChart3 className="insights-about-icon" size={17} aria-hidden="true" />
        </section>
      </section>
    </div>
  );
}
