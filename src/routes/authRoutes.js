const express = require("express");
const router = express.Router();
const { verifyEmailToken } = require("./../helpers/verifyToken");
const { authController } = require("../controllers");
const {
  Login,
  Registration,
  All,
  getAllUsers,
  getUser,
  addPersonalData,
  addAddress,
  verifiedEmailwithToken,
  sendEmailVerification,
  getAddress,
} = authController;

router.post("/login", Login);
router.post("/registration", Registration);
router.post("/sendverified", sendEmailVerification);
router.get("/verified-email", verifyEmailToken, verifiedEmailwithToken);
router.get("/all", getAllUsers);
router.get("/:id", getUser);
router.get("/address/:users_id", getAddress);
router.post("/addData/:id", addPersonalData);
router.post("/addAddress/:users_id", addAddress);

module.exports = router;
