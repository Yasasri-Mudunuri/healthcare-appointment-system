const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    // Prathi appointment ki okate review (unique)
    appointmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Appointment",
      required: true,
      unique: true,
    },
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    reviewerName: { type: String, required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, default: "", maxlength: 500 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Review", reviewSchema);