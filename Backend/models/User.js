const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String },
  age: { type: Number },
  gender: { type: String },
  address: { type: String },
  password: { type: String, required: true },

  role: { type: String, enum: ["patient", "doctor", "admin"], default: "patient" },

  specialization: { type: String },
  hospital: { type: String },
  experience: { type: String },
  fee: { type: Number },

  // Doctor verification
  licenseNumber: { type: String },
  // Default "approved" (seed script mariyu patients kosam). Kotha doctor registration lo register route daanini "pending" ga set chestundi.
  verificationStatus: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "approved",
  },
  rejectionReason: { type: String },

  // Doctor availability (doctor set cheyyakapothe utils/slots.js lo default vaadatam)
  availability: {
    days: [{ type: Number }], // 0 = Sunday ... 6 = Saturday
    startTime: { type: String }, // "HH:MM"
    endTime: { type: String },
    slotMinutes: { type: Number },
    breakStart: { type: String },
    breakEnd: { type: String },
  },
});

module.exports = mongoose.model("User", userSchema);