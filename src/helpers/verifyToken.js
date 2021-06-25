const jwt = require("jsonwebtoken");

module.exports.verifyTokenAccess = (req, res, next) => {
  // console.log("token", req.token);
  const token = req.token;
  const key = "grup-1-finalproject";
  jwt.verify(token, key, (err, decoded) => {
    if (err) return res.status(401).send({ message: "user unauthorized" });
    // console.log(decoded);
    req.user = decoded;
    next();
  });
};

module.exports.verifyEmailToken = (req, res, next) => {
  // console.log("token", req.token);
  const token = req.token;
  const key = "fournir-ecom";
  jwt.verify(token, key, (err, decoded) => {
    if (err) {
      console.log(err);
      return res.status(401).send({ message: "user unauthorized" });
    }
    // console.log(decoded, 'ini');
    req.user = decoded;
    next();
  });
};

// module.exports.checkId = (req, res, next) => {
//   const { uid } = req.body;
//   if (uid === req.user.uid) {
//     next();
//   } else {
//     return res.status(401).send({ message: "user unauthorized" });
//   }
// };
