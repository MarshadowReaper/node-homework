function errorHandler(err, req, res, next) {
  console.error(err);
  if (err.name === "PrismaClientInitializationError") {
    console.error("Couldn't connect to the database. Is it running?");
  }
  if (err.code === "ECONNREFUSED" && err.port === 5432) {
    console.error("The database service might not be running.");
  }

  res.status(500).json({
    message: "Internal server error.",
  });
}

module.exports = errorHandler;
