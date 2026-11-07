// src/services/mockDb.js

const INITIAL_DATA = {
  feed: [
    {
      id: "1",
      category: "Dormitories",
      target: "F1 Dormitory",
      author: "Student A",
      ratings: { facility: 4, security: 5, electric: 3, cleanliness: 4, water: 4 },
      comment: "Water pressure is great, but electricity bill can be high in summer.",
      createdAt: "2026-11-01"
    },
    {
      id: "2",
      category: "Canteen",
      target: "M-Square",
      author: "Student B",
      ratings: { clean: 5, variety: 4, religious: 5, healthy: 3, delicious: 4 },
      comment: "Lots of options for everyone, good halal choices.",
      createdAt: "2026-11-03"
    }
  ]
};

export const getFeedItems = () => {
  const data = localStorage.getItem("campus_insights_db");
  return data ? JSON.parse(data).feed : INITIAL_DATA.feed;
};

export const addFeedItem = (newItem) => {
  const current = getFeedItems();
  const updated = [
    { id: Date.now().toString(), createdAt: new Date().toISOString().split('T')[0], ...newItem },
    ...current
  ];
  localStorage.setItem("campus_insights_db", JSON.stringify({ feed: updated }));
  return updated;
};