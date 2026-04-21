const userService = require('../services/userService');
const asyncHandler = require('../middlewares/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');

const getProfile = asyncHandler(async (req, res) => {
  const user = await userService.getProfile(req.user._id);
  new ApiResponse(200, 'Profile fetched', user).send(res);
});

const updateProfile = asyncHandler(async (req, res) => {
  const user = await userService.updateProfile(req.user._id, req.body);
  new ApiResponse(200, 'Profile updated', user).send(res);
});

const updateAvatar = asyncHandler(async (req, res) => {
  const user = await userService.updateAvatar(req.user._id, req.file);
  new ApiResponse(200, 'Avatar updated', user).send(res);
});

// Address endpoints
const getAddresses = asyncHandler(async (req, res) => {
  const addresses = await userService.getAddresses(req.user._id);
  new ApiResponse(200, 'Addresses fetched', addresses).send(res);
});

const addAddress = asyncHandler(async (req, res) => {
  const address = await userService.addAddress(req.user._id, req.body);
  new ApiResponse(201, 'Address added', address).send(res, 201);
});

const updateAddress = asyncHandler(async (req, res) => {
  const address = await userService.updateAddress(req.user._id, req.params.id, req.body);
  new ApiResponse(200, 'Address updated', address).send(res);
});

const deleteAddress = asyncHandler(async (req, res) => {
  await userService.deleteAddress(req.user._id, req.params.id);
  new ApiResponse(200, 'Address deleted').send(res);
});

const setDefaultAddress = asyncHandler(async (req, res) => {
  const address = await userService.setDefaultAddress(req.user._id, req.params.id);
  new ApiResponse(200, 'Default address set', address).send(res);
});

// Admin endpoints
const getAllUsers = asyncHandler(async (req, res) => {
  const { users, meta } = await userService.getAllUsers(req.query);
  new ApiResponse(200, 'Users fetched', { users }, meta).send(res);
});

const updateUserStatus = asyncHandler(async (req, res) => {
  const user = await userService.updateUserStatus(req.params.id, req.body);
  new ApiResponse(200, 'User status updated', user).send(res);
});

const updateUserRole = asyncHandler(async (req, res) => {
  const user = await userService.updateUserRole(req.params.id, req.body);
  new ApiResponse(200, 'User role updated', user).send(res);
});

module.exports = {
  getProfile, updateProfile, updateAvatar,
  getAddresses, addAddress, updateAddress, deleteAddress, setDefaultAddress,
  getAllUsers, updateUserStatus, updateUserRole,
};
