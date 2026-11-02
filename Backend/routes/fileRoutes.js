const express = require("express");
const path = require("path");
const fs = require("fs");
const Appointment = require("../models/Appointment");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

const uploadDir = path.join(__dirname, "..", "uploads");

const CONTENT_TYPES = {
  ".pdf": "application/pdf",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
};

// GET /api/files/:filename
// Login undali. Aa file unna appointment di patient leda aa appointment di doctor ayithene isthundi.
router.get("/:filename", authMiddleware, async (req, res) => {
  try {
    const { filename } = req.params;

    // Manam generate chesina names ki matrame anumathi (path tricks block)
    if (!/^[A-Za-z0-9._-]+$/.test(filename) || filename.includes("..")) {
      return res.status(400).json({ message: "Invalid file name." });
    }

    const storedPath = `/uploads/${filename}`;

    // Ee file e appointment ki belong avtundo DB lo chustam
    const appointment = await Appointment.findOne({
      $or: [{ "reports.filePath": storedPath }, { "prescriptions.filePath": storedPath }],
    }).select("userId doctorId");

    if (!appointment) {
      return res.status(404).json({ message: "File not found." });
    }

    const requester = String(req.userId);
    const isPatient = String(appointment.userId) === requester;
    const isDoctor = String(appointment.doctorId) === requester;

    if (!isPatient && !isDoctor) {
      return res.status(403).json({ message: "You do not have access to this file." });
    }

    const absolutePath = path.join(uploadDir, filename);

    if (!fs.existsSync(absolutePath)) {
      return res.status(404).json({ message: "File not found." });
    }

    const type = CONTENT_TYPES[path.extname(filename).toLowerCase()];

    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Cache-Control", "private, no-store");

    if (type) {
      res.setHeader("Content-Type", type);
      res.setHeader("Content-Disposition", "inline");
    } else {
      // Paata files lo vere extension unte browser lo run avvakunda download ga matrame
      res.setHeader("Content-Type", "application/octet-stream");
      res.setHeader("Content-Disposition", "attachment");
    }

    res.sendFile(absolutePath);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

module.exports = router;