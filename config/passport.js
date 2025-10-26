const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const pool = require("./db");

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: "http://localhost:5500/api/auth/google/callback"
}, async (accessToken, refreshToken, profile, done) => {
  try {
    const existingUser = await pool.query(
      "SELECT * FROM users WHERE google_id = $1 OR email = $2",
      [profile.id, profile.emails[0].value]
    );

    if (existingUser.rows.length > 0) {
      return done(null, existingUser.rows[0]);
    }

    const newUser = await pool.query(`
      INSERT INTO users (full_name, email, google_id, profile_picture, username)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [
      profile.displayName,
      profile.emails[0].value,
      profile.id,
      profile.photos[0].value,
      profile.emails[0].value.split("@")[0]
    ]);

    return done(null, newUser.rows[0]);
  } catch (err) {
    return done(err, null);
  }
}));

passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
  try {
    const user = await pool.query("SELECT * FROM users WHERE id = $1", [id]);
    done(null, user.rows[0]);
  } catch (err) {
    done(err, null);
  }
});
