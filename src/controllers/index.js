module.exports = {
  // user
  authController: require("./authController"),
  ProductController: require("./ProductController"),
  transactionController: require("./transactionController"),

  // admin
  adminController: require("./adminController"),
  adminTransactionController: require("./adminTransactionController"),
  adminProcessingController: require("./adminProcessingController"),
  adminRequestController: require("./adminRequestController"),
  passwordController: require("./passwordController"),

  ProductWarehouseController: require("./ProductWarehouseController"),
  NewAdminController: require("./NewAdminController"),
};
