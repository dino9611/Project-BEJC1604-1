"use strict";
const express = require("express");
const cors = require("cors");
require("dotenv").config();
const app = express();
const PORT = process.env.PORT;
const bearerToken = require("express-bearer-token");
const morgan = require("morgan");

morgan.token("date", function (req, res) {
  return new Date();
});

app.use(
  morgan(":method :url :status :res[content-length] - :response-time ms :date")
);

app.use(bearerToken());
app.use(
  cors({
    exposedHeaders: [
      "Content-Length",
      "x-token-access",
      "x-token-refresh",
      "x-total-count",
    ],
  })
);

app.use(express.json());

app.use(express.urlencoded({ extended: false }));

app.use(express.static("public"));

app.get("/", (req, res) => {
  res.send({ message: "REST API FOURNIR" });
});

const {
  authRoutes,
  adminRoutes,
  adminTransactionRoutes,
  adminProcessingRoutes,
  adminRequestRoutes,
  ProductRoutes,
  transactionRoutes,
  passwordRoutes,
  ProductWarehouseRoutes,
  NewAdminRoutes,
} = require("./src/routes");

app.use("/auth", authRoutes);
app.use("/admin", adminRoutes);
app.use("/admin-warehouse-transaction", adminTransactionRoutes);
app.use("/admin-warehouse-processing", adminProcessingRoutes);
app.use("/admin-warehouse-request", adminRequestRoutes);
app.use("/product", ProductRoutes);
app.use("/transaction", transactionRoutes);
app.use("/password", passwordRoutes);

app.use("/adminProd", ProductWarehouseRoutes);
app.use("/superAd", NewAdminRoutes);

app.all("*", (req, res) => {
  res.status(404).send({ message: "resource not found" });
});

app.listen(PORT, () => console.log(`listen in PORT ${PORT}`));
