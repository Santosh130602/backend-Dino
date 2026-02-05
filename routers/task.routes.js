const express = require("express");
const router = express.Router();
const { completeTask } = require("../controllers/task.controller");
const {authenticate} = require("../middleware/auth.middleware");

router.post("/complete", authenticate, completeTask);

module.exports = router;



