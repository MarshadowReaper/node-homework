const express = require("express");

const userRoutes = require("./routes/userRoutes");
const notFound = require("./middleware/not-found");

const errorHandler = require("../week-3-middleware/middleware/error-handler");

const app = express();
global.user_id = null;
global.users = [];
global.tasks = [];
app.use(express.json());
app.use("/api/users", userRoutes);
app.use(notFound);
app.use(errorHandler);
const server = app.listen(3000);
module.exports = { app, server };
