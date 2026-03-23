const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/isAuth");
const { getHomeStats, getChartData } = require("../controllers/homeController");

router.get("/stats", authMiddleware, getHomeStats);
router.get("/chart", authMiddleware, getChartData);

module.exports = router;
