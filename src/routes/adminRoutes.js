const express = require("express");
const router = express.Router();
const { verifyTokenAccess } = require("./../helpers/verifyToken");
const { adminController } = require("../controllers");

const {
  getProductAdmin,
  getAllCategory,
  getAllLocation,
  getAllProductAdmin,
  addProduct,
  deleteProduct,
  updateProduct,
  getGender,
  getCategoryReport,
  getRevenueReport,
  getWarehouseSales,
  loginAdmin,
  getRevenue,
  potentialRevenue,
  getListWarehouse,
  addWarehouse
} = adminController;

router.get("/product", getProductAdmin);
router.get("/product/all", getAllProductAdmin);
router.get("/category", getAllCategory);
router.get("/location", getAllLocation);
router.get("/gender", getGender);
router.get("/categoryReport", getCategoryReport);
router.get("/revenueReport", getRevenueReport);
router.get("/warehouseReport", getWarehouseSales);
router.put("/product/all/:id", updateProduct);
router.post("/product/all", addProduct);
router.post("/add-warehouse", verifyTokenAccess, addWarehouse);
router.delete("/product/:id", deleteProduct);
router.post("/login", loginAdmin);
router.get("/potential", potentialRevenue);
router.get("/revenue", getRevenue);
router.get("/get-warehouse", verifyTokenAccess, getListWarehouse);
module.exports = router;
