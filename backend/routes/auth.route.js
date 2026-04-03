const express = require("express")
const router = express.Router()

const { login, register }= require("../controllers/auth.controller");
const { validateRegister } = require("../middleware/auth.middleware")

router.post("/login",login)
router.post("/register",validateRegister,register)

module.exports = router;