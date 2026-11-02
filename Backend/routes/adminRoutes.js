const express = require("express");
const mongoose = require("mongoose");
const User = require("../models/User");
const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");

const router = express.Router();

// Ee routes anni admin ki matrame
router.use(authMiddleware, adminMiddleware);

// GET all doctors (pending, approved, rejected anni)
router.get("/doctors", async (req, res) => {
  try {
    const doctors = await User.find({ role: "doctor" })
      .select("-password")
      .sort({ _id: -1 });

    res.status(200).json(doctors);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// APPROVE a doctor
router.put("/doctors/:id/approve", async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid doctor id" });
    }

    const doctor = await User.findOneAndUpdate(
      { _id: req.params.id, role: "doctor" },
      { verificationStatus: "approved", rejectionReason: "" },
      { new: true }
    ).select("-password");

    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    res.status(200).json({ message: "Doctor approved", doctor });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// REJECT (leda revoke) a doctor, reason tho
router.put("/doctors/:id/reject", async (req, res) => {
  try {
    const reason = (req.body.reason || "").trim();

    if (!reason) {
      return res.status(400).json({ message: "Please provide a reason." });
    }

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid doctor id" });
    }

    const doctor = await User.findOneAndUpdate(
      { _id: req.params.id, role: "doctor" },
      { verificationStatus: "rejected", rejectionReason: reason },
      { new: true }
    ).select("-password");

    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    res.status(200).json({ message: "Doctor rejected", doctor });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

module.exports = router;