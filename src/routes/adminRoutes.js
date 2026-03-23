const express = require("express");
const router = express.Router();
const { checkUserExists, changePassword } = require("../controllers/adminController");

router.post("/reset-password", checkUserExists);
router.post("/change-password", changePassword)

module.exports = router;