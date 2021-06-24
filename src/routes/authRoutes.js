const express = require("express");
const router = express.Router();
const { verifyEmailToken } = require("./../helpers/verifyToken");
const { authController } = require("../controllers");
const {
  Login,
  Registration,
  verifiedEmailwithToken,
  sendEmailVerification,
  All,
} = authController;

router.post("/login", Login);
router.post("/registration", Registration);
router.post("/sendverified", sendEmailVerification);
router.get("/verified-email", verifyEmailToken, verifiedEmailwithToken);
router.get("/all", All);

module.exports = router;
