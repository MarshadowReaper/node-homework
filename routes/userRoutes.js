const express = require("express");
const { logon, register, logoff } = require("./controllers/userController");
const router = express.Router();

router.post("/register", register);
router.post("/logon", logon);
router.post("/logoff", logoff);

module.exports = router;
