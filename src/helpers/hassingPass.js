const Crypto = require("crypto");

module.exports = (password) => {
  var katakunci = "fournir";
  return Crypto.createHmac("sha256", katakunci).update(password).digest("hex");
};