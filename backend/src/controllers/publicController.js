const Subscriber = require('../models/Subscriber');
const asyncHandler = require('../middlewares/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');

const subscribe = asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) throw ApiError.badRequest('Email is required');

  const existing = await Subscriber.findOne({ email });
  if (existing) {
    return new ApiResponse(200, 'You are already subscribed!').send(res);
  }

  await Subscriber.create({ email });
  new ApiResponse(201, 'Successfully subscribed to newsletter!').send(res, 201);
});

module.exports = { subscribe };
