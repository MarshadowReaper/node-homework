const express = require("express");

const userRoutes = require("./routes/userRoutes");
const notFound = require("./middleware/not-found");
const authMiddleware = require("./middleware/auth");
const taskRouter = require("./routes/taskRoutes");
const errorHandler = require("./middleware/error-handler");

const app = express();
global.user_id = null;
global.users = [];
global.tasks = [];
app.use(express.json());
app.use("/api/users", userRoutes);
app.use("/api/tasks", authMiddleware, taskRouter);
app.use(notFound);
app.use(errorHandler);

const server = app.listen(3000);
module.exports = { app, server };
