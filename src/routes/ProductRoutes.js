const express = require("express");
const router = express.Router();
const { ProductController } = require("../controllers");

const { getAllProducts, getProductPaginate, getProductDetail, getCategory } =
  ProductController;

router.get("/all", getAllProducts);
router.get("/paging", getProductPaginate);
router.get("/category", getCategory);
router.get("/productDetail/:id", getProductDetail);

module.exports = router;
