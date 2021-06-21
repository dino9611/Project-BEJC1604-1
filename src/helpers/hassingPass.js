const Crypto = require("crypto");

module.exports = (password) => {
  var katakunci = process.env.HASH_KEY;
  return Crypto.createHmac("sha256", katakunci).update(password).digest("hex");
};