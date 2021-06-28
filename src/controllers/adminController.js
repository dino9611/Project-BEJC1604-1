const { mysqldb } = require("../connection");
const { promisify } = require("util");
const {
  createAccessToken,
  createTokenRefresh,
} = require("../helpers/createToken");
const { v4: uuidv4 } = require("uuid");
const fs = require("fs");
const hashpass = require("./../helpers/hassingPass");
const dba = promisify(mysqldb.query).bind(mysqldb);
// const { db } = require("./../connection");
const { uploader } = require("../helpers");
const fs = require("fs");
// const dba = promisify(db.query).bind(db);

module.exports = {
  TransactionAdmin: async (req, res) => {
    try {
      const { uid } = req.user;
      // console.log(uid, 'ini uid admin')
      let sql = `select u.id, concat(u.first_name,' ',u.last_name) as name, 
      u.role, r.role as warehouse, 
      w.id as warehouse_id 
      from users u
      join role r on r.id = u.role
      join warehouse w on w.role_id = u.role
      where u.uid = ?`;
      const dataAdmin = await dba(sql, [uid]);

      if (dataAdmin[0]) {
        sql = `select concat(year(o.updated_at),"-",month(o.updated_at),"-",day(o.updated_at)) as dateTime, 
        concat(hour(o.updated_at),".",minute(o.updated_at)) as hourTime,  
        concat(u.first_name,' ',u.last_name) as name, 
        o.status, p.name as productName, 
        c.category_name as category, 
        o.invoice_number, 
        od.qty as quantity, od.price,
        w.location as warehouse,
        od.qty*od.price as amount
        from orders o
        join orders_detail od on o.id = od.orders_id
        join products p on p.id = od.product_id
        join category c on p.category_id = c.id
        join warehouse w on o.warehouse_id = w.id
        join users u on u.id = o.users_id
        where o.warehouse_id = ?`;
        const dataTransaction = await dba(sql, dataAdmin[0].warehouse_id);
        return res.status(200).send(dataTransaction);
      } else {
        sql = `select u.id, concat(u.first_name,' ',u.last_name) as name, u.role from users u
        join role r on r.id = u.role
        where u.uid = ?`;
        const dataAdminSuper = await dba(sql, [uid]);
        // console.log(dataAdminSuper[0], "ini data admin")
        if (dataAdminSuper[0]) {
          sql = `select concat(year(o.updated_at),"-",month(o.updated_at),"-",day(o.updated_at)) as dateTime, 
          concat(hour(o.updated_at),".",minute(o.updated_at)) as hourTime,  
          concat(u.first_name,' ',u.last_name) as name, 
          o.status, p.name as productName, c.category_name as category, 
          od.qty as quantity, 
          w.location as warehouse,
          o.invoice_number,
          od.price, od.qty*od.price as amount
          from orders o
          join orders_detail od on o.id = od.orders_id
          join products p on p.id = od.product_id
          join category c on p.category_id = c.id
          join warehouse w on o.warehouse_id = w.id
          join users u on u.id = o.users_id`;
          const dataTransaction = await dba(sql);
          return res.status(200).send(dataTransaction);
        } else {
          return res.status(500).send({ message: "data not found" });
        }
      }
    } catch (error) {
      console.log(error);
      return res.status(500).send(error);
    }
  },
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
      let sql = `select p.id, p.name, p.price, p.image, p.category_id, sum(pl.qty) as quantity, c.category_name as category, w.location  
                        from products p 
                        left join products_location pl on p.id = pl.products_id 
                        left join warehouse w on pl.warehouse_id = w.id 
                        join category c on p.category_id = c.id 
                        where p.is_deleted = 0 group by p.id 
                        limit ${mysqldb.escape(
                          (parseInt(pages) - 1) * 10
                        )},${mysqldb.escape(parseInt(limit))}`;
      const dataProduct = await dba(sql);
      sql = `select count(*) as totaldata from products where is_deleted = 0`;
      const countProduct = await dba(sql);
      return res
        .status(200)
        .send({ dataProduct, totaldata: countProduct[0].totaldata });
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
            console.log(result, "masuk");
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

            let sql = `select count(*) as totaldata from products where is_deleted = 0`;
            const resultAddProduct = await dba(sql);
            // console.log(resultAddProduct);
            return res
              .status(200)
              .send({ totaldata: resultAddProduct[0].totaldata });
          }
        );
      });
    } catch (error) {
      return res.status(500).send({ message: "server error" });
    }
  },

  updateProduct: (req, res) => {
    const { id } = req.params;
    let sql = `select * from products where id = ${id}`;
    mysqldb.query(sql, [id], (err, result) => {
      console.log(result);
      if (err) return res.status(500).send(err);
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
          console.log(imagePath);
          const data = JSON.parse(req.body.data);
          let dataInsert = {
            name: data.name,
            price: data.price,
            category_id: data.category,
          };
          if (imagePath) {
            dataInsert.image = imagePath;
          }
          mysqldb.query(
            `update products set ? where id = ${id} `,
            [dataInsert, id],
            async (err) => {
              //hapus foto baru kalau update gagal
              if (err) {
                if (imagePath) {
                  fs.unlinkSync("./public" + imagePath);
                }
                return res.status(500).send(err);
              }
              // hapus foto lama
              if (imagePath) {
                if (result[0].image) {
                  fs.unlinkSync("./public" + result[0].image);
                }
              }

              let sql = `select count(*) as totaldata from products where is_deleted = 0`;
              const dataProduct = await dba(sql);
              console.log(dataProduct);
              return res
                .status(200)
                .send({ totaldata: dataProduct[0].totaldata });
            }
          );
        });
      } catch (error) {
        return res.status(500).send(error);
      }
    });
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

          sql = `select count(*) as totaldata from products where is_deleted = 0`;
          const dataProduct = await dba(sql);
          return res.status(200).send({ totaldata: dataProduct[0].totaldata });
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
        hashpass(password),
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
        return res.status(500).send({
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
