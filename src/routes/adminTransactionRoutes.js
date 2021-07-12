const express = require("express");
const router = express.Router();
const { verifyTokenAccess } = require("./../helpers/verifyToken");
const { adminTransactionController } = require("../controllers");

const {
  Transaction,
  DetailTransaction,
  ConfirmTransactionAdmin,
  RejectTransactionAdmin,
  GetDataAdmin,
} = adminTransactionController;

router.get("/transaction", verifyTokenAccess, Transaction);
router.get("/detail-transaction", verifyTokenAccess, DetailTransaction);
router.put("/confirm-transaction", verifyTokenAccess, ConfirmTransactionAdmin);
router.put("/reject-transaction", verifyTokenAccess, RejectTransactionAdmin);
router.get("/data-admin", verifyTokenAccess, GetDataAdmin);

module.exports = router;
