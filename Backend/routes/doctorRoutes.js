const express = require("express");
const mongoose = require("mongoose");
const User = require("../models/User");
const Appointment = require("../models/Appointment");
const Review = require("../models/Review");
const authMiddleware = require("../middleware/authMiddleware");
const {
  getAvailability,
  hasCustomAvailability,
  buildSlots,
  toMinutes,
} = require("../utils/slots");

const router = express.Router();

const roundRating = (avg) => Math.round(avg * 10) / 10;

// Logged-in user doctor ayithene (availability routes kosam)
const requireDoctor = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);

    if (!user || user.role !== "doctor") {
      return res.status(403).json({ message: "Access denied. Doctors only." });
    }

    req.doctorDoc = user;
    next();
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// GET all APPROVED doctors (averageRating, reviewCount tho)
router.get("/", async (req, res) => {
  try {
    const doctors = await User.find({
      role: "doctor",
      verificationStatus: "approved",
    }).select("-password");

    const stats = await Review.aggregate([
      { $group: { _id: "$doctorId", avg: { $avg: "$rating" }, count: { $sum: 1 } } },
    ]);

    const statsById = {};
    stats.forEach((s) => {
      statsById[String(s._id)] = s;
    });

    const result = doctors.map((doc) => {
      const s = statsById[String(doc._id)];
      return {
        ...doc.toObject(),
        averageRating: s ? roundRating(s.avg) : 0,
        reviewCount: s ? s.count : 0,
      };
    });

    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// GET logged-in doctor's availability
// (/:id kante mundu undali, lekapothe "me" ni id anukuntundi)
router.get("/me/availability", authMiddleware, requireDoctor, (req, res) => {
  res.status(200).json({
    availability: getAvailability(req.doctorDoc),
    isDefault: !hasCustomAvailability(req.doctorDoc),
  });
});

// SAVE logged-in doctor's availability
router.put("/me/availability", authMiddleware, requireDoctor, async (req, res) => {
  try {
    const { days, startTime, endTime, slotMinutes, breakStart, breakEnd } = req.body;

    const timeRe = /^([01]\d|2[0-3]):[0-5]\d$/;
    const ALLOWED_SLOT_MINUTES = [10, 15, 20, 30, 45, 60];

    if (
      !Array.isArray(days) ||
      days.length === 0 ||
      !days.every((d) => Number.isInteger(d) && d >= 0 && d <= 6)
    ) {
      return res.status(400).json({ message: "Select at least one working day." });
    }

    if (!timeRe.test(startTime || "") || !timeRe.test(endTime || "")) {
      return res.status(400).json({ message: "Enter valid start and end times." });
    }

    if (toMinutes(startTime) >= toMinutes(endTime)) {
      return res.status(400).json({ message: "End time must be after start time." });
    }

    const step = Number(slotMinutes);
    if (!ALLOWED_SLOT_MINUTES.includes(step)) {
      return res.status(400).json({ message: "Invalid slot duration." });
    }

    if (toMinutes(endTime) - toMinutes(startTime) < step) {
      return res.status(400).json({
        message: "Working hours are shorter than one slot. Increase the hours or reduce the slot length.",
      });
    }

    const hasBreakStart = !!(breakStart || "").trim();
    const hasBreakEnd = !!(breakEnd || "").trim();

    if (hasBreakStart !== hasBreakEnd) {
      return res.status(400).json({
        message: "Enter both break start and break end, or leave both empty.",
      });
    }

    if (hasBreakStart) {
      if (!timeRe.test(breakStart) || !timeRe.test(breakEnd)) {
        return res.status(400).json({ message: "Enter valid break times." });
      }

      const bs = toMinutes(breakStart);
      const be = toMinutes(breakEnd);

      if (bs >= be) {
        return res.status(400).json({ message: "Break end must be after break start." });
      }

      if (bs < toMinutes(startTime) || be > toMinutes(endTime)) {
        return res.status(400).json({
          message: "The break must be within your working hours.",
        });
      }
    }

    const uniqueDays = [...new Set(days)].sort((a, b) => a - b);

    const updated = await User.findByIdAndUpdate(
      req.userId,
      {
        availability: {
          days: uniqueDays,
          startTime,
          endTime,
          slotMinutes: step,
          breakStart: hasBreakStart ? breakStart : "",
          breakEnd: hasBreakStart ? breakEnd : "",
        },
      },
      { new: true }
    );

    res.status(200).json({
      message: "Availability saved",
      availability: getAvailability(updated),
      isDefault: false,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// GET slots for a doctor on a date  (?date=YYYY-MM-DD)
router.get("/:id/slots", async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    const doctor = await User.findOne({
      _id: req.params.id,
      role: "doctor",
      verificationStatus: "approved",
    });

    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    const date = req.query.date;

    const booked = await Appointment.find({
      doctorId: doctor._id,
      appointmentDate: date,
      status: "Upcoming",
    }).select("appointmentTime");

    const result = buildSlots(
      doctor,
      date,
      booked.map((b) => b.appointmentTime)
    );

    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// GET single APPROVED doctor by ID (availability + rating tho)
router.get("/:id", async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    const doctor = await User.findOne({
      _id: req.params.id,
      role: "doctor",
      verificationStatus: "approved",
    }).select("-password");

    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    const stats = await Review.aggregate([
      { $match: { doctorId: doctor._id } },
      { $group: { _id: null, avg: { $avg: "$rating" }, count: { $sum: 1 } } },
    ]);

    res.status(200).json({
      ...doctor.toObject(),
      availability: getAvailability(doctor),
      averageRating: stats.length ? roundRating(stats[0].avg) : 0,
      reviewCount: stats.length ? stats[0].count : 0,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

module.exports = router;