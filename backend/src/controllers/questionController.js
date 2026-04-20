const Question = require('../models/Question');
const asyncHandler = require('../middlewares/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');

const askQuestion = asyncHandler(async (req, res) => {
  const { productId, question } = req.body;
  const newQuestion = await Question.create({
    productId,
    userId: req.user._id,
    question
  });
  new ApiResponse(201, 'Question posted', newQuestion).send(res, 201);
});

const getProductQuestions = asyncHandler(async (req, res) => {
  const questions = await Question.find({ productId: req.params.productId, isPublic: true })
    .populate('userId', 'firstName lastName')
    .populate('answer.answeredBy', 'firstName lastName role')
    .sort({ createdAt: -1 });
  new ApiResponse(200, 'Questions fetched', questions).send(res);
});

const answerQuestion = asyncHandler(async (req, res) => {
  const question = await Question.findById(req.params.id);
  if (!question) throw ApiError.notFound('Question not found');

  question.answer = {
    text: req.body.answer,
    answeredBy: req.user._id,
    answeredAt: new Date()
  };
  await question.save();
  
  new ApiResponse(200, 'Answer posted', question).send(res);
});

module.exports = { askQuestion, getProductQuestions, answerQuestion };
