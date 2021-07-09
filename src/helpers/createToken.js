const jwt = require("jsonwebtoken");

module.exports = {
  createAccessToken: (data) => {
    const key = "grup-1-finalproject";
    const token = jwt.sign(data, key, { expiresIn: "2h" });
    return token;
  },
  createTokenRefresh: (data) => {
    const key = "query";
    const token = jwt.sign(data, key);
    return token;
  },
  createEmailVerifiedToken: (data) => {
    const key = "fournir-ecom";
    const token = jwt.sign(data, key, { expiresIn: 60 * 1 }); // 10s
    return token;
  },
  createForgotPassToken: (data) => {
    const key = "fournir-forgot";
    const token = jwt.sign(data, key, { expiresIn: '10m' });
    return token;
  }
};
