import { useState } from 'react';
import {
  Building2,
  Bus,
  HeartPulse,
  EyeOff,
  Loader2,
  MapPin,
  Send,
  Star,
  Utensils
} from 'lucide-react';
import { saveFeedbackToFirestore } from '../services/firebaseDb';
import './styles/SubmitFeedbackPage.css';

const LOCATION_OPTIONS = {
  Dormitories: ['F1', 'F2', 'F3', 'F4', 'F5', 'S1', 'S2', 'S3', 'S4', 'S5', 'L1', 'L2', 'L3', 'L4', 'L5'],
  Canteen: ['M-Square', 'D1 Canteen', 'Lamduan Canteen', 'E1 Canteen', 'E2 Canteen'],
  Services: ['Shuttle Bus (Ngeap)', 'Library', 'Campus Wifi', 'Sports Center & General Facilities'],
  'Health Services': ['Inside Hospital', 'Student Health Clinic']
};

const CATEGORY_CRITERIA = {
  Dormitories: [
    { key: 'facility', label: 'Facility Quality' },
    { key: 'security', label: 'Security & Access' },
    { key: 'electric', label: 'Electricity & Utilities' },
    { key: 'cleanliness', label: 'Cleanliness & Hygiene' },
    { key: 'water', label: 'Water Pressure & Supply' }
  ],
  Canteen: [
    { key: 'clean', label: 'Hygiene & Cleanliness' },
    { key: 'variety', label: 'Food Variety' },
    { key: 'religious', label: 'Halal & Dietary Suitability' },
    { key: 'healthy', label: 'Healthy & Balanced Options' },
    { key: 'delicious', label: 'Taste & Preparation' }
  ],
  Services: [
    { key: 'service', label: 'Staff Service Standard' },
    { key: 'speed', label: 'Speed & Timeliness' },
    { key: 'facility', label: 'Infrastructure & Equipment' }
  ],
  'Health Services': [
    { key: 'clean', label: 'Facility Cleanliness' },
    { key: 'insurance', label: 'Insurance & Coverage' },
    { key: 'service', label: 'Medical Staff Service' },
    { key: 'facility', label: 'Equipment & Readiness' },
    { key: 'fees', label: 'Fee Transparency' }
  ]
};

const CATEGORIES = [
  { id: 'Dormitories', label: 'Dormitories', icon: Building2 },
  { id: 'Canteen', label: 'Canteens', icon: Utensils },
  { id: 'Services', label: 'Services & Wifi', icon: Bus },
  { id: 'Health Services', label: 'Health Services', icon: HeartPulse }
];

const createEmptyRatings = (category) => Object.fromEntries(
  CATEGORY_CRITERIA[category].map(({ key }) => [key, 0])
);

function StepHeading({ number, children }) {
  return (
    <div className="feedback-step-heading">
      <span>{number}</span>
      <h2>{children}</h2>
    </div>
  );
}

export default function SubmitFeedbackPage({ user, onSubmitted }) {
  const [category, setCategory] = useState('Dormitories');
  const [target, setTarget] = useState(LOCATION_OPTIONS.Dormitories[0]);
  const [ratings, setRatings] = useState(() => createEmptyRatings('Dormitories'));
  const [comment, setComment] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleCategorySelect = (newCategory) => {
    setCategory(newCategory);
    setTarget(LOCATION_OPTIONS[newCategory][0]);
    setRatings(createEmptyRatings(newCategory));
  };

  const handleRatingChange = (key, value) => {
    setRatings((previous) => ({ ...previous, [key]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    const missingRatings = CATEGORY_CRITERIA[category]
      .filter(({ key }) => !Number.isInteger(ratings[key]) || ratings[key] < 1 || ratings[key] > 5);
    if (missingRatings.length > 0) {
      setError('Please rate every category metric from 1 to 5 before submitting.');
      return;
    }

    setIsSubmitting(true);
    try {
      const authorName = isAnonymous
        ? 'Anonymous MFU Student'
        : user?.displayName || user?.email || 'MFU Student';

      await saveFeedbackToFirestore({
        category,
        target,
        author: authorName,
        userEmail: user?.email || null,
        isAnonymous,
        ratings,
        comment: comment.trim()
      });

      if (onSubmitted) {
        onSubmitted();
      } else {
        setSuccess('Your feedback has been submitted.');
      }
    } catch (submitError) {
      console.error('Unable to submit campus feedback:', submitError);
      setError('We could not submit your feedback. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="submit-feedback-page">
      <header className="submit-feedback-header">
        <span className="submit-feedback-eyebrow">YOUR CAMPUS. YOUR VOICE.</span>
        <h1>Submit Campus Feedback</h1>
        <p>Your evaluation directly contributes to improving Mae Fah Luang University infrastructure.</p>
      </header>

      <form className="submit-feedback-form" onSubmit={handleSubmit}>
        <div className="feedback-form-main">
          <section className="feedback-category-section">
            <StepHeading number="01">Select campus category</StepHeading>
            <div className="feedback-category-grid">
              {CATEGORIES.map(({ id, label, icon: Icon }) => {
                const isSelected = category === id;
                return (
                  <button
                    className={`feedback-category-option${isSelected ? ' is-selected' : ''}`}
                    key={id}
                    type="button"
                    onClick={() => handleCategorySelect(id)}
                    aria-pressed={isSelected}
                  >
                    <span className="feedback-category-option-top">
                      <Icon size={18} />
                      <span className="feedback-category-radio" />
                    </span>
                    <span>{label}</span>
                  </button>
                );
              })}
            </div>

            <div className="feedback-location-section">
              <StepHeading number="02">Specific location / facility</StepHeading>
              <label className="feedback-location-select">
                <MapPin size={17} aria-hidden="true" />
                <select
                  value={target}
                  onChange={(event) => setTarget(event.target.value)}
                  aria-label="Select specific location or facility"
                >
                  {LOCATION_OPTIONS[category].map((location) => (
                    <option key={location} value={location}>{location}</option>
                  ))}
                </select>
              </label>
            </div>
          </section>

          <section className="feedback-ratings-section">
            <StepHeading number="03">Detailed rating metrics</StepHeading>
            <p className="feedback-rating-instructions">How was your experience? Rate each area from 1 to 5.</p>
            <div className="feedback-rating-list">
              {CATEGORY_CRITERIA[category].map(({ key, label }) => {
                const score = ratings[key];
                return (
                  <div className="feedback-rating-row" key={key}>
                    <span className="feedback-rating-label">{label}</span>
                    <div className="feedback-star-controls" role="group" aria-label={`${label} rating`}>
                      {[1, 2, 3, 4, 5].map((value) => (
                        <button
                          key={value}
                          type="button"
                          className={`feedback-star-button${score >= value ? ' is-active' : ''}`}
                          onClick={() => handleRatingChange(key, value)}
                          aria-label={`Rate ${label} ${value} out of 5`}
                          aria-pressed={score === value}
                        >
                          <Star size={17} fill={score >= value ? 'currentColor' : 'none'} />
                        </button>
                      ))}
                    </div>
                    <span className={`feedback-rating-score${score === 0 ? ' is-unrated' : ''}`}>
                      {score === 0 ? 'Not rated' : `${score} / 5`}
                      {score > 0 && <span> Score</span>}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="feedback-rating-legend">
              <span>1 · Needs improvement</span>
              <span>5 · Excellent</span>
            </div>
          </section>
        </div>

        <section className="feedback-comment-section">
          <StepHeading number="04">Detailed comments</StepHeading>
          <label className="feedback-comment-label" htmlFor="campus-feedback-comment">
            Share any details that could help improve this campus service.
          </label>
          <textarea
            id="campus-feedback-comment"
            rows={3}
            maxLength={2000}
            placeholder="Write a review about facilities, food hygiene, bus schedules, or your experience..."
            value={comment}
            onChange={(event) => setComment(event.target.value)}
          />
          <span className="feedback-character-count">{comment.length} / 2000</span>
        </section>

        <div className="feedback-form-footer">
          <label className="feedback-anonymous-option">
            <input
              type="checkbox"
              checked={isAnonymous}
              onChange={(event) => setIsAnonymous(event.target.checked)}
            />
            <EyeOff size={16} aria-hidden="true" />
            <span>Post feedback anonymously (hide my name on Category Feed)</span>
          </label>
          <button className="feedback-publish-button" type="submit" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="feedback-button-spinner" size={16} /> : <Send size={16} />}
            {isSubmitting ? 'Submitting feedback...' : 'Submit Feedback'}
          </button>
        </div>
        {error && <p className="feedback-form-message" role="alert">{error}</p>}
        {success && <p className="feedback-form-message is-success" role="status">{success}</p>}
      </form>

    </div>
  );
}
