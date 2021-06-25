const { mysqldb } = require("../connection");
const { promisify } = require("util");
const {
  createAccessToken,
  createTokenRefresh,
} = require("./../helpers/createToken");
const { v4: uuidv4 } = require("uuid");
const hashpass = require("./../helpers/hassingPass");
const dba = promisify(mysqldb.query).bind(mysqldb);
// const { db } = require("./../connection");
const { uploader } = require("../helpers");
const fs = require("fs");
// const dba = promisify(db.query).bind(db);
module.exports = {
  getAllProductAdmin: async (req, res) => {
    try {
      let sql = `select p.id, p.name, p.price, p.image, sum(pl.qty) as quantity, c.category_name as category, w.location  
                        from products p 
                        left join products_location pl on p.id = pl.products_id 
                        left join warehouse w on pl.warehouse_id = w.id 
                        join category c on p.category_id = c.id 
                        where p.is_deleted = 0 group by p.id;`;
      const dataProduct = await dba(sql);
      return res.status(200).send(dataProduct);
    } catch (error) {
      return res.status(500).send(error);
    }
  },

  getProductAdmin: async (req, res) => {
    try {
      const { pages, limit } = req.query;
      if (!pages || !limit)
        return res.status(400).send({ message: "Pages/limit harus diisi" });
      let sql = `select p.id, p.name, p.price, p.image, sum(pl.qty) as quantity, c.category_name as category, w.location  
                        from products p 
                        left join products_location pl on p.id = pl.products_id 
                        left join warehouse w on pl.warehouse_id = w.id 
                        join category c on p.category_id = c.id 
                        where p.is_deleted = 0 group by p.id 
                        limit ${mysqldb.escape(
        (parseInt(pages) - 1) * 10
      )},${mysqldb.escape(parseInt(limit))}`;
      const dataProduct = await dba(sql);
      return res.status(200).send(dataProduct);
    } catch (error) {
      return res.status(500).send(error);
    }
  },

  getAllCategory: async (req, res) => {
    try {
      let sql = `select id, category_name from category`;
      const dataCategory = await dba(sql);
      return res.status(200).send(dataCategory);
    } catch (error) {
      return res.status(500).send(error);
    }
  },

  getAllLocation: async (req, res) => {
    try {
      let sql = `select id, location from warehouse`;
      const dataLocation = await dba(sql);
      return res.status(200).send(dataLocation);
    } catch (error) {
      return res.status(500).send(error);
    }
  },

  addProduct: async (req, res) => {
    try {
      const path = "/product";
      const upload = uploader(path, "PROD").fields([{ name: "image" }]);
      upload(req, res, (err) => {
        if (err) {
          return res
            .status(500)
            .json({ message: "Upload picture failed", error: err.message });
        }
        const { image } = req.files;
        const imagePath = image ? path + "/" + image[0].filename : null;
        const data = JSON.parse(req.body.data);
        let dataInsert = {
          name: data.name,
          price: data.price,
          image: imagePath,
          category_id: data.category,
        };
        console.log(data);

        mysqldb.query(
          `insert into products set ?`,
          dataInsert,
          async (err, result) => {
            if (err) {
              if (imagePath) {
                fs.unlinkSync("./public" + imagePath);
              }
              return res.status(500).send(err);
            }

            const dataQty = data.qty.map((val) => {
              return { ...val, products_id: result.insertId };
            });

            dataQty.forEach(async (val) => {
              await dba(`insert into products_location set ?`, val);
            });

            let sql = `select p.id, p.name, p.price, p.image, sum(pl.qty) as quantity, c.category_name as category, w.location
                  from products p
                  left join products_location pl on p.id = pl.products_id
                  left join warehouse w on pl.warehouse_id = w.id
                  join category c on p.category_id = c.id where p.is_deleted = 0 group by p.id`;
            const resultAddProduct = await dba(sql);
            return res.status(200).send(resultAddProduct);
          }
        );
      });
    } catch (error) {
      return res.status(500).send({ message: "server error" });
    }
  },

  deleteProduct: async (req, res) => {
    try {
      const { id } = req.params;
      let sql = `select * from products where id = ?`;

      mysqldb.query(sql, [id], (err, result) => {
        if (err) return res.status(500).send(err);
        sql = `update products set is_deleted = 1 where id = ?`;

        mysqldb.query(sql, [id], async (err) => {
          if (err) return res.status(500).send(err);
          if (result[0].image) {
            fs.unlinkSync("./public" + result[0].image);
          }

          sql = `select * from products where is_deleted = 0`;
          const dataProduct = await dba(sql);
          return res.status(200).send(dataProduct);
        });
      });
    } catch (error) {
      return res.status(500).send({ message: "server error" });
    }
  },
  loginAdmin: async (req, res) => {
    try {
      const { emailOrUsername, password } = req.body;
      if (!emailOrUsername || !password) {
        return res.status(400).send({ message: "bad request" });
      }
      let sql = `select * from users where (email = ? or username = ?) and password = ? and not role = 1 and is_deleted = 1`;
      const deletedAdmin = await dba(sql, [
        emailOrUsername,
        emailOrUsername,
        password,
      ]);
      if (deletedAdmin.length) {
        return res.status(403).send({
          message: "Admin account is deleted, please contact Super Admin!",
        });
      }
      sql = `select u.uid, u.username, r.role from users u join role r on r.id = u.role where (u.email = ? or u.username = ?) and u.password = ? and not u.role = 1 and u.is_deleted = 0`;
      let dataAdmin = await dba(sql, [
        emailOrUsername,
        emailOrUsername,
        hash(password),
      ]);
      if (dataAdmin.length) {
        let dataToken = {
          uid: dataAdmin[0].uid,
          role: dataAdmin[0].role,
        };
        const tokenAccess = createAccessToken(dataToken);
        const tokenRefresh = createTokenRefresh(dataToken);
        res.set("X-Token-Access", tokenAccess);
        res.set("X-Token-Refresh", tokenRefresh);
        return res.status(200).send({ dataAdmin: dataAdmin[0] });
      } else {
        return res.status(400).send({
          message:
            "The username or password you entered does not match our records. Please check and try again.",
        });
      }
    } catch (error) {
      console.log(error);
      return res.status(500).send({ message: "server error" });
    }
  },
};
