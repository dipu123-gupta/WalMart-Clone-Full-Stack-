/**
 * Build pagination object from query params
 * @param {Object} query - Express req.query
 * @returns {{ page: number, limit: number, skip: number, sort: Object }}
 */
const buildPagination = (query) => {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 20));
  const skip = (page - 1) * limit;

  // Sort parsing: "price:asc,createdAt:desc" → { price: 1, createdAt: -1 }
  let sort = { createdAt: -1 }; // default: newest first
  if (query.sort) {
    sort = {};
    const sortFields = query.sort.split(',');
    sortFields.forEach((field) => {
      const [key, order] = field.split(':');
      sort[key.trim()] = order === 'asc' ? 1 : -1;
    });
  }

  return { page, limit, skip, sort };
};

/**
 * Build pagination meta for API response
 * @param {number} total - Total documents
 * @param {number} page - Current page
 * @param {number} limit - Page size
 */
const buildPaginationMeta = (total, page, limit) => ({
  page,
  limit,
  total,
  totalPages: Math.ceil(total / limit),
  hasNextPage: page * limit < total,
  hasPrevPage: page > 1,
});

module.exports = { buildPagination, buildPaginationMeta };
