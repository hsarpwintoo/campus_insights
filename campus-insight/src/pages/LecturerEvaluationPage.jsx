import { useState } from 'react';
import { ArrowLeft, Send, Star } from 'lucide-react';
import { LECTURER_REVIEW_CRITERIA } from '../data/lecturers';
import { saveLecturerReviewToFirestore } from '../services/firebaseDb';
import './styles/EvaluationPage.css';

const emptyRatings = () => Object.fromEntries(LECTURER_REVIEW_CRITERIA.map(({ key }) => [key, 0]));

export default function LecturerEvaluationPage({ user, school, lecturer, onBack }) {
  const [ratings, setRatings] = useState(emptyRatings);
  const [comment, setComment] = useState('');
  const [status, setStatus] = useState({ type: '', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (LECTURER_REVIEW_CRITERIA.some(({ key }) => ratings[key] < 1)) {
      setStatus({ type: 'error', message: 'Please rate every evaluation category from 1 to 5.' });
      return;
    }
    setIsSubmitting(true);
    setStatus({ type: '', message: '' });
    try {
      await saveLecturerReviewToFirestore({ schoolId: school.id, schoolName: school.name, lecturerId: lecturer.id, lecturerName: lecturer.name, ratings, comment: comment.trim(), author: user?.displayName || user?.email || 'MFU Student', userEmail: user?.email || null });
      setRatings(emptyRatings());
      setComment('');
      setStatus({ type: 'success', message: 'Your lecturer evaluation has been submitted.' });
    } catch (error) {
      console.error('Unable to submit lecturer evaluation:', error);
      setStatus({ type: 'error', message: 'We could not submit your evaluation. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="evaluation-page">
      <button className="evaluation-back-button" type="button" onClick={onBack}><ArrowLeft size={16} /> Back to lecturer details</button>
      <header className="evaluation-header"><span className="evaluation-eyebrow">YOUR REVIEW</span><h1>Evaluate {lecturer.name}</h1><p>{school.name} · {lecturer.department}</p></header>
      <form className="evaluation-form" onSubmit={handleSubmit}>
        <div className="evaluation-form-heading"><h2>How was your experience?</h2><span className="evaluation-scale">1 = Needs improvement · 5 = Excellent</span></div>
        <div className="evaluation-rating-list">
          {LECTURER_REVIEW_CRITERIA.map(({ key, label }) => (
            <div className="evaluation-rating-row" key={key}><span>{label}</span><div className="evaluation-stars" role="group" aria-label={`${label} rating`}>{[1, 2, 3, 4, 5].map((value) => <button type="button" key={value} className={ratings[key] >= value ? 'is-active' : ''} onClick={() => setRatings((previous) => ({ ...previous, [key]: value }))} aria-label={`Rate ${label} ${value} out of 5`}><Star size={18} fill={ratings[key] >= value ? 'currentColor' : 'none'} /></button>)}</div><strong>{ratings[key] ? `${ratings[key]}/5` : 'Not rated'}</strong></div>
          ))}
        </div>
        <label className="evaluation-comment"><span>Additional comments <small>(optional)</small></span><textarea value={comment} onChange={(event) => setComment(event.target.value)} placeholder="Share a helpful comment about this lecturer..." rows="4" /></label>
        {status.message && <p className={`evaluation-status is-${status.type}`} role={status.type === 'error' ? 'alert' : 'status'}>{status.message}</p>}
        <button className="evaluation-submit-button" type="submit" disabled={isSubmitting}><Send size={16} />{isSubmitting ? 'Submitting...' : 'Submit Evaluation'}</button>
      </form>
    </div>
  );
}
