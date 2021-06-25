const express = require("express");
const router = express.Router();
const {
  verifyTokenAccess,
} = require("./../helpers/verifyToken");
const { adminController } = require("../controllers");

const {
  TransactionAdmin
} = adminController;

router.get("/list-transaction", verifyTokenAccess, TransactionAdmin);

module.exports = router;