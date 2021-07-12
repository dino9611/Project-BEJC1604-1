const jwt = require("jsonwebtoken");

module.exports.verifyTokenAccess = (req, res, next) => {
  // console.log("token", req.token);
  const token = req.token;
  const key = "grup-1-finalproject";
  jwt.verify(token, key, (err, decoded) => {
    if (err) return res.status(401).send({ message: "user unauthorized" });
    // console.log('ini isi decoded', decoded);
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
    // console.log('ini decoded', decoded);
    req.user = decoded;
    next();
  });
};

module.exports.verifyEmailForgotToken = (req, res, next) => {
  console.log('ini tokenForgot', req.token);
  const token = req.token;
  const key = 'fournir-forgot';
  jwt.verify(token, key, (error, decoded) => {
    if (error) {
      console.error(error);
      return res.status(401).send({ message: 'User unauthorized' });
    }
    console.log('ini decoded forgot', decoded);
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
