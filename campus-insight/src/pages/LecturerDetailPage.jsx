import { useEffect, useState } from 'react';
import { ArrowLeft, CalendarDays, GraduationCap, Loader2, Mail, MapPin, Star } from 'lucide-react';
import { getReviewSummary } from './evaluationUtils';
import { fetchPartnerLecturer, fetchPartnerLecturerAvailability, fetchPartnerSchoolLecturers } from '../services/advisingApi';
import './styles/EvaluationPage.css';

export default function LecturerDetailPage({ school, lecturer, reviews, onBack, onEvaluate }) {
  const summary = getReviewSummary(reviews);
  const schoolId = school.id;
  const [partnerLecturer, setPartnerLecturer] = useState(null);
  const [availability, setAvailability] = useState([]);
  const [isLoadingPartnerData, setIsLoadingPartnerData] = useState(true);
  const [isLoadingAvailability, setIsLoadingAvailability] = useState(true);
  const [partnerError, setPartnerError] = useState('');
  const [availabilityError, setAvailabilityError] = useState('');

  useEffect(() => {
    let isCurrent = true;

    fetchPartnerLecturer(lecturer.id)
      .then((data) => {
        if (isCurrent) setPartnerLecturer(data);
      })
      .catch((error) => {
        console.warn('Unable to load lecturer profile by UID:', error.message);
        return fetchPartnerSchoolLecturers(schoolId).then((lecturers) => {
          const partnerData = (Array.isArray(lecturers) ? lecturers : [])
            .find((entry) => entry.uid === lecturer.id || entry.id === lecturer.id);
          if (!partnerData) throw new Error('Lecturer UID was not found in the partner school response.');
          if (isCurrent) setPartnerLecturer(partnerData);
        });
      })
      .catch((error) => {
        console.warn('Unable to load partner lecturer details:', error.message);
        if (isCurrent) setPartnerError('Showing campus lecturer details. Partner data is temporarily unavailable.');
      })
      .finally(() => {
        if (isCurrent) setIsLoadingPartnerData(false);
      });

    return () => {
      isCurrent = false;
    };
  }, [lecturer.id, schoolId]);

  useEffect(() => {
    let isCurrent = true;
    fetchPartnerLecturerAvailability()
      .then((data) => {
        if (!isCurrent) return;
        const slots = data?.availability || data?.slots || data?.schedules || data;
        setAvailability(Array.isArray(slots) ? slots : []);
      })
      .catch((error) => {
        console.warn('Unable to load lecturer availability:', error.message);
        if (isCurrent) setAvailabilityError('Availability is temporarily unavailable.');
      })
      .finally(() => {
        if (isCurrent) setIsLoadingAvailability(false);
      });

    return () => {
      isCurrent = false;
    };
  }, []);

  const lecturerData = { ...lecturer, ...partnerLecturer };

  return (
    <div className="evaluation-page">
      <button className="evaluation-back-button" type="button" onClick={onBack}><ArrowLeft size={16} /> Back to lecturers</button>
      {isLoadingPartnerData && <p className="evaluation-data-status" role="status"><Loader2 size={15} className="evaluation-status-spinner" /> Loading lecturer details...</p>}
      {partnerError && <p className="evaluation-data-status is-fallback" role="status">{partnerError}</p>}
      <section className="lecturer-detail-card">
        <div className="lecturer-avatar"><GraduationCap size={27} /></div>
        <div className="lecturer-detail-content">
          <span className="evaluation-card-eyebrow">{lecturerData.schoolName || school.name}</span>
          <h1>{lecturerData.name}</h1>
          <p>{lecturerData.title} · {lecturerData.department}</p>
          <div className="lecturer-contact">
            <span><Mail size={15} />{lecturerData.email}</span>
            <span><MapPin size={15} />Office {lecturerData.office}</span>
          </div>
        </div>
      </section>
      <section className="lecturer-availability-section">
        <div className="evaluation-section-heading">
          <div><span className="evaluation-card-eyebrow">LECTURER AVAILABILITY</span><h2>Available time today</h2></div>
          <CalendarDays size={18} />
        </div>
        {isLoadingAvailability ? (
          <p className="evaluation-data-status" role="status"><Loader2 size={15} className="evaluation-status-spinner" /> Loading availability...</p>
        ) : availabilityError ? (
          <p className="evaluation-empty-reviews">{availabilityError}</p>
        ) : availability.length === 0 ? (
          <p className="evaluation-empty-reviews">No available time has been published for today.</p>
        ) : (
          <div className="lecturer-availability-list">
            {availability.map((slot, index) => (
              <div className="lecturer-availability-slot" key={slot.id || `${slot.date || 'today'}-${slot.time || slot.startTime || index}`}>
                <strong>{slot.time || `${slot.startTime || ''} - ${slot.endTime || ''}`}</strong>
                <span>{slot.status || 'Available'}</span>
              </div>
            ))}
          </div>
        )}
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
