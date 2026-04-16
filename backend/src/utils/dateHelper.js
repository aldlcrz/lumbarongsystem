const { Op } = require('sequelize');

/**
 * Returns a starting Date object based on the requested range.
 * Defaults to current day at 00:00.
 */
exports.getRangeBounds = (range) => {
  const now = new Date();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);

  if (range === 'week') {
    const day = now.getDay();
    // Adjust to Monday as start of week (1), Sunday is 0
    start.setDate(now.getDate() - (day === 0 ? 6 : day - 1));
  } else if (range === 'month') {
    start.setDate(1);
  } else if (range === 'year') {
    start.setMonth(0, 1);
  }
  
  return start;
};
