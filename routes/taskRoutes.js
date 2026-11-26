const express = require("express");
const jwtMiddleware = require("../middleware/jwtMiddleware");
const {
  create,
  index,
  show,
  update,
  deleteTask,
  bulkCreate,
} = require("../controllers/taskController");
const router = express.Router();
router.use(jwtMiddleware);
router.post("/", create);
router.get("/", index);
router.post("/bulk", bulkCreate);
router.get("/:id", show);
router.patch("/:id", update);
router.delete("/:id", deleteTask);

module.exports = router;
