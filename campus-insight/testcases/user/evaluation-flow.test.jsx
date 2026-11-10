import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { saveReview } = vi.hoisted(() => ({
  saveReview: vi.fn()
}));

vi.mock('../../src/services/firebaseDb', () => ({
  subscribeToLecturerReviews: vi.fn(() => () => {}),
  syncLecturersToFirestore: vi.fn(() => Promise.resolve()),
  saveLecturerReviewToFirestore: saveReview
}));

vi.mock('../../src/services/advisingApi', () => ({
  fetchPartnerLecturer: vi.fn(),
  fetchPartnerSchoolLecturers: vi.fn(),
  fetchPartnerWeeklyAvailability: vi.fn()
}));

import EvaluationPage from '../../src/pages/EvaluationPage';
import LecturerDetailPage from '../../src/pages/LecturerDetailPage';
import LecturerEvaluationPage from '../../src/pages/LecturerEvaluationPage';
import { LECTURER_REVIEW_CRITERIA, LECTURER_SCHOOLS } from '../../src/data/lecturers';
import {
  fetchPartnerLecturer,
  fetchPartnerSchoolLecturers,
  fetchPartnerWeeklyAvailability
} from '../../src/services/advisingApi';

const school = LECTURER_SCHOOLS[0];
const lecturer = school.lecturers[0];

describe('student lecturer evaluation flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fetchPartnerLecturer.mockResolvedValue({
      uid: lecturer.id,
      name: 'Dr. Partner Profile',
      title: 'Professor',
      department: lecturer.department,
      email: lecturer.email,
      office: lecturer.office
    });
    fetchPartnerSchoolLecturers.mockResolvedValue([]);
    fetchPartnerWeeklyAvailability.mockResolvedValue([]);
    saveReview.mockResolvedValue({ id: 'review-1' });
  });

  it('displays all schools on the evaluation landing page', async () => {
    render(<EvaluationPage onSelectLecturer={vi.fn()} />);

    expect(await screen.findByRole('button', { name: /School of Management.*5 lecturers available/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /School of Applied Digital Technology.*5 lecturers available/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /School of Health Science.*5 lecturers available/ })).toBeInTheDocument();
  });

  it('shows five lecturers after selecting a school', async () => {
    const user = userEvent.setup();
    render(<EvaluationPage onSelectLecturer={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: /School of Management \(5\)/ }));

    expect(screen.getByRole('heading', { name: 'School of Management' })).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /Dr\.|Ms\.|Mr\./ })).toHaveLength(5);
  });

  it('passes the selected school, lecturer, and reviews to the detail callback', async () => {
    const user = userEvent.setup();
    const onSelectLecturer = vi.fn();
    render(<EvaluationPage onSelectLecturer={onSelectLecturer} />);

    await user.click(screen.getByRole('button', { name: /Dr\. Anan Chaiyasit/ }));

    expect(onSelectLecturer).toHaveBeenCalledWith(
      school,
      expect.objectContaining({ id: lecturer.id, name: lecturer.name }),
      []
    );
  });

  it('shows partner profile data and review state on lecturer details', async () => {
    render(
      <LecturerDetailPage
        school={school}
        lecturer={lecturer}
        reviews={[]}
        onBack={vi.fn()}
        onEvaluate={vi.fn()}
      />
    );

    expect(await screen.findByRole('heading', { name: 'Dr. Partner Profile' })).toBeInTheDocument();
    expect(screen.getByText('No reviews yet. Be the first student to share feedback.')).toBeInTheDocument();
    expect(screen.getByText('No available time has been published for today.')).toBeInTheDocument();
  });

  it('matches and displays weekly availability for the selected lecturer UID', async () => {
    fetchPartnerWeeklyAvailability.mockResolvedValue({
      data: [
        {
          lecturer: { uid: lecturer.id },
          weeklyAvailability: [
            { dayOfWeek: 1, startTime: '09:00', endTime: '10:30', timezone: 'Asia/Bangkok' }
          ]
        },
        {
          lecturer: { uid: 'another-lecturer' },
          weeklyAvailability: [{ dayOfWeek: 2, startTime: '13:00', endTime: '14:00' }]
        }
      ]
    });

    render(
      <LecturerDetailPage
        school={school}
        lecturer={lecturer}
        reviews={[]}
        onBack={vi.fn()}
        onEvaluate={vi.fn()}
      />
    );

    expect(await screen.findByText('Monday · 09:00 - 10:30')).toBeInTheDocument();
    expect(screen.getByText('Asia/Bangkok')).toBeInTheDocument();
    expect(screen.queryByText('13:00 - 14:00')).not.toBeInTheDocument();
  });

  it('falls back to campus details when the partner profile is unavailable', async () => {
    fetchPartnerLecturer.mockRejectedValue(new Error('partner unavailable'));
    fetchPartnerSchoolLecturers.mockRejectedValue(new Error('partner unavailable'));

    render(
      <LecturerDetailPage
        school={school}
        lecturer={lecturer}
        reviews={[]}
        onBack={vi.fn()}
        onEvaluate={vi.fn()}
      />
    );

    expect(await screen.findByText('Showing campus lecturer details. Partner data is temporarily unavailable.')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: lecturer.name })).toBeInTheDocument();
  });

  it('blocks submission until every evaluation category is rated', async () => {
    const user = userEvent.setup();
    render(<LecturerEvaluationPage user={{ email: 'student@mfu.ac.th' }} school={school} lecturer={lecturer} onBack={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: /Submit Evaluation/ }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Please rate every evaluation category');
    expect(saveReview).not.toHaveBeenCalled();
  });

  it('submits all five ratings and the comment successfully', async () => {
    const user = userEvent.setup();
    render(<LecturerEvaluationPage user={{ displayName: 'Test Student', email: 'student@mfu.ac.th' }} school={school} lecturer={lecturer} onBack={vi.fn()} />);

    for (const { label } of LECTURER_REVIEW_CRITERIA) {
      await user.click(screen.getByRole('button', { name: `Rate ${label} 5 out of 5` }));
    }
    await user.type(screen.getByRole('textbox', { name: /Additional comments/ }), 'Helpful and well prepared.');
    await user.click(screen.getByRole('button', { name: /Submit Evaluation/ }));

    await waitFor(() => expect(saveReview).toHaveBeenCalledWith(expect.objectContaining({
      schoolId: school.id,
      lecturerId: lecturer.id,
      comment: 'Helpful and well prepared.',
      author: 'Test Student',
      ratings: {
        teachingSkill: 5,
        preparation: 5,
        communication: 5,
        engagement: 5,
        fairness: 5
      }
    })));
    expect(await screen.findByRole('status')).toHaveTextContent('submitted');
  });

  it('filters lecturers by search text', async () => {
    const user = userEvent.setup();
    render(<EvaluationPage onSelectLecturer={vi.fn()} />);

    await user.type(screen.getByRole('searchbox', { name: 'Search lecturers' }), 'Thanawat');

    const cards = screen.getAllByRole('button', { name: /Dr\. Thanawat Saelim/ });
    expect(cards).toHaveLength(1);
    expect(within(cards[0]).getByText(/Software Engineering/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Dr\. Anan Chaiyasit/ })).not.toBeInTheDocument();
  });
});
