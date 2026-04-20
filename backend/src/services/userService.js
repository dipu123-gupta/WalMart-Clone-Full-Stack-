const User = require('../models/User');
const Address = require('../models/Address');
const ApiError = require('../utils/ApiError');
const cloudinary = require('../config/cloudinary');
const { buildPagination, buildPaginationMeta } = require('../utils/pagination');

class UserService {
  /**
   * Get current user profile
   */
  async getProfile(userId) {
    const user = await User.findById(userId);
    if (!user) throw ApiError.notFound('User not found');
    return user;
  }

  /**
   * Update profile
   */
  async updateProfile(userId, updates) {
    const allowedFields = ['firstName', 'lastName', 'phone', 'preferences'];
    const filteredUpdates = {};
    for (const key of allowedFields) {
      if (updates[key] !== undefined) {
        filteredUpdates[key] = updates[key];
      }
    }

    // Check phone uniqueness
    if (filteredUpdates.phone) {
      const phoneExists = await User.findOne({
        phone: filteredUpdates.phone,
        _id: { $ne: userId },
      });
      if (phoneExists) throw ApiError.conflict('Phone number already in use');
    }

    const user = await User.findByIdAndUpdate(userId, filteredUpdates, {
      new: true,
      runValidators: true,
    });
    if (!user) throw ApiError.notFound('User not found');
    return user;
  }

  /**
   * Upload avatar
   */
  async updateAvatar(userId, file) {
    if (!file) throw ApiError.badRequest('Image file is required');

    const user = await User.findById(userId);
    if (!user) throw ApiError.notFound('User not found');

    // Delete old avatar from cloudinary
    if (user.avatar?.publicId) {
      await cloudinary.uploader.destroy(user.avatar.publicId).catch(() => {});
    }

    // Upload new avatar
    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: 'walmart/avatars',
          transformation: [
            { width: 200, height: 200, crop: 'fill', gravity: 'face' },
            { quality: 'auto', fetch_format: 'auto' },
          ],
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      stream.end(file.buffer);
    });

    user.avatar = { url: result.secure_url, publicId: result.public_id };
    await user.save();
    return user;
  }

  // ===== Address Management =====

  async getAddresses(userId) {
    return Address.find({ userId }).sort({ isDefault: -1, createdAt: -1 });
  }

  async addAddress(userId, data) {
    const count = await Address.countDocuments({ userId });
    if (count >= 10) throw ApiError.badRequest('Maximum 10 addresses allowed');

    // Set as default if first address
    if (count === 0) data.isDefault = true;

    const address = await Address.create({ ...data, userId });
    return address;
  }

  async updateAddress(userId, addressId, data) {
    const address = await Address.findOne({ _id: addressId, userId });
    if (!address) throw ApiError.notFound('Address not found');

    Object.assign(address, data);
    await address.save();
    return address;
  }

  async deleteAddress(userId, addressId) {
    const address = await Address.findOneAndDelete({ _id: addressId, userId });
    if (!address) throw ApiError.notFound('Address not found');

    // If deleted address was default, set another as default
    if (address.isDefault) {
      const nextDefault = await Address.findOne({ userId }).sort({ createdAt: -1 });
      if (nextDefault) {
        nextDefault.isDefault = true;
        await nextDefault.save();
      }
    }
    return { message: 'Address deleted' };
  }

  async setDefaultAddress(userId, addressId) {
    const address = await Address.findOne({ _id: addressId, userId });
    if (!address) throw ApiError.notFound('Address not found');

    // Unset all defaults, then set this one
    await Address.updateMany({ userId }, { isDefault: false });
    address.isDefault = true;
    await address.save();
    return address;
  }

  // ===== Admin: User Management =====

  async getAllUsers(query) {
    const { page, limit, skip, sort } = buildPagination(query);
    const filter = {};

    if (query.role) filter.role = query.role;
    if (query.isActive !== undefined) filter.isActive = query.isActive === 'true';
    if (query.search) {
      filter.$or = [
        { firstName: new RegExp(query.search, 'i') },
        { lastName: new RegExp(query.search, 'i') },
        { email: new RegExp(query.search, 'i') },
      ];
    }

    const [users, total] = await Promise.all([
      User.find(filter).sort(sort).skip(skip).limit(limit),
      User.countDocuments(filter),
    ]);

    return { users, meta: buildPaginationMeta(total, page, limit) };
  }

  async updateUserStatus(userId, { isActive }) {
    const user = await User.findByIdAndUpdate(
      userId,
      { isActive },
      { new: true }
    );
    if (!user) throw ApiError.notFound('User not found');
    return user;
  }

  async updateUserRole(userId, { role }) {
    const user = await User.findByIdAndUpdate(
      userId,
      { role },
      { new: true, runValidators: true }
    );
    if (!user) throw ApiError.notFound('User not found');
    return user;
  }
}

module.exports = new UserService();
