const express = require("express");
const router = express.Router();
const { verifyTokenAccess } = require("./../helpers/verifyToken");
const { adminRequestController } = require("../controllers");

const { GetRequestFromAnotherWarehouse, AcceptRequest, RejectRequest } = adminRequestController;

router.get("/request-log", verifyTokenAccess, GetRequestFromAnotherWarehouse);
router.post("/accept-request", verifyTokenAccess, AcceptRequest);
router.post("/reject-request", verifyTokenAccess, RejectRequest);

module.exports = router;
