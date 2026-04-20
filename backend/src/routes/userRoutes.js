const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticate } = require('../middlewares/authMiddleware');
const { authorize } = require('../middlewares/roleMiddleware');
const { uploadImage } = require('../middlewares/uploadMiddleware');
const { ROLES } = require('../constants/roles');

// User profile routes (authenticated)
router.get('/me', authenticate, userController.getProfile);
router.patch('/me', authenticate, userController.updateProfile);
router.patch('/me/avatar', authenticate, uploadImage.single('avatar'), userController.updateAvatar);

// Address routes (authenticated)
router.get('/me/addresses', authenticate, userController.getAddresses);
router.post('/me/addresses', authenticate, userController.addAddress);
router.patch('/me/addresses/:id', authenticate, userController.updateAddress);
router.delete('/me/addresses/:id', authenticate, userController.deleteAddress);
router.patch('/me/addresses/:id/default', authenticate, userController.setDefaultAddress);

module.exports = router;
