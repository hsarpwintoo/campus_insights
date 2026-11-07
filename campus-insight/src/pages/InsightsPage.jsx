import React, { useEffect, useState } from 'react';
import { AlertCircle, BarChart3, Brain, MessageSquare, RefreshCw, Star, TrendingDown, TrendingUp } from 'lucide-react';
import { fetchFeedbacksFromFirestore } from '../services/firebaseDb';
import { analyzeFeedback } from '../services/insightsAnalyzer';

const cardStyle = {
  background: '#FFFFFF',
  padding: '1.5rem',
  borderRadius: '16px',
  border: '1px solid #E2E8F0',
  boxShadow: '0 4px 12px rgba(0,0,0,0.03)'
};

const formatScore = (score) => score === null ? '—' : `${score} / 5`;

function RankingList({ title, items, emptyText }) {
  return (
    <div style={cardStyle}>
      <h2 style={{ margin: '0 0 1.25rem 0', fontSize: '1.05rem', color: '#0F172A' }}>{title}</h2>
      {items.length === 0 ? (
        <p style={{ margin: 0, color: '#64748B', fontSize: '0.875rem' }}>{emptyText}</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
          {items.map((item) => (
            <div key={item.name}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', marginBottom: '0.35rem', fontSize: '0.875rem' }}>
                <strong style={{ color: '#334155' }}>{item.name}</strong>
                <span style={{ color: '#8B0000', fontWeight: '700' }}>{formatScore(item.average)}</span>
              </div>
              <div style={{ height: '7px', background: '#F1F5F9', borderRadius: '999px', overflow: 'hidden' }}>
                <div style={{ width: `${(item.average / 5) * 100}%`, height: '100%', background: '#8B0000', borderRadius: '999px' }} />
              </div>
              <span style={{ display: 'block', marginTop: '0.3rem', color: '#94A3B8', fontSize: '0.75rem' }}>
                {item.submissionCount} {item.submissionCount === 1 ? 'submission' : 'submissions'}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function InsightsPage() {
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadInsights = async () => {
    setLoading(true);
    setError('');

    try {
      const reviews = await fetchFeedbacksFromFirestore({ throwOnError: true });
      setInsights(analyzeFeedback(reviews));
    } catch (loadError) {
      console.error('Unable to load insights:', loadError);
      setInsights(null);
      setError('We could not load campus feedback right now. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInsights();
  }, []);

  if (loading) {
    return (
      <div style={{ ...cardStyle, maxWidth: '1000px', margin: '0 auto', textAlign: 'center', color: '#64748B' }}>
        Loading campus insights...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        <div style={{ ...cardStyle, textAlign: 'center' }}>
          <AlertCircle size={32} color="#B45309" />
          <h1 style={{ margin: '0.75rem 0 0.5rem', fontSize: '1.25rem', color: '#0F172A' }}>Insights are temporarily unavailable</h1>
          <p style={{ margin: '0 0 1.25rem', color: '#64748B' }}>{error}</p>
          <button onClick={loadInsights} style={{ border: 'none', borderRadius: '8px', padding: '0.7rem 1rem', background: '#8B0000', color: '#FFFFFF', fontWeight: '700', cursor: 'pointer' }}>
            <RefreshCw size={15} style={{ verticalAlign: 'middle', marginRight: '0.35rem' }} /> Try again
          </button>
        </div>
      </div>
    );
  }

  if (!insights || insights.totalSubmissions === 0) {
    return (
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        <PageHeader onRefresh={loadInsights} />
        <div style={{ ...cardStyle, textAlign: 'center', padding: '3rem 1.5rem' }}>
          <MessageSquare size={38} color="#8B0000" />
          <h2 style={{ margin: '1rem 0 0.5rem', color: '#0F172A' }}>No feedback available yet</h2>
          <p style={{ margin: 0, color: '#64748B' }}>Submit feedback to generate campus insights.</p>
        </div>
      </div>
    );
  }

  const sentimentTotal = Object.values(insights.sentiment).reduce((total, count) => total + count, 0);
  const highlightItems = [
    insights.highestRatedCategory && `Highest-rated category: ${insights.highestRatedCategory.name} (${formatScore(insights.highestRatedCategory.average)}).`,
    insights.lowestRatedCategory && `Lowest-rated category: ${insights.lowestRatedCategory.name} (${formatScore(insights.lowestRatedCategory.average)}).`,
    insights.highestRatedLocation && `Highest-rated location: ${insights.highestRatedLocation.name} (${formatScore(insights.highestRatedLocation.average)}).`,
    insights.lowestRatedLocation && `Lowest-rated location: ${insights.lowestRatedLocation.name} (${formatScore(insights.lowestRatedLocation.average)}).`,
    insights.complaintTopics.length > 0 && `Most frequent complaint keyword: "${insights.complaintTopics[0].keyword}" (${insights.complaintTopics[0].mentions} mention${insights.complaintTopics[0].mentions === 1 ? '' : 's'}).`,
    insights.overallAverage === null && 'Feedback is available, but no valid 1–5 ratings were found to calculate averages yet.'
  ].filter(Boolean);

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <PageHeader onRefresh={loadInsights} />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <MetricCard icon={MessageSquare} label="Total feedback" value={insights.totalSubmissions} />
        <MetricCard icon={Star} label="Overall average" value={formatScore(insights.overallAverage)} />
        <MetricCard icon={TrendingUp} label="Positive sentiment" value={`${Math.round((insights.sentiment.positive / sentimentTotal) * 100)}%`} />
        <MetricCard icon={TrendingDown} label="Negative sentiment" value={`${Math.round((insights.sentiment.negative / sentimentTotal) * 100)}%`} />
      </div>

      <section style={{ ...cardStyle, marginBottom: '1.5rem', borderLeft: '4px solid #8B0000' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem' }}>
          <BarChart3 size={20} color="#8B0000" />
          <h2 style={{ margin: 0, fontSize: '1.1rem', color: '#0F172A' }}>Data-derived summary</h2>
        </div>
        <ul style={{ margin: 0, paddingLeft: '1.25rem', color: '#475569', lineHeight: 1.8 }}>
          {highlightItems.map((highlight) => <li key={highlight}>{highlight}</li>)}
        </ul>
      </section>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
        <RankingList title="Average by category" items={insights.categoryAverages} emptyText="No category ratings available." />
        <RankingList title="Average by facility / location" items={insights.locationAverages} emptyText="No facility ratings available." />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
        <div style={cardStyle}>
          <h2 style={{ margin: '0 0 1.25rem', fontSize: '1.05rem', color: '#0F172A' }}>Sentiment indicators</h2>
          {Object.entries(insights.sentiment).map(([label, count]) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.6rem 0', borderBottom: '1px solid #F1F5F9', color: '#475569', textTransform: 'capitalize' }}>
              <span>{label}</span><strong style={{ color: '#0F172A' }}>{count}</strong>
            </div>
          ))}
          <p style={{ margin: '1rem 0 0', color: '#94A3B8', fontSize: '0.75rem' }}>Based on simple keyword indicators in submitted comments.</p>
        </div>

        <div style={cardStyle}>
          <h2 style={{ margin: '0 0 1.25rem', fontSize: '1.05rem', color: '#0F172A' }}>Frequently mentioned complaint topics</h2>
          {insights.complaintTopics.length === 0 ? (
            <p style={{ margin: 0, color: '#64748B', fontSize: '0.875rem' }}>No recurring complaint keywords found yet.</p>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {insights.complaintTopics.map((topic) => (
                <span key={topic.keyword} style={{ background: '#FFF5F5', color: '#8B0000', borderRadius: '999px', padding: '0.45rem 0.7rem', fontSize: '0.8rem', fontWeight: '700' }}>
                  {topic.keyword} · {topic.mentions}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <div style={{ ...cardStyle, marginTop: '1.5rem', background: '#F8FAFC' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <Brain size={20} color="#64748B" />
          <h2 style={{ margin: 0, fontSize: '1.05rem', color: '#334155' }}>AI-generated insights</h2>
        </div>
        <p style={{ margin: '0.75rem 0 0', color: '#64748B', fontSize: '0.875rem', lineHeight: 1.6 }}>
          AI-generated summaries are not connected yet. The statistics above are calculated directly from Firestore and provide the data foundation for a future approved AI service.
        </p>
      </div>
    </div>
  );
}

function PageHeader({ onRefresh }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
      <div>
        <h1 style={{ fontSize: '2.1rem', fontWeight: '800', margin: '0 0 0.4rem', color: '#0F172A', letterSpacing: '-0.02em' }}>AI-Assisted Insights</h1>
        <p style={{ color: '#475569', fontSize: '1rem', margin: 0, fontWeight: '500' }}>Campus feedback trends calculated from live Firestore data.</p>
      </div>
      <button onClick={onRefresh} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', border: '1px solid #CBD5E1', borderRadius: '8px', padding: '0.65rem 0.85rem', background: '#FFFFFF', color: '#475569', fontWeight: '700', cursor: 'pointer' }}>
        <RefreshCw size={15} /> Refresh
      </button>
    </div>
  );
}

function MetricCard({ icon: Icon, label, value }) {
  return (
    <div style={cardStyle}>
      <Icon size={20} color="#8B0000" />
      <div style={{ marginTop: '0.8rem', color: '#64748B', fontSize: '0.8rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</div>
      <div style={{ marginTop: '0.35rem', color: '#0F172A', fontSize: '1.7rem', fontWeight: '800' }}>{value}</div>
    </div>
  );
}
