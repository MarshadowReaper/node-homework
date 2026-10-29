const crypto = require("crypto");
const util = require("util");
const scrypt = util.promisify(crypto.scrypt);
const { userSchema } = require("../validation/userSchema");
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
async function register(req, res) {
  console.log("Request body:", req.body);
  const { error, value } = userSchema.validate(req.body ?? {}, {
    abortEarly: false,
  });

  if (error) {
    return res.status(400).json({
      message: error.message,
    });
  }

  const existingUser = global.users.find((user) => user.email === value.email);

  if (existingUser) {
    return res.status(400).json({
      message: "User already exists.",
    });
  }

  const hashedPassword = await hashPassword(value.password);

  const newUser = {
    name: value.name,
    email: value.email,
    hashedPassword,
  };

  global.users.push(newUser);
  global.user_id = newUser;

  return res.status(201).json({
    name: newUser.name,
    email: newUser.email,
  });
}

async function logon(req, res) {
  const { email, password } = req.body;

  const foundUser = global.users.find((user) => user.email === email);

  if (!foundUser) {
    return res.status(401).json({
      error: "Invalid credentials",
    });
  }

  const goodCredentials = await comparePassword(
    password,
    foundUser.hashedPassword,
  );

  if (!goodCredentials) {
    return res.status(401).json({
      error: "Invalid credentials",
    });
  }

  global.user_id = foundUser;

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

// Export the three controller functions
module.exports = {
  register,
  logon,
  logoff,
};
