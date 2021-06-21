const jwt = require("jsonwebtoken");

module.exports = {
  createAccessToken: (data) => {
    const key = "primarykey";
    const token = jwt.sign(data, key, { expiresIn: "2h" });
    return token
  },
  createTokenRefresh: (data) => {
    const key = "query";
    const token = jwt.sign(data, key);
    return token;
  },
  createEmailVerifiedToken: (data) => {
    const key = "postman";
    const token = jwt.sign(data, key, { expiresIn: "1h" });
    return token;
  },
}