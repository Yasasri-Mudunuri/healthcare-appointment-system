const express = require("express");
const fs = require("fs");
const mongoose = require("mongoose");
const Appointment = require("../models/Appointment");
const User = require("../models/User");
const authMiddleware = require("../middleware/authMiddleware");
const upload = require("../middleware/upload");
const { getNowLocal, buildSlots } = require("../utils/slots");

const router = express.Router();

// Aa doctor ki, aa date ki next token number (cancel ayina tokens kuda count avutayi, malli vaadaru)
const getNextToken = async (doctorId, appointmentDate) => {
  const last = await Appointment.findOne({ doctorId, appointmentDate }).sort({
    tokenNumber: -1,
  });
  return last && last.tokenNumber ? last.tokenNumber + 1 : 1;
};

// BOOK an appointment (patient, protected)
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { doctorId, patientName, appointmentDate, appointmentTime } = req.body;

    if (!mongoose.Types.ObjectId.isValid(doctorId)) {
      return res.status(400).json({ message: "Invalid doctor." });
    }

    // Approved doctor ki matrame booking. Doctor details DB nunchi teesukuntam (client pampindi nammam)
    const doctor = await User.findOne({
      _id: doctorId,
      role: "doctor",
      verificationStatus: "approved",
    });

    if (!doctor) {
      return res.status(404).json({
        message: "This doctor is not available for booking.",
      });
    }

    // Doctor availability slots batti validate
    const booked = await Appointment.find({
      doctorId: doctor._id,
      appointmentDate,
      status: "Upcoming",
    }).select("appointmentTime");

    const result = buildSlots(
      doctor,
      appointmentDate,
      booked.map((b) => b.appointmentTime)
    );

    if (result.closed) {
      return res.status(400).json({ message: result.message });
    }

    const slot = result.slots.find((s) => s.time === appointmentTime);

    if (!slot) {
      return res.status(400).json({
        message: "Please choose one of the doctor's available time slots.",
      });
    }

    if (slot.status === "booked") {
      return res.status(409).json({
        message: "This slot is already booked. Please choose another time.",
      });
    }

    if (slot.status === "past") {
      return res.status(400).json({
        message: "This time has already passed today. Please choose a later time.",
      });
    }

    const tokenNumber = await getNextToken(doctor._id, appointmentDate);

    const newAppointment = new Appointment({
      userId: req.userId,
      doctorId: doctor._id,
      doctorName: doctor.name,
      specialization: doctor.specialization,
      hospital: doctor.hospital,
      patientName,
      appointmentDate,
      appointmentTime,
      tokenNumber,
      status: "Upcoming",
    });

    await newAppointment.save();

    res.status(201).json({ message: "Appointment booked", appointment: newAppointment });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// GET logged-in PATIENT's appointments (patient, protected)
router.get("/my", authMiddleware, async (req, res) => {
  try {
    const appointments = await Appointment.find({ userId: req.userId }).sort({
      createdAt: -1,
    });
    res.status(200).json(appointments);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// UPLOAD a medical report to an appointment (patient, protected)
// Upcoming appointments ki matrame; Completed / Cancelled / date gadichipoyina vaatiki kaadu
router.post("/:id/reports", authMiddleware, (req, res) => {
  upload.single("report")(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ message: err.message });
    }

    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    // Multer already file ni save chesindi, reject chesthe delete cheyyali
    const rejectAndCleanup = (status, message) => {
      fs.unlink(req.file.path, () => {});
      return res.status(status).json({ message });
    };

    try {
      const appointment = await Appointment.findOne({
        _id: req.params.id,
        userId: req.userId,
      });

      if (!appointment) {
        return rejectAndCleanup(404, "Appointment not found");
      }

      if (appointment.status !== "Upcoming") {
        return rejectAndCleanup(
          400,
          "Reports can only be added to upcoming appointments."
        );
      }

      const { today } = getNowLocal();
      if (appointment.appointmentDate < today) {
        return rejectAndCleanup(
          400,
          "This appointment date has passed. Reports can no longer be added."
        );
      }

      appointment.reports.push({
        originalName: req.file.originalname,
        filePath: `/uploads/${req.file.filename}`,
      });

      await appointment.save();

      res.status(200).json({ message: "Report uploaded", appointment });
    } catch (error) {
      fs.unlink(req.file.path, () => {});
      res.status(500).json({ message: "Server error", error: error.message });
    }
  });
});

// UPLOAD a prescription to an appointment (doctor, protected)
// Anni conditions: aa doctor di appointment, status Upcoming, date ivala/gatinchindi, inka prescription ledu
router.post("/:id/prescriptions", authMiddleware, (req, res) => {
  upload.single("prescription")(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ message: err.message });
    }

    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const rejectAndCleanup = (status, message) => {
      fs.unlink(req.file.path, () => {});
      return res.status(status).json({ message });
    };

    try {
      const appointment = await Appointment.findOne({
        _id: req.params.id,
        doctorId: req.userId,
      });

      if (!appointment) {
        return rejectAndCleanup(404, "Appointment not found");
      }

      if (appointment.status === "Cancelled") {
        return rejectAndCleanup(
          400,
          "A prescription cannot be added to a cancelled appointment."
        );
      }

      if (appointment.status === "Completed") {
        return rejectAndCleanup(
          400,
          "This appointment is already completed. A prescription can only be added before marking it completed."
        );
      }

      if (appointment.prescriptions.length > 0) {
        return rejectAndCleanup(
          400,
          "A prescription has already been added for this appointment."
        );
      }

      const { today } = getNowLocal();
      if (appointment.appointmentDate > today) {
        return rejectAndCleanup(
          400,
          "A prescription can only be added on or after the appointment date."
        );
      }

      appointment.prescriptions.push({
        originalName: req.file.originalname,
        filePath: `/uploads/${req.file.filename}`,
      });

      await appointment.save();

      res.status(200).json({ message: "Prescription uploaded", appointment });
    } catch (error) {
      fs.unlink(req.file.path, () => {});
      res.status(500).json({ message: "Server error", error: error.message });
    }
  });
});

// CANCEL an appointment (patient, protected)
router.put("/:id/cancel", authMiddleware, async (req, res) => {
  try {
    const appointment = await Appointment.findOne({
      _id: req.params.id,
      userId: req.userId,
    });

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    appointment.status = "Cancelled";
    await appointment.save();

    res.status(200).json({ message: "Appointment cancelled", appointment });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// GET appointments for the LOGGED-IN DOCTOR (doctor, protected)
router.get("/doctor/my", authMiddleware, async (req, res) => {
  try {
    const appointments = await Appointment.find({
      doctorId: req.userId,
    }).sort({ createdAt: -1 });

    res.status(200).json(appointments);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Mark appointment as Completed (doctor, protected)
router.put("/:id/complete", authMiddleware, async (req, res) => {
  try {
    const appointment = await Appointment.findOne({
      _id: req.params.id,
      doctorId: req.userId,
    });

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    appointment.status = "Completed";
    await appointment.save();

    res.status(200).json({ message: "Appointment marked completed", appointment });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

module.exports = router;