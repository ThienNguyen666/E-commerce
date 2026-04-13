const express = require("express")
const router = express.Router()

const { login, register }= require("../controllers/auth.controller");
const { validateRegister } = require("../middleware/auth.middleware")
const { authLimiter } = require("../middleware/rate_limiters.middleware");

router.post("/login", authLimiter, login)
router.post("/register", authLimiter, validateRegister, register)

module.exports = router;