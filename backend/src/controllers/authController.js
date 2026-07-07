const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { User } = require("../models");
const { isAllowedEmail, allowedEmailMessage } = require("../utils/allowedEmail");

const signToken = (user) =>
  jwt.sign({ userId: user.id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });

  const register = async (req, res) => {
    try {
      const { name, email, password } = req.body;
  
      if (!name || !email || !password) {
        return res.status(400).json({
          message: "Name, email and password are required",
        });
      }
  
      // Allow only approved email addresses/domains
      if (!isAllowedEmail(email)) {
        return res.status(403).json({
          message: allowedEmailMessage,
        });
      }
  
      const exists = await User.findOne({ where: { email } });
      if (exists) {
        return res.status(409).json({
          message: "Email already in use",
        });
      }
  
      const passwordHash = await bcrypt.hash(password, 10);
  
      const user = await User.create({
        name,
        email,
        passwordHash,
      });
  
      const token = signToken(user);
  
      return res.status(201).json({
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        message: "Failed to register",
      });
    }
  };

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ where: { email } });
    console.log("user", user);

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = signToken(user);
    return res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to login" });
  }
};

const me = async (req, res) => {
  return res.json({
    user: {
      id: req.user.id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
    },
  });
};

module.exports = { register, login, me };
