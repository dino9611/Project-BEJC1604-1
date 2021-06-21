const express = require("express");
const router = express.Router();
const { authController } = require("../controllers");

const {
  Login,
  Registration,
  All
} = authController;

router.post("/login", Login);
router.post("/registration", Registration);
router.get("/all", All);

module.exports = router;