const mysql = require("mysql");

const connection = mysql.createConnection({
  port: 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: "pjdb2021",
});

connection.connect((err) => {
  if (err) {
    console.log(err);
    return;
  }
  console.log(`connected as id ${connection.threadId}`);
});

module.exports = connection;
