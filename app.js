const express = require("express");

const userRoutes = require("./routes/userRoutes");
const notFound = require("./middleware/not-found");
const authMiddleware = require("./middleware/auth");
const taskRouter = require("./routes/taskRoutes");
const errorHandler = require("./middleware/error-handler");
const pool = require("./db/pg-pool");
const prisma = require("./db/prisma");
const app = express();
global.user_id = null;

app.use(express.json());
app.get("/health", async (req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ status: "ok", db: "connected" });
  } catch (err) {
    res.status(500).json({
      message: `db not connected, error: ${err.message}`,
    });
  }
});
app.use("/api/users", userRoutes);
app.use("/api/tasks", authMiddleware, taskRouter);
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
