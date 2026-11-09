import { ArrowLeft, GraduationCap, Mail, MapPin, Star } from 'lucide-react';
import { getReviewSummary } from './evaluationUtils';
import './styles/EvaluationPage.css';

export default function LecturerDetailPage({ school, lecturer, reviews, onBack, onEvaluate }) {
  const summary = getReviewSummary(reviews);

  return (
    <div className="evaluation-page">
      <button className="evaluation-back-button" type="button" onClick={onBack}><ArrowLeft size={16} /> Back to lecturers</button>
      <section className="lecturer-detail-card">
        <div className="lecturer-avatar"><GraduationCap size={27} /></div>
        <div className="lecturer-detail-content">
          <span className="evaluation-card-eyebrow">{school.name}</span>
          <h1>{lecturer.name}</h1>
          <p>{lecturer.title} · {lecturer.department}</p>
          <div className="lecturer-contact">
            <span><Mail size={15} />{lecturer.email}</span>
            <span><MapPin size={15} />Office {lecturer.office}</span>
          </div>
        </div>
      </section>

      <section className="lecturer-reviews-section">
        <div className="evaluation-section-heading">
          <div><span className="evaluation-card-eyebrow">LECTURER REVIEWS</span><h2>Student feedback</h2></div>
          <strong className="lecturer-average-rating"><Star size={16} fill="currentColor" />{summary.average === null ? 'No rating yet' : `${summary.average.toFixed(1)} / 5 (${summary.count})`}</strong>
        </div>
        {reviews.length === 0 ? <p className="evaluation-empty-reviews">No reviews yet. Be the first student to share feedback.</p> : (
          <div className="lecturer-review-list">
            {reviews.map((review) => (
              <article className="lecturer-review-card" key={review.id}>
                <div className="lecturer-review-card-topline"><strong>{review.author || 'MFU Student'}</strong></div>
                <span className="lecturer-review-rating"><Star size={14} fill="currentColor" /> {getReviewSummary([review]).average?.toFixed(1)} / 5</span>
                <p>{review.comment?.trim() || 'No written comment provided.'}</p>
              </article>
            ))}
          </div>
        )}
      </section>
      <button className="evaluation-submit-button" type="button" onClick={onEvaluate}>Evaluate</button>
    </div>
  );
}
