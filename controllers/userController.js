const pool = require("../config/db");

const getProfile = async (req, res) => {
  try {
    const user = await pool.query(
      "SELECT id, full_name, email, username, profile_picture, created_at FROM users WHERE id = $1",
      [req.user.id]
    );

    if (user.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ user: user.rows[0] });
  } catch (error) {
    console.error("Profile fetch error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = { getProfile };
