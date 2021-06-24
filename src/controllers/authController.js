const { mysqldb } = require("../connection");
const { promisify } = require("util");
const {
  createAccessToken,
  createTokenRefresh,
  createEmailVerifiedToken,
} = require("../helpers/createToken");
const { v4: uuidv4 } = require("uuid");
const fs = require("fs");
const path = require("path");
const handlebars = require("handlebars");
const transporter = require("./../helpers/transporter");
const hashpass = require("./../helpers/hassingPass");
const dba = promisify(mysqldb.query).bind(mysqldb);

const dbprom = (query, arr = []) => {
  return new Promise((resolve, reject) => {
    mysqldb.query(query, arr, (error, result) => {
      if (error) {
        reject(error);
      } else {
        resolve(result);
      }
    });
  });
};

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
        sql = `select p.id, p.name, p.price,p.category_id, o.status, o.users_id, o.warehouse_id, od.orders_id, od.product_id, od.qty from orders o
        join orders_detail od on o.id = od.orders_id
        join products p on od.product_id = p.id
        where o.status = 'onCart' and users_id = ?`;
        let cart = await dba(sql, [dataUser[0].uid]);
        // console.log(cart, 'ini cart(login)')
        let dataToken = {
          uid: dataUser[0].uid,
          role: dataUser[0].role,
        };
        const tokenAccess = createAccessToken(dataToken);
        const tokenRefresh = createTokenRefresh(dataToken);
        res.set("x-token-access", tokenAccess);
        res.set("x-token-refresh", tokenRefresh);
        return res.status(200).send({ ...dataUser[0], cart: cart });
      } else {
        return res.status(500).send({
          message:
            "The username and password you entered do not match our records. Please check and try again.",
        });
      }
    } catch (error) {
      // console.log(error);
      return res.status(500).send({ message: "server error" });
    }
  },
  KeepLogin: async (req, res) => {
    try {
      const { uid } = req.user;
      // console.log(req.user, "ini req.user");
      // console.log(uid, "ini uid");
      let sql = `select * from users where uid = ?`;
      const dataUser = await dbprom(sql, [uid]);
      // console.log(dataUser, "ini data");
      sql = `select p.id, p.name, p.category_id, o.status, o.users_id, o.warehouse_id, od.orders_id, od.product_id, od.price, od.qty from orders o
        join orders_detail od on o.id = od.orders_id
        join products p on od.product_id = p.id
        where o.status = 'onCart' and users_id = ?`;
      let cart = await dbprom(sql, [uid]);
      // console.log(cart, "ini cart");
      return res.status(200).send({ ...dataUser[0], cart: cart });
    } catch (error) {
      console.log(error);
      return res.status(500).send({ message: "server error" });
    }
  },
  Registration: async (req, res) => {
    try {
      const { email, username, password, confirmPassword, gender } = req.body;
      let validation = new RegExp("^(?=.*[a-z])(?=.*[0-9])(?=.*[A-Z])").test(
        password
      );
      let usernameTest = new RegExp("\\s").test(username);
      if (password != confirmPassword) {
        return res
          .status(400)
          .send({
            message: "Password does not match. Please check and try again.",
          });
      } else if (!email || !username || !password || !gender) {
        return res.status(400).send({
          message: "There is an unfilled input. Please check and try again.",
        });
      } else if (password.length < 6) {
        return res.status(400).send({
          message: "Password must be at least 6 characters",
        });
      } else if (validation === false) {
        return res.status(400).send({
          message:
            "Password must contain numbers, uppercase and lowercase letter",
        });
      } else if (usernameTest === true) {
        return res.status(400).send({
          message: "Username cannot contain spaces",
        });
      } else {
        let sql = `select * from users where username=?`;
        const dataUserUsername = await dba(sql, [username]);
        sql = `select * from users where email=?`;
        const dataUserEmail = await dba(sql, [email]);
        if (dataUserUsername.length) {
          return res
            .status(500)
            .send({ message: "Username has been registered" });
        } else if (dataUserEmail.length) {
          return res
            .status(500)
            .send({ message: "E-mail has been registered" });
        } else {
          sql = `insert into users set ?`;
          const uid = uuidv4();
          const userImageProfile = "/user/user-profile-default.jpg"
          let data = {
            uid: uid,
            username: username,
            password: hashpass(password),
            email: email,
            gender: gender,
            photo: userImageProfile
          };
          await dba(sql, data);
          sql = `select * from users where uid = ?`;
          var datauser = await dba(sql, [uid]);

          let filePath = path.resolve(
            __dirname,
            "./../template/emailVerification.html"
          );
          const renderHtml = fs.readFileSync(filePath, "utf-8");
          const template = handlebars.compile(renderHtml);

          let dataToken = {
            uid: datauser[0].uid,
            role: datauser[0].role,
          };
          const tokenverified = createEmailVerifiedToken(dataToken);
          const tokenAccess = createAccessToken(dataToken);
          const tokenRefresh = createTokenRefresh(dataToken);
          const link = "http://localhost:3000/verified-email/" + tokenverified;

          const htmltoemail = template({ username: username, link: link });
          await transporter.sendMail({
            from: "Admin Fournir <omiputrakarunia@gmail.com>",
            to: email,
            subject: `We need email confirmation for your account`,
            html: htmltoemail,
          });

          res.set("x-token-access", tokenAccess);
          res.set("x-token-refresh", tokenRefresh);
          return res.status(200).send({ ...datauser[0], cart: [] });
        }
      }
    } catch (error) {
      console.log(error);
      return res.status(500).send({ message: "server error" });
    }
  },
  sendEmailVerification: async (req, res) => {
    try {
      const { uid, email, role, username } = req.body;
      // console.log(uid, email, role, username);
      const dataToken = {
        uid: uid,
        role: role,
      };

      let filePath = path.resolve(
        __dirname,
        "./../template/emailVerification.html"
      );
      const tokenverified = createEmailVerifiedToken(dataToken);
      const renderHtml = fs.readFileSync(filePath, "utf-8");
      const template = handlebars.compile(renderHtml);
      const link = "http://localhost:3000/verified-email/" + tokenverified;

      const htmltoemail = template({ username: username, link: link });
      await transporter.sendMail({
        from: "Admin Fournir <omiputrakarunia@gmail.com>",
        to: email,
        subject: `We need email confirmation for your account`,
        html: htmltoemail,
      });

      return res.status(200).send({ message: "berhasil kirim" });
    } catch (error) {
      console.log(error);
      return res.status(500).send({ message: "server error" });
    }
  },
  verifiedEmailwithToken: async (req, res) => {
    try {
      let { uid } = req.user;
      // console.log(uid)
      let dataUpdate = {
        is_verified: 1,
      };
      let sql = `select * from users where uid = ?`;
      let dataUser = await dba(sql, uid);
      if (dataUser[0].is_verified) {
        return res.status(200).send({ message: "email telah verified" });
      }
      // console.log(dataUser[0].is_verified)
      sql = `update users set ? where uid = ?`;
      await dba(sql, [dataUpdate, uid]);
      sql = `select * from users where uid = ?`;
      let dataUserVerified = await dba(sql, uid);
      // console.log(dataUser[0]);
      return res.status(200).send(dataUserVerified[0]);
    } catch (error) {
      console.log(error);
      return res.status(500).send({ message: "server error" });
    }
  },
};
