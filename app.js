const express = require("express");
const helmet = require("helmet");
const rateLimiter = require("express-rate-limit");
const cookieParser = require("cookie-parser");
const userRoutes = require("./routes/userRoutes");
const notFound = require("./middleware/not-found");
const jwtMiddleware = require("./middleware/jwtMiddleware");
const taskRouter = require("./routes/taskRoutes");
const errorHandler = require("./middleware/error-handler");
const analyticsRoutes = require("./routes/analyticsRoutes");
const prisma = require("./db/prisma");
const app = express();
app.set("trust proxy", 1);
app.use(
  rateLimiter({
    windowMs: 15 * 60 * 1000,
    max: 100,
  }),
);

app.use(helmet());

app.use(express.json());
app.use(cookieParser());
app.get("/health", async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: "ok", db: "connected" });
  } catch (err) {
    res.status(500).json({
      status: "error",
      db: "not connected",
      error: err.message,
    });
  }
});

app.use("/api/users", userRoutes);
app.use("/api/tasks", taskRouter);
app.use("/api/analytics", jwtMiddleware, analyticsRoutes);
app.use(notFound);
app.use(errorHandler);

const server = app.listen(3000);
let isShuttingDown = false;

async function shutdown(code = 0) {
  if (isShuttingDown) return;

  isShuttingDown = true;

  console.log("Shutting down gracefully...");

  try {
    await new Promise((resolve, reject) => {
      server.close((err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    console.log("HTTP server closed.");

    await prisma.$disconnect();
    console.log("Prisma disconnected");
  } catch (err) {
    console.error("Error during shutdown:", err);
    code = 1;
  } finally {
    process.exit(code);
  }
}

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));
module.exports = { app, server };
