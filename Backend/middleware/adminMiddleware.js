const User = require("../models/User");

// authMiddleware tarvata vaadali (adi req.userId set chestundi)
async function adminMiddleware(req, res, next) {
  try {
    const user = await User.findById(req.userId).select("role");

    if (!user || user.role !== "admin") {
      return res.status(403).json({ message: "Access denied. Admins only." });
    }

    next();
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
}

module.exports = adminMiddleware;