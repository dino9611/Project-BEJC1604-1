const express = require("express");
const router = express.Router();

const { verifyTokenAccess } = require("../helpers/verifyToken");
const { NewAdminController } = require("../controllers");

const { getAllUser, addAdmin } = NewAdminController;

router.get("/newAdminWarehouse", verifyTokenAccess, getAllUser);
router.patch("/newAdminWarehouse", verifyTokenAccess, addAdmin);

module.exports = router;
