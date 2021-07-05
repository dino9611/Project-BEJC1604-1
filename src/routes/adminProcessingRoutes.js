const express = require("express");
const router = express.Router();
const { verifyTokenAccess } = require("./../helpers/verifyToken");
const { adminProcessingController } = require("../controllers");

const {
  ProcessingProduct,
  GetLocationNearestWarehouse,
  RequestStockToAnotherWarehouse
} = adminProcessingController;

router.get("/processing-product", verifyTokenAccess, ProcessingProduct);
router.get("/warehouse-location", verifyTokenAccess, GetLocationNearestWarehouse);
router.post("/request-stock", verifyTokenAccess, RequestStockToAnotherWarehouse);
module.exports = router;
