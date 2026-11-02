const express = require("express");
const mongoose = require("mongoose");
const Review = require("../models/Review");
const Appointment = require("../models/Appointment");
const User = require("../models/User");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// POST a review for a COMPLETED appointment (patient, protected)
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { appointmentId } = req.body;
    const rating = Number(req.body.rating);
    const comment = (req.body.comment || "").trim();

    if (!mongoose.Types.ObjectId.isValid(appointmentId)) {
      return res.status(400).json({ message: "Invalid appointment." });
    }

    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({ message: "Rating must be between 1 and 5." });
    }

    if (comment.length > 500) {
      return res.status(400).json({
        message: "Comment must be 500 characters or fewer.",
      });
    }

    // Aa patient di appointment ayithene
    const appointment = await Appointment.findOne({
      _id: appointmentId,
      userId: req.userId,
    });

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found." });
    }

    // Doctor Completed ani mark chesaka matrame
    if (appointment.status !== "Completed") {
      return res.status(400).json({
        message: "You can review a doctor only after the appointment is completed.",
      });
    }

    const user = await User.findById(req.userId).select("name");
    const reviewerName = ((user && user.name) || "Patient").trim().split(" ")[0];

    const review = await Review.create({
      appointmentId: appointment._id,
      doctorId: appointment.doctorId,
      patientId: req.userId,
      reviewerName,
      rating,
      comment,
    });

    res.status(201).json({ message: "Review submitted", review });
  } catch (error) {
    // Unique index: already reviewed
    if (error.code === 11000) {
      return res.status(409).json({
        message: "You have already reviewed this appointment.",
      });
    }

    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// GET logged-in patient's reviews (appointments lo "Your review" chupinchadaniki)
router.get("/my", authMiddleware, async (req, res) => {
  try {
    const reviews = await Review.find({ patientId: req.userId }).select(
      "appointmentId rating comment createdAt"
    );

    res.status(200).json(reviews);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// GET reviews received by the logged-in doctor (doctor, protected)
router.get("/received", authMiddleware, async (req, res) => {
  try {
    const doctor = await User.findById(req.userId).select("role");

    if (!doctor || doctor.role !== "doctor") {
      return res.status(403).json({ message: "Access denied. Doctors only." });
    }

    const stats = await Review.aggregate([
      { $match: { doctorId: doctor._id } },
      { $group: { _id: null, avg: { $avg: "$rating" }, count: { $sum: 1 } } },
    ]);

    const reviews = await Review.find({ doctorId: doctor._id })
      .sort({ createdAt: -1 })
      .select("appointmentId rating comment reviewerName createdAt");

    res.status(200).json({
      averageRating: stats.length ? Math.round(stats[0].avg * 10) / 10 : 0,
      reviewCount: stats.length ? stats[0].count : 0,
      reviews,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// GET reviews + summary for one approved doctor (public)
router.get("/doctor/:id", async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    const doctor = await User.findOne({
      _id: req.params.id,
      role: "doctor",
      verificationStatus: "approved",
    }).select("_id");

    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    const stats = await Review.aggregate([
      { $match: { doctorId: doctor._id } },
      { $group: { _id: null, avg: { $avg: "$rating" }, count: { $sum: 1 } } },
    ]);

    const reviews = await Review.find({ doctorId: doctor._id })
      .sort({ createdAt: -1 })
      .limit(50)
      .select("rating comment reviewerName createdAt");

    res.status(200).json({
      averageRating: stats.length ? Math.round(stats[0].avg * 10) / 10 : 0,
      reviewCount: stats.length ? stats[0].count : 0,
      reviews,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

module.exports = router;