const crypto = require("crypto");
const util = require("util");
const scrypt = util.promisify(crypto.scrypt);
const { userSchema } = require("../validation/userSchema");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
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

async function register(req, res, next) {
  const { error, value } = userSchema.validate(req.body ?? {}, {
    abortEarly: false,
  });

  if (error) {
    return res.status(400).json({
      message: error.message,
    });
  }

  const hashedPassword = await hashPassword(value.password);

  let newUser = null;

  try {
    newUser = await prisma.user.create({
      data: {
        name: value.name,
        email: value.email,
        hashedPassword,
      },
      select: {
        name: true,
        email: true,
        id: true,
      },
    });
  } catch (err) {
    if (err.name === "PrismaClientKnownRequestError" && err.code === "P2002") {
      return res.status(400).json({
        message: "User already exists.",
      });
    } else {
      return next(err);
    }
  }

  global.user_id = newUser.id;

  return res.status(201).json({
    name: newUser.name,
    email: newUser.email,
  });
}

async function logon(req, res, next) {
  try {
    const { email, password } = req.body ?? {};

    if (typeof email !== "string" || typeof password !== "string") {
      return res.status(401).json({
        error: "Invalid credentials",
      });
    }

    const normalizedEmail = email.toLowerCase();

    const foundUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

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

    global.user_id = foundUser.id;

    return res.status(200).json({
      name: foundUser.name,
      email: foundUser.email,
    });
  } catch (err) {
    return next(err);
  }
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
