const STOP_WORDS = new Set([
  'about', 'after', 'again', 'also', 'and', 'because', 'been', 'being', 'could',
  'from', 'have', 'into', 'more', 'much', 'need', 'only', 'some', 'that',
  'their', 'there', 'these', 'they', 'this', 'very', 'were', 'which', 'with',
  'would', 'your', 'สำหรับ', 'และ', 'ที่', 'ของ', 'มี', 'ได้', 'ไม่', 'มาก'
]);

const POSITIVE_WORDS = new Set([
  'amazing', 'clean', 'convenient', 'excellent', 'fast', 'friendly', 'good',
  'great', 'helpful', 'improve', 'improved', 'nice', 'reliable', 'safe',
  'satisfied', 'สบาย', 'ดี', 'สะอาด', 'ชอบ'
]);

const NEGATIVE_WORDS = new Set([
  'bad', 'broken', 'complaint', 'crowded', 'dirty', 'expensive', 'late',
  'missing', 'noise', 'noisy', 'poor', 'problem', 'slow', 'unsafe', 'wait',
  'waiting', 'ขยะ', 'ช้า', 'เสีย', 'แพง', 'สกปรก'
]);

const toRatingValues = (review) => {
  if (!review?.ratings || typeof review.ratings !== 'object') {
    return [];
  }

  return Object.values(review.ratings)
    .map(Number)
    .filter((rating) => Number.isFinite(rating) && rating >= 1 && rating <= 5);
};

const average = (values) => {
  if (values.length === 0) {
    return null;
  }

  return values.reduce((total, value) => total + value, 0) / values.length;
};

const formatAverage = (values) => {
  const result = average(values);
  return result === null ? null : Number(result.toFixed(2));
};

const groupRatings = (reviews, field) => {
  const groups = new Map();

  reviews.forEach((review) => {
    const name = review?.[field];
    if (!name) {
      return;
    }

    const values = toRatingValues(review);
    if (values.length === 0) {
      return;
    }

    const current = groups.get(name) || { ratings: [], submissionCount: 0 };
    current.ratings.push(...values);
    current.submissionCount += 1;
    groups.set(name, current);
  });

  return Array.from(groups, ([name, group]) => ({
    name,
    average: formatAverage(group.ratings),
    submissionCount: group.submissionCount
  })).filter((group) => group.average !== null);
};

const getExtremes = (groups) => {
  if (groups.length === 0) {
    return { highest: null, lowest: null };
  }

  return {
    highest: groups.reduce((best, group) => group.average > best.average ? group : best),
    lowest: groups.reduce((worst, group) => group.average < worst.average ? group : worst)
  };
};

const getSentiment = (comment) => {
  const words = String(comment || '')
    .toLowerCase()
    .match(/[\p{L}\p{N}]+/gu) || [];
  const positive = words.filter((word) => POSITIVE_WORDS.has(word)).length;
  const negative = words.filter((word) => NEGATIVE_WORDS.has(word)).length;

  if (positive === 0 && negative === 0) {
    return 'neutral';
  }
  return positive > negative ? 'positive' : negative > positive ? 'negative' : 'neutral';
};

const getComplaintTopics = (reviews) => {
  const counts = new Map();

  reviews
    .filter((review) => getSentiment(review.comment) === 'negative')
    .forEach((review) => {
      const words = String(review.comment || '')
        .toLowerCase()
        .match(/[\p{L}\p{N}]+/gu) || [];

      Array.from(new Set(words))
        .filter((word) => word.length > 2 && !STOP_WORDS.has(word))
        .forEach((word) => counts.set(word, (counts.get(word) || 0) + 1));
    });

  return Array.from(counts, ([keyword, mentions]) => ({ keyword, mentions }))
    .sort((a, b) => b.mentions - a.mentions || a.keyword.localeCompare(b.keyword))
    .slice(0, 8);
};

export const analyzeFeedback = (reviews) => {
  const validReviews = Array.isArray(reviews) ? reviews : [];
  const allRatings = validReviews.flatMap(toRatingValues);
  const categoryAverages = groupRatings(validReviews, 'category');
  const locationAverages = groupRatings(validReviews, 'target');
  const sentiments = validReviews.reduce((result, review) => {
    const sentiment = getSentiment(review.comment);
    result[sentiment] += 1;
    return result;
  }, { positive: 0, negative: 0, neutral: 0 });
  const categoryExtremes = getExtremes(categoryAverages);
  const locationExtremes = getExtremes(locationAverages);

  return {
    totalSubmissions: validReviews.length,
    overallAverage: formatAverage(allRatings),
    categoryAverages,
    locationAverages,
    highestRatedCategory: categoryExtremes.highest,
    lowestRatedCategory: categoryExtremes.lowest,
    highestRatedLocation: locationExtremes.highest,
    lowestRatedLocation: locationExtremes.lowest,
    sentiment: sentiments,
    complaintTopics: getComplaintTopics(validReviews)
  };
};
