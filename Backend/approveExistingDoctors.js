const mongoose = require("mongoose");
require("dotenv").config();
const User = require("./models/User");

mongoose
  .connect(process.env.MONGO_URI)
  .then(async () => {
    const result = await User.updateMany(
      { role: "doctor", verificationStatus: { $exists: false } },
      { verificationStatus: "approved" }
    );

    console.log(`Existing doctors approved: ${result.modifiedCount} ✅`);
    mongoose.connection.close();
  })
  .catch((err) => console.log("Error:", err));