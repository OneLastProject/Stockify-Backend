const express = require("express");
const router = express.Router();
const validateRequest = require("../middleware/validateRequest");
const { registerUserSchema, loginUserSchema, updateUserSchema } = require("../validations/userValidation");
const {
  registerUser,
  loginUser,
  updateUser,
} = require("../controllers/userController");

router.post("/register", validateRequest(registerUserSchema), registerUser);
router.post("/login", validateRequest(loginUserSchema), loginUser);
router.put("/update-user", validateRequest(updateUserSchema), updateUser);

module.exports = router;