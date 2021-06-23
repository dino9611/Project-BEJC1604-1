const express = require("express");
const router = express.Router();
const { adminController } = require("../controllers");

const { loginAdmin } = adminController;

router.post('/login', loginAdmin);

module.exports = router;