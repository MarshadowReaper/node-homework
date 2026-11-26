const crypto = require("crypto");
const util = require("util");
const { randomUUID } = require("crypto");
const jwt = require("jsonwebtoken");
const scrypt = util.promisify(crypto.scrypt);
const { userSchema } = require("../validation/userSchema");
const prisma = require("../db/prisma");
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
const cookieFlags = (req) => {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production", // only when HTTPS is available
    sameSite: "Strict",
  };
};
const setJwtCookie = (req, res, user) => {
  // Sign JWT
  const payload = { id: user.id, csrfToken: randomUUID() };
  const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "1h" }); // 1 hour expiration
  // Set cookie.  Note that the cookie flags have to be different in production and in test.
  res.cookie("jwt", token, { ...cookieFlags(req), maxAge: 3600000 }); // 1 hour expiration
  return payload.csrfToken; // this is needed in the body returned by logon() or register()
};
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

  try {
    const result = await prisma.$transaction(async (tx) => {
      // Create user account (similar to Assignment 6, but using tx instead of prisma)
      const newUser = await tx.user.create({
        data: {
          email: value.email,
          name: value.name,
          hashedPassword,
        },
        select: { id: true, email: true, name: true },
      });

      const welcomeTaskData = [
        {
          title: "Complete your profile",
          userId: newUser.id,
          priority: "medium",
        },
        { title: "Add your first task", userId: newUser.id, priority: "high" },
        { title: "Explore the app", userId: newUser.id, priority: "low" },
      ];
      await tx.task.createMany({ data: welcomeTaskData });

      // Fetch the created tasks to return them
      const welcomeTasks = await tx.task.findMany({
        where: {
          userId: newUser.id,
          title: { in: welcomeTaskData.map((t) => t.title) },
        },
        select: {
          id: true,
          title: true,
          isCompleted: true,
          userId: true,
          priority: true,
        },
      });

      return { user: newUser, welcomeTasks };
    });

    const csrfToken = setJwtCookie(req, res, result.user);

    return res.status(201).json({
      user: {
        name: result.user.name,
        email: result.user.email,
      },
      csrfToken,
    });
  } catch (err) {
    console.error("Register transaction failed:", err);

    if (err.code === "P2002") {
      return res.status(400).json({
        error: "Email already registered",
      });
    }

    return next(err);
  }
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
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        hashedPassword: true,
      },
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

    const csrfToken = setJwtCookie(req, res, foundUser);

    return res.status(200).json({
      name: foundUser.name,
      email: foundUser.email,
      csrfToken,
    });
  } catch (err) {
    return next(err);
  }
}

// Log out the current user
function logoff(req, res) {
  res.clearCookie("jwt", cookieFlags(req));

  return res.status(200).json({
    message: "Logged off successfully",
  });
}

module.exports = {
  register,
  logon,
  logoff,
};
