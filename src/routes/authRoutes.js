const express = require("express");
const router = express.Router();
const { authController } = require("../controllers");

const {
  Login,
  Registration,
  All,
  getAllUsers, 
  getUser, 
  addPersonalData, 
  addAddress 
} = authController;

router.post("/login", Login);
router.post("/registration", Registration);
router.get("/all", All);
router.get('/all', getAllUsers);
router.get('/:id', getUser);
router.post('/addData/:id', addPersonalData);
router.post('/addAddress/:id', addAddress);

module.exports = router;