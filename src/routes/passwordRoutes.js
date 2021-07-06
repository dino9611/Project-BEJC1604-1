const express = require("express");
const router = express.Router();
const { passwordController } = require("../controllers");

const { resetPassword, forgotPassword, changePassword } = passwordController;
const { verifyEmailForgotToken } = require("../helpers/verifyToken");

router.post("/forgot", forgotPassword);
router.put("/resetpassword", verifyEmailForgotToken, resetPassword);
router.patch("/change/:id", changePassword);

module.exports = router;
