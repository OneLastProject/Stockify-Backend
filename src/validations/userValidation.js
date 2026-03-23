const Joi = require("joi");

// Validation schema for user registration
exports.registerUserSchema = Joi.object({
  name: Joi.string()
    .required()
    .trim()
    .min(2)
    .max(100)
    .messages({
      "string.empty": "Name cannot be empty",
      "string.required": "Name is required",
      "string.min": "Name must be at least 2 characters",
      "string.max": "Name must not exceed 100 characters"
    }),

  email: Joi.string()
    .email()
    .required()
    .trim()
    .lowercase()
    .messages({
      "string.email": "Please provide a valid email address",
      "string.required": "Email is required",
      "string.empty": "Email cannot be empty"
    }),

  password: Joi.string()
    .required()
    .min(6)
    .messages({
      "string.required": "Password is required",
      "string.min": "Password must be at least 6 characters",
      "string.empty": "Password cannot be empty"
    }),

  confirmPassword: Joi.string()
    .required()
    .valid(Joi.ref("password"))
    .messages({
      "string.required": "Confirm password is required",
      "string.empty": "Confirm password cannot be empty",
      "any.only": "Passwords do not match"
    })
});

// Validation schema for updating user
exports.updateUserSchema = Joi.object({
  name: Joi.string()
    .required()
    .trim()
    .min(2)
    .max(100)
    .messages({
      "string.empty": "Name cannot be empty",
      "string.required": "Name is required",
      "string.min": "Name must be at least 2 characters",
      "string.max": "Name must not exceed 100 characters"
    }),

  email: Joi.string()
    .email()
    .required()
    .trim()
    .lowercase()
    .messages({
      "string.email": "Please provide a valid email address",
      "string.required": "Email is required",
      "string.empty": "Email cannot be empty"
    }),

  password: Joi.string()
    .optional()
    .min(8)
    .messages({
      "string.min": "Password must be at least 8 characters",
      "string.empty": "Password cannot be empty"
    }),

  confirmPassword: Joi.string()
    .optional()
    .valid(Joi.ref("password"))
    .messages({
      "string.empty": "Confirm password cannot be empty",
      "any.only": "Passwords do not match"
    })
});

// Validation schema for user login
exports.loginUserSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .trim()
    .lowercase()
    .messages({
      "string.email": "Please provide a valid email address",
      "string.required": "Email is required",
      "string.empty": "Email cannot be empty"
    }),

  password: Joi.string()
    .required()
    .messages({
      "string.required": "Password is required",
      "string.empty": "Password cannot be empty"
    })
});
