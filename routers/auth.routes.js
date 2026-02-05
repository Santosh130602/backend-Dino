
const express = require("express");
const router = express.Router();
const { signup, login } = require("../controllers/auth.controller");
const validate = require("../middleware/validate.middleware");
const { signupSchema, loginSchema } = require("../validators/auth.validator");
const { apiLimiter } = require("../middleware/rateLimit.middleware");


router.post("/signup", apiLimiter, validate(signupSchema), signup);
router.post("/login", apiLimiter, validate(loginSchema), login);

module.exports = router;
