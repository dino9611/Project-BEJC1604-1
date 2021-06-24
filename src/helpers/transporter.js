const { createTransport } = require("nodemailer");
let transporter = createTransport({
  service: "gmail",
  auth: {
    user: "omiputrakarunia@gmail.com",
    pass: "pnaumgzxuuwkyivx",
  },
  tls: {
    rejectUnauthorized: false,
  },
});

module.exports = transporter;
