module.exports = {
  // user
  authRoutes: require("./authRoutes"),
  ProductRoutes: require("./ProductRoutes"),
  transactionRoutes: require("./transactionRoutes"),

  // admin
  adminRoutes: require("./adminRoutes"),
  adminTransactionRoutes: require("./adminTransactionRoutes"),
  adminProcessingRoutes: require("./adminProcessingRoutes"),
  adminRequestRoutes: require("./adminRequestRoutes"),

  passwordRoutes: require("./passwordRoutes"),
};
