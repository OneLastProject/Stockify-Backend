const fs = require("fs");
const Product = require("../models/productSchema");
const { updateQuantitySchema } = require("../validations/productValidation");

const validateUpdateQuantity = async (req, res, next) => {
  const product = await Product.findById(req.params.id);
  if (!product) {
    return res.status(404).json({ message: "Product not found" });
  }

  const { error, value } = updateQuantitySchema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true,
    context: { availableUnits: product.unit },
  });

  if (error) {
    const errorMessages = error.details.map((err) => ({
      field: err.path.join("."),
      message: err.message,
    }));
    return res.status(400).json({ message: errorMessages[0].message, errors: errorMessages });
  }

  req.body = value;
  req.product = product;
  next();
};

module.exports = validateUpdateQuantity;
