const Joi = require("joi");

exports.updateQuantitySchema = Joi.object({
  units: Joi.number()
    .required()
    .positive()
    .custom((value, helpers) => {
      const { availableUnits } = helpers.prefs.context || {};
      if (availableUnits !== undefined && value > availableUnits) {
        return helpers.error("units.exceedsAvailable");
      }
      return value;
    })
    .messages({
      "number.base": "Units must be a number",
      "number.positive": "Units must be greater than 0",
      "any.required": "Units is required",
      "units.exceedsAvailable": "Cannot buy more units than available",
    }),
});

exports.addProductSchema = Joi.object({
  name: Joi.string()
    .required()
    .trim()
    .min(2)
    .max(100)
    .messages({
      "string.empty": "Name cannot be empty",
      "any.required": "Name is required",
      "string.min": "Name must be at least 2 characters",
      "string.max": "Name must not exceed 100 characters",
    }),

  productId: Joi.string()
    .required()
    .trim()
    .messages({
      "string.empty": "Product ID cannot be empty",
      "any.required": "Product ID is required",
    }),

  category: Joi.string()
    .required()
    .trim()
    .messages({
      "string.empty": "Category cannot be empty",
      "any.required": "Category is required",
    }),

  price: Joi.number()
    .required()
    .positive()
    .messages({
      "number.base": "Price must be a number",
      "number.positive": "Price must be greater than 0",
      "any.required": "Price is required",
    }),

  quantity: Joi.string()
    .required()
    .trim()
    .messages({
      "string.empty": "Quantity cannot be empty",
      "any.required": "Quantity is required",
    }),

  unit: Joi.number()
    .required()
    .min(0)
    .messages({
      "number.base": "Unit must be a number",
      "number.min": "Unit cannot be negative",
      "any.required": "Unit is required",
    }),

  expiryDate: Joi.date()
    .required()
    .messages({
      "date.base": "Expiry date must be a valid date",
      "any.required": "Expiry date is required",
    }),

  thresholdValue: Joi.number()
    .required()
    .min(0)
    .max(Joi.ref('unit'))
    .messages({
      "number.base": "Threshold value must be a number",
      "number.min": "Threshold value cannot be negative",
      "number.max": "Threshold value cannot exceed available units",
      "any.required": "Threshold value is required",
    }),
});
