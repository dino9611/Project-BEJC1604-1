require("dotenv").config();
const express = require("express");
const app = express();
const cors = require("cors");
const bearerToken = require("express-bearer-token");
const morgan = require("morgan");
const PORT = process.env.PORT;

morgan.token("date", function (req, res) {
  return new Date();
});

app.use(express.urlencoded({ extended: false }));

app.use(express.static("public"));

app.use(express.json());

app.use(cors());

app.use(bearerToken());

app.use(
  morgan(":method :url :status :res[content-length] - :response-time ms :date")
);

app.get("/", (req, res) => {
  res.send("<h1> Welcome to API FURNIR</h1>");
});

const { AdminRoutes } = require("./src/routes");

app.use("/admin", AdminRoutes);

app.listen(PORT, () => console.log(`Port ${PORT} is active`));
