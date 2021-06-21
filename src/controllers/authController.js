const { mysqldb } = require("../connection");
const { promisify } = require("util");
const {
  createAccessToken,
  createTokenRefresh,
  createEmailVerifiedToken,
} = require("../helpers/createToken");
const { v4: uuidv4 } = require("uuid");
const hashpass = require("./../helpers/hassingPass");
const dba = promisify(mysqldb.query).bind(mysqldb);

module.exports = {
  All: async (req, res) => {
    try {
      let sql = `select * from users`;
      let dataUser = await dba(sql);
      return res.status(200).send(dataUser);
    } catch (error) {
      console.log(error);
      return res.status(500).send({ message: "server error" });
    }
  },
  Login: async (req, res) => {
    try {
      const { emailorusername, password } = req.body;
      if (!emailorusername || !password)
        return res.status(400).send({ message: "bad request" });
      let sql = `select * from users where (email = ? or username = ?) and password = ?`;
      let dataUser = await dba(sql, [
        emailorusername,
        emailorusername,
        hashpass(password),
      ]);
      if (dataUser.length) {
        let dataToken = {
          uid: dataUser[0].uid,
          role: dataUser[0].role,
        };
        const tokenAccess = createAccessToken(dataToken);
        const tokenRefresh = createTokenRefresh(dataToken);
        res.set("x-token-access", tokenAccess);
        res.set("x-token-refresh", tokenRefresh);
        return res.status(200).send({ ...dataUser[0] });
      } else {
        return res.status(500).send({
          message:
            "The username and password you entered do not match our records. Please check and try again.",
        });
      }
    } catch (error) {
      console.log(error);
      return res.status(500).send({ message: "server error" });
    }
  },
  Registration: async (req, res) => {
    try {
      const { email, username, password, confirmpass, gender } = req.body;
      let validation = new RegExp("^(?=.*[a-z])(?=.*[0-9])(?=.*[A-Z])").test(password)
      let usernameTest = new RegExp("\\s").test(username)
      if (password != confirmpass) {
        return res.status(400).send({ message: "Password does not match. Please check and try again." });
      } else if (!email || !username || !password || !gender) {
        return res.status(400).send({
          message: "There is an unfilled input. Please check and try again.",
        });
      } else if (password.length < 6){
        return res.status(400).send({
          message: "Password must be at least 6 characters",
        });
      } else if (validation === false){
        return res.status(400).send({
          message: "Password must contain numbers, uppercase and lowercase letter",
        });
      } else if (usernameTest === true){
        return res.status(400).send({
          message: "Username cannot contain spaces",
        });
      } else {
        let sql = `select * from users where username=?`;
        const dataUserUsername = await dba(sql, [username]);
        sql = `select * from users where email=?`
        const dataUserEmail = await dba(sql, [email]);
        if (dataUserUsername.length) {
          return res.status(500).send({ message: "Username has been registered" });
        } else if (dataUserEmail.length) {
          return res.status(500).send({ message: "E-mail has been registered" });
        } else {
          sql = `insert into users set ?`;
          const uid = uuidv4();
          let data = {
            uid: uid,
            username: username,
            password: hashpass(password),
            email: email,
            gender: gender,
          };
          await dba(sql, data);
          sql = `select * from users where uid = ? `;
          const datauser = await dba(sql, [uid]);
          console.log(datauser);
          let dataToken = {
            uid: datauser[0].uid,
            role: datauser[0].role,
          };
          // const tokenEmail = createEmailVerifiedToken(dataToken);
          const tokenAccess = createAccessToken(dataToken);
          const tokenRefresh = createTokenRefresh(dataToken);
          res.set("x-token-access", tokenAccess);
          res.set("x-token-refresh", tokenRefresh);
          return res.status(200).send({ ...datauser[0] });
        }
      }
    } catch (error) {
      console.log(error);
      return res.status(500).send({ message: "server error" });
    }
  },
};
