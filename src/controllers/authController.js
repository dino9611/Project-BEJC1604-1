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
const geolib = require("geolib");

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
        let cart = await dba(sql, [dataUser[0].id]);
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
      console.log(error);
      return res.status(500).send({ message: "server error" });
    }
  },
  Registration: async (req, res) => {
    try {
      const { email, username, password, confirmpass, gender } = req.body;
      let validation = new RegExp("^(?=.*[a-z])(?=.*[0-9])(?=.*[A-Z])").test(
        password
      );
      let usernameTest = new RegExp("\\s").test(username);
      if (password != confirmpass) {
        return res.status(400).send({
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
          return res.status(200).send({ ...datauser[0], cart: [] });
        }
      }
    } catch (error) {
      console.log(error);
      return res.status(500).send({ message: "server error" });
    }
  },
  getAllUsers: (req, res) => {
    let sql = `select * from users`;
    mysqldb.query(sql, (error, result) => {
      if (error) return res.status(500).send(error);
      return res.status(200).send(result);
    });
  },
  getUser: (req, res) => {
    const { id } = req.params;
    let sql = `select * from users where id = ?`;
    mysqldb.query(sql, [id], (error, result) => {
      if (error) return res.status(500).send(error);
      return res.status(200).send(result);
    });
  },
  addPersonalData: (req, res) => {
    try {
      const { id } = req.params;
      const { first_name, last_name, gender, age, phone_number } = req.body;
      let dataToAdd = {
        first_name: first_name,
        last_name: last_name,
        gender: gender,
        age: age,
        phone_number: phone_number,
      };
      let sql = `update users set ? where id = ?`;
      mysqldb.query(sql, [dataToAdd, id], (error) => {
        if (error) return res.status(500).send(error);
        sql = `select id, first_name, last_name, email, phone_number, gender, age from users where id = ? `;
        mysqldb.query(sql, [id], (error, result) => {
          if (error) return res.status(500).send(error);
          return res.status(200).send(result);
        });
      });
    } catch (error) {
      console.error(error);
      return res.status(500).send({ error: true, message: error.message });
    }
  },
  addAddress: (req, res) => {
    try {
      const { id } = req.params;
      const { address, city, zip, description } = req.body;
      let insertData = {
        address: address,
        city: city,
        zip: zip,
        description: description,
        users_id: id,
      };
      let sql = `insert into address set ?`;
      mysqldb.query(sql, [insertData], (error) => {
        if (error) return res.status(500).send({ message: "bad request" });
        sql = `select a.address, a.city, a.zip, a.description from address a 
            join users u on a.users_id=u.id where u.id = ?`;
        mysqldb.query(sql, [id], (error, result) => {
          if (error) return res.status(500).send(error);
          return res.status(200).send(result);
        });
      });
    } catch (error) {
      console.error(error);
      return res.status(500).send({ error: true, message: error.message });
    }
  },
  editAddress: async (req, res) => {
    try {
      const { id } = req.params;
      const { address, city, zip, description } = req.body;
      let updateData = {
        address: address,
        city: city,
        zip: zip,
        description: description,
      };
      let sql = `update address set ? user_id = ?`;
      await dba(sql, [updateData, id]);
    } catch (error) {
      console.error(error);
      return res.status(500).send({ message: "server error" });
    }
  }
};
