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
const geolib = require("geolib");
// const { db } = require("./../connection");
const { uploader } = require("../helpers");
// const fs = require("fs");
// const dba = promisify(db.query).bind(db);

module.exports = {
  loginAdmin: async (req, res) => {
    try {
      const { emailOrUsername, password } = req.body;
      if (!emailOrUsername || !password) {
        return res.status(400).send({ message: "All input can not be empty" });
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
        // console.log(dataToken);
        const tokenAccess = createAccessToken(dataToken);
        const tokenRefresh = createTokenRefresh(dataToken);
        res.set("X-Token-Access", tokenAccess);
        res.set("X-Token-Refresh", tokenRefresh);
        return res.status(200).send({ dataAdmin: dataAdmin[0] });
      } else {
        return res.status(400).send({
          message: "email or password wrong",
        });
      }
    } catch (error) {
      console.error(error);
      return res.status(500).send({ message: "server error" });
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
      let sql = `select * from warehouse`;
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

  getGender: async (req, res) => {
    try {
      let sql = `select count(distinct u.username) as total, u.gender from orders o
                  join users u on o.users_id = u.id where o.status in ("delivered","sending") group by u.gender;`;
      const dataGender = await dba(sql);
      return res.status(200).send(dataGender);
    } catch (error) {
      return res.status(500).send({ message: "server error" });
    }
  },

  getCategoryReport: async (req, res) => {
    try {
      let sql = `select sum(od.qty) as total, c.category_name from category c 
                  left join products p on p.category_id = c.id
                  left join orders_detail od on od.product_id = p.id
                  left join orders o on o.id = od.orders_id where o.status in ("delivered","sending") and od.is_deleted = 0 
                  group by p.category_id;`;
      const dataCategory = await dba(sql);
      sql = `select category_name from category;`;
      const totalCategory = await dba(sql);
      console.log(totalCategory, "line 346");
      console.log(dataCategory, "line 347");
      return res.status(200).send({ dataCategory, totalCategory });
    } catch (error) {
      return res.status(500).send({ message: "server error" });
    }
  },

  getRevenueReport: async (req, res) => {
    try {
      let sql = `select sum(od.qty) as total_product, sum(od.price*od.qty) as total_revenue, date_format(od.date, '%d %M %y') as month_ from orders_detail od
                  left join products p on p.id = od.product_id
                  left join orders o on o.id = od.orders_id
                  where o.status in ("delivered", "sending") and od.is_deleted = 0 group by date_format(od.date, '%d %M %y') order by od.date;`;
      const dataRevenue = await dba(sql);
      return res.status(200).send(dataRevenue);
    } catch (error) {
      return res.status(500).send({ message: "server error" });
    }
  },

  getWarehouseSales: async (req, res) => {
    try {
      let sql = `select sum(qty) as totalProduct, w.location from orders_detail od 
                  join orders o on o.id = od.orders_id
                  join warehouse w on o.warehouse_id = w.id
                  where o.status in ("delivered", "sending") and od.is_deleted = 0 group by w.id;`;
      const dataWarehouse = await dba(sql);
      return res.status(200).send(dataWarehouse);
    } catch (error) {
      return res.status(500).send({ message: "server error" });
    }
  },

  getRevenue: (req, res) => {
    const { startDate, endDate } = req.query;
    let sql = `select sum(od.qty*od.price) as revenue from orders_detail od
    join orders o on od.orders_id = o.id
    where status in ('delivered', 'sending')`;
    if (startDate && endDate) {
      sql += ` and o.updated_at between '${startDate} 00:00:00' and '${endDate} 23:59:00'`;
    }
    mysqldb.query(sql, (error, result) => {
      if (error) {
        console.error(error);
        return res.status(500).send({ message: "Server error" });
      }
      if (!result.length) {
        return res.status(204).send({ message: "No data" });
      }
      return res.status(200).send(result);
    });
  },

  potentialRevenue: (req, res) => {
    let sql = `select sum(od.qty * od.price) as potentialRevenue from orders_detail od
    join orders o on od.orders_id = o.id
    where not o.status = 'on cart'`;
    mysqldb.query(sql, (error, result) => {
      if (error) {
        console.error(error);
        return res.status(500).send({ message: "Server error" });
      }
      return res.status(200).send(result);
    });
  },

  getListWarehouse: async (req, res) => {
    try {
      let sql = `select w.*, count(o.warehouse_id) as totalOrders, ot.totalAdmin as totalAdmin from warehouse w
                left join orders o on w.id = o.warehouse_id
                left join (
                select u.role, w.location, count(u.role) as totalAdmin
                from warehouse w
                left join users u on w.role_id = u.role
                group by w.id
                ) as ot on ot.location = w.location
                group by w.id`;
      const listWarehouse = await dba(sql);
      return res.status(200).send(listWarehouse);
    } catch (error) {
      console.log(error);
      return res.status(500).send(error);
    }
  },

  addWarehouse: async (req, res) => {
    try {
      const { location, latitude, longitude, warehouse } = req.body;
      let listRole = [];
      let sql = `select w.*, count(o.warehouse_id) as totalOrders, ot.totalAdmin as totalAdmin from warehouse w
                left join orders o on w.id = o.warehouse_id
                left join (
                select u.role, w.location, count(u.role) as totalAdmin
                from warehouse w
                left join users u on w.role_id = u.role
                group by w.id
                ) as ot on ot.location = w.location
                group by w.id`;
      const getListWarehouse = await dba(sql);
      getListWarehouse.forEach(async (val, index) => {
        return listRole.push(val.role_id);
      });
      sql = `select * from warehouse w
                where w.location = "${location}" 
                or w.latitude = ?
                or w.longitude = ?`;

      let listWarehouse = await dba(sql, [latitude, longitude]);
      let role_id = Math.max(...listRole) + 1;
      if (listWarehouse.length) {
        return res.status(200).send({ message: "Warehouse already exists" });
      } else {
        let dataInsert = {
          location: location,
          latitude: latitude,
          longitude: longitude,
          role_id: role_id,
        };
        sql = `insert into warehouse set ?`;
        await dba(sql, [dataInsert]);
        return res.status(200).send({ message: "Warehouse added successfully" });
      }
    } catch (error) {
      console.log(error);
      return res.status(500).send(error);
    }
  },
};
