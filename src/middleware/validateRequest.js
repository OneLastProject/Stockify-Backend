const fs = require("fs");

// Middleware to validate request data using Joi schemas
const validateRequest = (schema) => {
  return (req, res, next) => {
    console.log(`Validating request for ${req.method} ${req.path}`);

    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      console.log(error);

      if (req.file) fs.unlinkSync(req.file.path);

      const errorMessages = error.details.map((err) => ({
        field: err.path.join("."),
        message: err.message,
      }));

      return res.status(400).json({
        message: "Validation failed",
        errors: errorMessages,
      });
    }

    console.log("Validation passed");
    req.body = value;
    next();
  };
};

module.exports = validateRequest;
