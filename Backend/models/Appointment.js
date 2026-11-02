const mongoose = require("mongoose");

// Reports mariyu prescriptions rendiki same file structure
const fileSchema = new mongoose.Schema({
  originalName: { type: String, required: true },
  filePath: { type: String, required: true },
  uploadedAt: { type: Date, default: Date.now },
});

const appointmentSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    doctorName: { type: String, required: true },
    specialization: { type: String, required: true },
    hospital: { type: String, required: true },
    patientName: { type: String, required: true },
    appointmentDate: { type: String, required: true },
    appointmentTime: { type: String, required: true },
    tokenNumber: { type: Number },
    status: { type: String, default: "Upcoming" },
    reports: [fileSchema],
    prescriptions: [fileSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Appointment", appointmentSchema);