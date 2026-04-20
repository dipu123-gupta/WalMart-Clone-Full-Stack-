const { validate, rules } = require('../middlewares/validator');

const registerValidation = validate({
  firstName: [rules.required(), rules.minLength(2), rules.maxLength(50)],
  lastName: [rules.required(), rules.minLength(2), rules.maxLength(50)],
  email: [rules.required(), rules.email()],
  password: [rules.required(), rules.isStrongPassword()],
});

const loginValidation = validate({
  email: [rules.required(), rules.email()],
  password: [rules.required()],
});

const verifyOtpValidation = validate({
  email: [rules.required(), rules.email()],
  otp: [rules.required(), rules.minLength(6), rules.maxLength(6)],
});

const forgotPasswordValidation = validate({
  email: [rules.required(), rules.email()],
});

const resetPasswordValidation = validate({
  password: [rules.required(), rules.isStrongPassword()],
});

const changePasswordValidation = validate({
  currentPassword: [rules.required()],
  newPassword: [rules.required(), rules.isStrongPassword()],
});

const googleAuthValidation = validate({
  idToken: [rules.required()],
});

const resendOtpValidation = validate({
  email: [rules.required(), rules.email()],
});

module.exports = {
  registerValidation,
  loginValidation,
  verifyOtpValidation,
  forgotPasswordValidation,
  resetPasswordValidation,
  changePasswordValidation,
  googleAuthValidation,
  resendOtpValidation,
};
