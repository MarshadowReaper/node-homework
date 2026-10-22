function errorHandler(err, req, res) {
  console.error(err);
  res.status(500).json({
    message: "Internal server error.",
  });
}
module.exports = errorHandler;
