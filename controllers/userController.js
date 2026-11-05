const crypto = require("crypto");
const util = require("util");
const scrypt = util.promisify(crypto.scrypt);
const { userSchema } = require("../validation/userSchema");
const pool = require("../db/pg-pool");
async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const derivedKey = await scrypt(password, salt, 64);
  return `${salt}:${derivedKey.toString("hex")}`;
}

async function comparePassword(inputPassword, storedHash) {
  if (typeof inputPassword !== "string" || typeof storedHash !== "string") {
    return false;
  }

  const [salt, key] = storedHash.split(":");

  if (!salt || !key || !/^[a-f0-9]{128}$/i.test(key)) {
    return false;
  }

  const keyBuffer = Buffer.from(key, "hex");
  const derivedKey = await scrypt(inputPassword, salt, 64);

  return crypto.timingSafeEqual(keyBuffer, derivedKey);
}
0;
async function register(req, res) {
  const { error, value } = userSchema.validate(req.body ?? {}, {
    abortEarly: false,
  });

  if (error) {
    return res.status(400).json({
      message: error.message,
    });
  }

  const hashedPassword = await hashPassword(value.password);

  try {
    const result = await pool.query(
      `INSERT INTO users (email, name, hashed_password)
       VALUES ($1, $2, $3)
       RETURNING id, email, name`,
      [value.email, value.name, hashedPassword],
    );

    const newUser = result.rows[0];

    global.user_id = newUser.id;

    return res.status(201).json({
      name: newUser.name,
      email: newUser.email,
    });
  } catch (err) {
    if (err.code === "23505") {
      return res.status(400).json({
        message: "User already exists.",
      });
    }

    throw err;
  }
}

async function logon(req, res) {
  const { email, password } = req.body;

  const result = await pool.query("SELECT * FROM users WHERE email = $1", [
    email,
  ]);

  if (result.rows.length === 0) {
    return res.status(401).json({
      error: "Invalid credentials",
    });
  }

  const foundUser = result.rows[0];

  const goodCredentials = await comparePassword(
    password,
    foundUser.hashed_password,
  );

  if (!goodCredentials) {
    return res.status(401).json({
      error: "Invalid credentials",
    });
  }

  global.user_id = foundUser.id;

  return res.status(200).json({
    name: foundUser.name,
    email: foundUser.email,
  });
}

// Log out the current user
function logoff(req, res) {
  global.user_id = null;

  return res.status(200).json({ message: "Logged off successfully" });
}

module.exports = {
  register,
  logon,
  logoff,
};
