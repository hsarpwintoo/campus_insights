import { useEffect, useMemo, useState } from 'react';
import { GraduationCap, Star } from 'lucide-react';
import { LECTURER_SCHOOLS } from '../data/lecturers';
import { subscribeToLecturerReviews, syncLecturersToFirestore } from '../services/firebaseDb';
import { getReviewSummary } from './evaluationUtils';
import './styles/EvaluationPage.css';

export default function EvaluationPage({ onSelectLecturer }) {
  const [selectedSchoolId, setSelectedSchoolId] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => subscribeToLecturerReviews(setReviews, () => {
    setError('Reviews are temporarily unavailable.');
  }), []);

  useEffect(() => {
    syncLecturersToFirestore(LECTURER_SCHOOLS).catch(() => {
      setError('Lecturer data could not be synced. Please try again later.');
    });
  }, []);

  const reviewGroups = useMemo(() => reviews.reduce((groups, review) => {
    (groups[review.lecturerId] ||= []).push(review);
    return groups;
  }, {}), [reviews]);
  const school = LECTURER_SCHOOLS.find(({ id }) => id === selectedSchoolId);

  if (!school) {
    return (
      <div className="evaluation-page">
        <EvaluationHeader />
        {error && <p className="evaluation-status is-error" role="alert">{error}</p>}
        <SectionHeading eyebrow="STEP 1" title="Select a school" count={`${LECTURER_SCHOOLS.length} schools`} />
        <div className="school-card-grid">
          {LECTURER_SCHOOLS.map((entry) => (
            <button className="school-card" type="button" key={entry.id} onClick={() => setSelectedSchoolId(entry.id)}>
              <span className="school-card-icon"><GraduationCap size={24} /></span>
              <span className="school-card-content"><strong>{entry.name}</strong><small>{entry.lecturers.length} lecturers</small></span>
              <span className="school-card-arrow">→</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="evaluation-page">
      <EvaluationHeader />
      <button className="evaluation-back-button" type="button" onClick={() => setSelectedSchoolId(null)}>← All schools</button>
      <SectionHeading eyebrow={`STEP 2 · ${school.name}`} title="Select a lecturer" count={`${school.lecturers.length} lecturers`} />
      <div className="lecturer-card-grid">
        {school.lecturers.map((lecturer) => {
          const summary = getReviewSummary(reviewGroups[lecturer.id] || []);
          return (
            <button className="lecturer-card" type="button" key={lecturer.id} onClick={() => onSelectLecturer(school, lecturer, reviewGroups[lecturer.id] || [])}>
              <span className="lecturer-card-icon"><GraduationCap size={21} /></span>
              <span className="lecturer-card-content">
                <strong>{lecturer.name}</strong>
                <small>{lecturer.title} · {lecturer.department}</small>
                <span className="lecturer-card-rating"><Star size={14} fill="currentColor" />{summary.average === null ? 'No reviews yet' : `${summary.average.toFixed(1)} / 5 · ${summary.count} reviews`}</span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function EvaluationHeader() {
  return (
    <header className="evaluation-header">
      <span className="evaluation-eyebrow">STUDENT VOICE</span>
      <h1>Lecturer Evaluation</h1>
      <p>Choose a school and lecturer to view lecturer details and student feedback.</p>
    </header>
  );
}

function SectionHeading({ eyebrow, title, count }) {
  return (
    <div className="evaluation-section-heading">
      <div><span className="evaluation-card-eyebrow">{eyebrow}</span><h2>{title}</h2></div>
      <span>{count}</span>
    </div>
  );
}
