const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// Register lo anumathinche roles. "admin" ikkada ledu, admin ni script tho matrame create chestam
const ALLOWED_ROLES = ["patient", "doctor"];

// REGISTER
router.post("/register", async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      age,
      gender,
      address,
      password,
      role,
      specialization,
      hospital,
      experience,
      fee,
      licenseNumber,
    } = req.body;

    const safeRole = ALLOWED_ROLES.includes(role) ? role : "patient";

    if (safeRole === "doctor" && !(licenseNumber || "").trim()) {
      return res.status(400).json({
        message: "Medical Council registration number is required for doctors.",
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      role: safeRole,
      ...(safeRole === "doctor"
        ? {
            specialization,
            hospital,
            experience,
            fee,
            address,
            licenseNumber: licenseNumber.trim(),
            verificationStatus: "pending",
          }
        : { phone, age, gender }),
    });

    await newUser.save();

    if (safeRole === "doctor") {
      return res.status(201).json({
        message:
          "Registration submitted. Your account will be activated after admin verification.",
        requiresApproval: true,
      });
    }

    res.status(201).json({ message: "Registration successful" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// LOGIN
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid password" });
    }

    // Doctor verification check (password correct ayyaka matrame cheptam)
    if (user.role === "doctor") {
      if (user.verificationStatus === "pending") {
        return res.status(403).json({
          message:
            "Your account is awaiting admin approval. You can log in once it is approved.",
        });
      }

      if (user.verificationStatus === "rejected") {
        return res.status(403).json({
          message: `Your doctor account is not approved. Reason: ${
            user.rejectionReason || "Not specified"
          }`,
        });
      }
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        age: user.age,
        gender: user.gender,
        specialization: user.specialization,
        hospital: user.hospital,
        experience: user.experience,
        fee: user.fee,
        address: user.address,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// UPDATE PROFILE (protected)
router.put("/profile", authMiddleware, async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      age,
      gender,
      specialization,
      hospital,
      experience,
      fee,
      address,
    } = req.body;

    const updatedUser = await User.findByIdAndUpdate(
      req.userId,
      { name, email, phone, age, gender, specialization, hospital, experience, fee, address },
      { new: true }
    ).select("-password");

    res.status(200).json({ message: "Profile updated", user: updatedUser });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

module.exports = router;