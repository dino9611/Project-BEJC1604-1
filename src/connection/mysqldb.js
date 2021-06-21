const mysql = require("mysql");
const connection = mysql.createConnection({
  port: 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: "final_project",
});
connection.connect((err) => {
  if (err) {
    return;
  }
  console.log("connected as id " + connection.threadId);
});

module.exports = connection;
