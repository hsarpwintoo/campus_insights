export const getReviewSummary = (reviews) => {
  const scores = reviews
    .filter((review) => review.ratings)
    .flatMap((review) => Object.values(review.ratings).map(Number))
    .filter((score) => Number.isFinite(score) && score >= 1 && score <= 5);
  return {
    count: reviews.length,
    average: scores.length ? scores.reduce((total, score) => total + score, 0) / scores.length : null
  };
};
