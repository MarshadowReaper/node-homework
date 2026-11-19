const express = require("express");
const {
  getUsersWithStats,
  getUserAnalytics,
  searchTasks,
} = require("../controllers/analyticsController");

const router = express.Router();
router.get("/users/:id", getUserAnalytics);
router.get("/users", getUsersWithStats);
router.get("/tasks/search", searchTasks);
module.exports = router;
