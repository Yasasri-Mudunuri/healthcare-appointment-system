const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
require("dotenv").config();
const User = require("./models/User");

// Usage: node createAdmin.js <email> <password> "<name>"
const [, , email, password, name] = process.argv;

if (!email || !password) {
  console.log('Usage: node createAdmin.js <email> <password> "<name>"');
  process.exit(1);
}

mongoose
  .connect(process.env.MONGO_URI)
  .then(async () => {
    const existing = await User.findOne({ email });

    if (existing) {
      console.log(`A user with ${email} already exists (role: ${existing.role}). Use a different email.`);
    } else {
      const hashedPassword = await bcrypt.hash(password, 10);

      await User.create({
        name: name || "Admin",
        email,
        password: hashedPassword,
        role: "admin",
      });

      console.log(`Admin created: ${email} ✅`);
    }

    mongoose.connection.close();
  })
  .catch((err) => console.log("Error:", err));