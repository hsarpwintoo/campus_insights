import { useEffect, useMemo, useState } from 'react';
import {
  ArrowUpDown,
  GraduationCap,
  Mail,
  MapPin,
  Search,
  Star,
  Users,
  X
} from 'lucide-react';
import { LECTURER_SCHOOLS } from '../data/lecturers';
import { subscribeToLecturerReviews, syncLecturersToFirestore } from '../services/firebaseDb';
import { getReviewSummary } from './evaluationUtils';
import './styles/EvaluationPage.css';

export default function EvaluationPage({ onSelectLecturer }) {
  const [selectedSchoolId, setSelectedSchoolId] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [error, setError] = useState('');

  // Search & Sorting state
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('default'); // 'default' | 'highest_rated' | 'most_reviews' | 'name_asc'

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

  // Flatten all lecturers across all schools with school reference
  const allLecturers = useMemo(() => {
    return LECTURER_SCHOOLS.flatMap((school) =>
      school.lecturers.map((lecturer) => ({
        ...lecturer,
        school
      }))
    );
  }, []);

  // Compute metrics for every lecturer
  const lecturersWithMetrics = useMemo(() => {
    return allLecturers.map((lecturer) => ({
      ...lecturer,
      summary: getReviewSummary(reviewGroups[lecturer.id] || [])
    }));
  }, [allLecturers, reviewGroups]);

  // Filtered & Sorted lecturers
  const filteredAndSortedLecturers = useMemo(() => {
    let list = lecturersWithMetrics;

    // Filter by selected school if specified
    if (selectedSchoolId) {
      list = list.filter((item) => item.school.id === selectedSchoolId);
    }

    // Filter by search query (name, department, office room number, email, school name)
    const query = searchQuery.trim().toLowerCase();
    if (query) {
      list = list.filter((item) => {
        const textToSearch = [
          item.name,
          item.department,
          item.office,
          item.title,
          item.email,
          item.school.name
        ].filter(Boolean).join(' ').toLowerCase();
        return textToSearch.includes(query);
      });
    }

    // Apply sorting
    if (sortBy === 'highest_rated') {
      list = [...list].sort((a, b) => {
        const avgA = a.summary.average ?? -1;
        const avgB = b.summary.average ?? -1;
        if (avgB !== avgA) return avgB - avgA;
        return b.summary.count - a.summary.count;
      });
    } else if (sortBy === 'most_reviews') {
      list = [...list].sort((a, b) => {
        if (b.summary.count !== a.summary.count) return b.summary.count - a.summary.count;
        const avgA = a.summary.average ?? -1;
        const avgB = b.summary.average ?? -1;
        return avgB - avgA;
      });
    } else if (sortBy === 'name_asc') {
      list = [...list].sort((a, b) => a.name.localeCompare(b.name));
    }

    return list;
  }, [lecturersWithMetrics, selectedSchoolId, searchQuery, sortBy]);

  const school = LECTURER_SCHOOLS.find(({ id }) => id === selectedSchoolId);
  const isGlobalMode = Boolean(searchQuery.trim() || sortBy !== 'default');

  return (
    <div className="evaluation-page">
      <EvaluationHeader />
      {error && <p className="evaluation-status is-error" role="alert">{error}</p>}

      {/* Search & Sort Controls Bar */}
      <div className="evaluation-controls-bar">
        {/* Search Input */}
        <div className="evaluation-search-box">
          <Search size={17} className="evaluation-search-icon" aria-hidden="true" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search lecturer by name, department, or office (e.g., Thanawat, E3A-401)..."
            aria-label="Search lecturers"
            className="evaluation-search-input"
          />
          {searchQuery && (
            <button
              type="button"
              className="evaluation-search-clear"
              onClick={() => setSearchQuery('')}
              aria-label="Clear search query"
            >
              <X size={15} />
            </button>
          )}
        </div>

        {/* Sort Dropdown */}
        <div className="evaluation-sort-group">
          <ArrowUpDown size={15} className="evaluation-sort-icon" />
          <select
            className="evaluation-sort-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            aria-label="Sort lecturers"
          >
            <option value="default">Default Order</option>
            <option value="highest_rated">Highest Rated</option>
            <option value="most_reviews">Most Reviews</option>
            <option value="name_asc">Name (A → Z)</option>
          </select>
        </div>
      </div>

      {/* School Filter Pills */}
      <nav className="evaluation-school-pills" aria-label="Filter lecturers by school">
        <button
          type="button"
          className={`evaluation-school-pill${selectedSchoolId === null ? ' is-active' : ''}`}
          onClick={() => setSelectedSchoolId(null)}
        >
          <Users size={13} />
          <span>All Schools </span>
        </button>

        {LECTURER_SCHOOLS.map((entry) => (
          <button
            type="button"
            key={entry.id}
            className={`evaluation-school-pill${selectedSchoolId === entry.id ? ' is-active' : ''}`}
            onClick={() => setSelectedSchoolId(entry.id)}
          >
            <GraduationCap size={13} />
            <span>{entry.name} ({entry.lecturers.length})</span>
          </button>
        ))}
      </nav>

      {/* Main View Area */}
      {/* CASE A: No search, default sort, and on 'All Schools' overview -> Show School Cards + Lecturer Preview */}
      {!selectedSchoolId && !isGlobalMode ? (
        <>
          <SectionHeading
            eyebrow="BROWSE BY SCHOOL"
            title="Select a School or Explore All Lecturers"
            count={`${LECTURER_SCHOOLS.length} schools · ${allLecturers.length} lecturers`}
          />
          <div className="school-card-grid">
            {LECTURER_SCHOOLS.map((entry) => (
              <button
                className="school-card"
                type="button"
                key={entry.id}
                onClick={() => setSelectedSchoolId(entry.id)}
              >
                <span className="school-card-icon"><GraduationCap size={24} /></span>
                <span className="school-card-content">
                  <strong>{entry.name}</strong>
                  <small>{entry.lecturers.length} lecturers available</small>
                </span>
                <span className="school-card-arrow">→</span>
              </button>
            ))}
          </div>

          <div className="evaluation-all-lecturers-divider">
            <SectionHeading
              eyebrow="ALL LECTURERS"
              title="All Faculty Members"
              count={`${filteredAndSortedLecturers.length} lecturers`}
            />
          </div>

          <div className="lecturer-card-grid">
            {filteredAndSortedLecturers.map((lecturer) => (
              <LecturerCardItem
                key={lecturer.id}
                lecturer={lecturer}
                onSelectLecturer={onSelectLecturer}
                reviewGroups={reviewGroups}
              />
            ))}
          </div>
        </>
      ) : (
        /* CASE B: Specific school selected OR search/sort active -> Show matching lecturer grid */
        <>
          <div className="evaluation-results-header">
            {selectedSchoolId && !isGlobalMode && (
              <button
                className="evaluation-back-button"
                type="button"
                onClick={() => setSelectedSchoolId(null)}
              >
                ← All schools
              </button>
            )}

            <SectionHeading
              eyebrow={
                searchQuery.trim()
                  ? `SEARCH RESULTS FOR "${searchQuery.trim()}"`
                  : selectedSchoolId
                  ? school?.name.toUpperCase()
                  : 'SORTED LECTURERS'
              }
              title={
                searchQuery.trim()
                  ? `Matching Lecturers`
                  : selectedSchoolId
                  ? `${school?.name}`
                  : `All Lecturers (${sortBy === 'highest_rated' ? 'Highest Rated' : sortBy === 'most_reviews' ? 'Most Reviews' : 'Name A-Z'})`
              }
              count={`${filteredAndSortedLecturers.length} ${filteredAndSortedLecturers.length === 1 ? 'lecturer' : 'lecturers'}`}
            />
          </div>

          {filteredAndSortedLecturers.length === 0 ? (
            <div className="evaluation-empty-results">
              <Users size={32} className="evaluation-empty-icon" />
              <h3>No lecturers found</h3>
              <p>
                No faculty members matched <strong>&ldquo;{searchQuery}&rdquo;</strong>. Try searching by first or last name, department, or office room number (e.g. E3A-401).
              </p>
              <button
                type="button"
                className="evaluation-clear-search-btn"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedSchoolId(null);
                  setSortBy('default');
                }}
              >
                Reset Search &amp; Filters
              </button>
            </div>
          ) : (
            <div className="lecturer-card-grid">
              {filteredAndSortedLecturers.map((lecturer) => (
                <LecturerCardItem
                  key={lecturer.id}
                  lecturer={lecturer}
                  onSelectLecturer={onSelectLecturer}
                  reviewGroups={reviewGroups}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function LecturerCardItem({ lecturer, onSelectLecturer, reviewGroups }) {
  const summary = lecturer.summary;

  return (
    <button
      className="lecturer-card"
      type="button"
      onClick={() =>
        onSelectLecturer(lecturer.school, lecturer, reviewGroups[lecturer.id] || [])
      }
    >
      <span className="lecturer-card-icon">
        <GraduationCap size={21} />
      </span>
      <span className="lecturer-card-content">
        <div className="lecturer-card-name-row">
          <strong>{lecturer.name}</strong>
          <span className="lecturer-school-tag">{lecturer.school.name}</span>
        </div>
        <small className="lecturer-dept-line">
          {lecturer.title} · {lecturer.department}
        </small>

        <div className="lecturer-card-badges">
          {lecturer.office && (
            <span className="lecturer-badge-item lecturer-office-badge">
              <MapPin size={11} />
              Office {lecturer.office}
            </span>
          )}
          {lecturer.email && (
            <span className="lecturer-badge-item lecturer-email-badge">
              <Mail size={11} />
              {lecturer.email}
            </span>
          )}
        </div>

        <span className="lecturer-card-rating">
          <Star size={14} fill="currentColor" />
          {summary.average === null
            ? 'No reviews yet'
            : `${summary.average.toFixed(1)} / 5 · ${summary.count} reviews`}
        </span>
      </span>
    </button>
  );
}

function EvaluationHeader() {
  return (
    <header className="evaluation-header">
      <span className="evaluation-eyebrow">STUDENT VOICE</span>
      <h1>Lecturer Evaluation</h1>
      <p>Search any lecturer across MFU schools, sort by ratings, and view feedback.</p>
    </header>
  );
}

function SectionHeading({ eyebrow, title, count }) {
  return (
    <div className="evaluation-section-heading">
      <div>
        <span className="evaluation-card-eyebrow">{eyebrow}</span>
        <h2>{title}</h2>
      </div>
      <span>{count}</span>
    </div>
  );
}
