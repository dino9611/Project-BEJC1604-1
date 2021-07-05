const express = require("express");
const router = express.Router();
const { ProductController } = require("../controllers");

const { getAllProducts, getProductPaginate, getProductDetail, getCategory } =
  ProductController;

router.get("/all", getAllProducts);
router.get("/paging", getProductPaginate);
router.get("/productDetail/:id", getProductDetail);
router.get("/category", getCategory);

module.exports = router;
