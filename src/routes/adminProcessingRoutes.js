const express = require("express");
const router = express.Router();
const { verifyTokenAccess } = require("./../helpers/verifyToken");
const { adminProcessingController } = require("../controllers");

const {
  ProcessingProduct,
  GetLocationNearestWarehouse,
  RequestStockToAnotherWarehouse,
  SendingItem
} = adminProcessingController;

router.get("/processing-product", verifyTokenAccess, ProcessingProduct);
router.get("/warehouse-location", verifyTokenAccess, GetLocationNearestWarehouse);
router.post("/request-stock", verifyTokenAccess, RequestStockToAnotherWarehouse);
router.post("/sending-item", verifyTokenAccess, SendingItem);
module.exports = router;
