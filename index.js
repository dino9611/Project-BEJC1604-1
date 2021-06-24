"use strict";
const express = require("express");
const cors = require("cors");
require("dotenv").config();
const app = express();
const PORT = 5000;
const morgan = require("morgan");

morgan.token("date", function (req, res) {
  return new Date();
});

app.use(
  morgan(":method :url :status :res[content-length] - :response-time ms :date")
);

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
  res.send({ message: "REST API FOURNIR" })
})

const { authRoutes, ProductRoutes } = require("./src/routes");

app.use("/auth", authRoutes);
app.use("/product", ProductRoutes);

app.all("*", (req, res) => {
  res.status(404).send({ message: "resource not found"});
});

app.listen(PORT, () => console.log(`listen in PORT ${PORT}`));