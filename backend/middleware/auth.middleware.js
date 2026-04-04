require("dotenv").config();

const jwt = require("jsonwebtoken");
const validator = require("validator");

const authMiddleware = (req, res, next) => {
      try{
            const authHeader = req.headers.authorization;
      
            if(!authHeader){
                  return res.status(401).json({message : "Unauthorized access"});
            }
      
            const token = authHeader.split(" ")[1];
            if(!token){
                  return res.status(400).json({message : "Invalid token format"});
            }
      
            const decoded = jwt.verify(token,process.env.JWT_SECRET);
      
            req.user = decoded;
      
            next();

      }catch(error){
            return res.json(500).json({message : "Invalid or expired token"});
      }
}

const validateRegister = (req, res, next) => {
      const { full_name, email, password } = req.body;

      if (!full_name || !email || !password) {
            return res.status(400).json({ success: false, message: 'Please fill in enough information' });
      }

      if (password.length < 8) {
            return res.status(400).json({ success: false, message: 'Password must have at least 8 characters' });
      }

      if (email.length > 254) {
            return res.status(400).json({ success: false, message: 'Email is too long' });
      }

      if (!validator.isEmail(email)) {
            return res.status(400).json({ success: false, message: 'Invalid email' });
      }
      
      next();
};

module.exports = {authMiddleware, validateRegister};