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
        return res.status(400).send({
          message:
            "The username or password you entered does not match our records. Please check and try again.",
        });
      }
    } catch (error) {
      console.error(error);
      return res.status(500).send({ message: "server error" });
    }
  },
  DetailTransaction: async (req, res) => {
    try {
      const { uid } = req.user;
      const { orders_id } = req.query;
      let sql = `select
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
              od.qty as quantity, 
              od.price,
              w.location as warehouse,
              od.qty*od.price as amount,
              od.product_id
              from orders o
              join orders_detail od on o.id = od.orders_id
              join products p on p.id = od.product_id
              join category c on p.category_id = c.id
              join warehouse w on o.warehouse_id = w.id
              join users u on u.id = o.users_id
              where o.warehouse_id = ? and od.orders_id = ${orders_id}`;
        const dataTransaction = await dba(sql, dataAdmin[0].warehouse_id);
        return res.status(200).send(dataTransaction);
      } else {
        sql = `select u.id, concat(u.first_name,' ',u.last_name) as name, 
              u.role 
              from users u
              join role r on r.id = u.role
              where u.uid = ?`;
        const dataAdminSuper = await dba(sql, [uid]);
        if (dataAdminSuper[0]) {
          sql = `select concat(year(o.updated_at),"-",month(o.updated_at),"-",day(o.updated_at)) as dateTime, 
                concat(hour(o.updated_at),".",minute(o.updated_at)) as hourTime,  
                concat(u.first_name,' ',u.last_name) as name, 
                o.status, p.name as productName, 
                c.category_name as category, 
                o.invoice_number, 
                od.qty as quantity, 
                od.price,
                w.location as warehouse,
                o.warehouse_id,
                od.qty*od.price as amount
                from orders o
                join orders_detail od on o.id = od.orders_id
                join products p on p.id = od.product_id
                join category c on p.category_id = c.id
                join warehouse w on o.warehouse_id = w.id
                join users u on u.id = o.users_id
                where od.orders_id = ${orders_id}`;
          // console.log(orders_id);
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
  TransactionAdmin: async (req, res) => {
    try {
      const { uid } = req.user;
      const { orders_id } = req.query;
      let sql = `select
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
              od.qty as quantity, 
              od.price,
              w.location as warehouse,
              od.qty*od.price as amount
              from orders o
              join orders_detail od on o.id = od.orders_id
              join products p on p.id = od.product_id
              join category c on p.category_id = c.id
              join warehouse w on o.warehouse_id = w.id
              join users u on u.id = o.users_id
              where o.warehouse_id = ? and od.orders_id = ${orders_id}`;
        const dataTransaction = await dba(sql, dataAdmin[0].warehouse_id);
        return res.status(200).send(dataTransaction);
      } else {
        sql = `select u.id, concat(u.first_name,' ',u.last_name) as name, 
              u.role 
              from users u
              join role r on r.id = u.role
              where u.uid = ?`;
        const dataAdminSuper = await dba(sql, [uid]);
        if (dataAdminSuper[0]) {
          sql = `select concat(year(o.updated_at),"-",month(o.updated_at),"-",day(o.updated_at)) as dateTime, 
                concat(hour(o.updated_at),".",minute(o.updated_at)) as hourTime,  
                concat(u.first_name,' ',u.last_name) as name, 
                o.status, p.name as productName, 
                c.category_name as category, 
                o.invoice_number, 
                od.qty as quantity, 
                od.price,
                w.location as warehouse,
                o.warehouse_id,
                od.qty*od.price as amount
                from orders o
                join orders_detail od on o.id = od.orders_id
                join products p on p.id = od.product_id
                join category c on p.category_id = c.id
                join warehouse w on o.warehouse_id = w.id
                join users u on u.id = o.users_id
                where od.orders_id = ${orders_id}`;
          // console.log(orders_id);
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
  Transaction: async (req, res) => {
    try {
      const { uid } = req.user;
      const {
        status,
        rowPerPage,
        page,
        monthFrom,
        monthTo,
        warehouse_id,
      } = req.query;
      let statusSql = "";
      let statusSqlSuper = "";
      let filterByDateSql = "";
      let filterByWarehouse = "";
      let filterByWarehouseID = "";
      if (status) {
        statusSql = `and status = ${mysqldb.escape(status)}`;
        statusSqlSuper = `and status = ${mysqldb.escape(status)}`;
      }
      // console.log(monthFrom, monthTo);
      if (monthFrom || monthTo) {
        filterByDateSql = `and o.updated_at between ${mysqldb.escape(
          monthFrom
        )} and ${mysqldb.escape(monthTo)}`;
      }
      if (warehouse_id) {
        filterByWarehouse = `where o.warehouse_id = ${mysqldb.escape(
          parseInt(warehouse_id)
        )}`;
        filterByWarehouseID = `and o.warehouse_id = ${mysqldb.escape(
          parseInt(warehouse_id)
        )}`;
      }
      // console.log(req.query)
      let sql = `select
                w.id as warehouse_id 
                from users u
                join role r on r.id = u.role
                join warehouse w on w.role_id = u.role
                where u.uid = ?`;
      const dataAdmin = await dba(sql, [uid]);
      // console.log(dataAdmin[0], "ini data admin")
      if (dataAdmin[0]) {
        sql = `select concat(year(o.updated_at),"-",month(o.updated_at),"-",day(o.updated_at)) as dateTime,
              concat(u.first_name,' ',u.last_name) as name,
              o.status,
              o.invoice_number as invoice,
              sum(od.qty * od.price) as amountTotal,
              o.id,
              o.warehouse_id,
              od.orders_id,
              w.location as warehouse
              from orders o
              join orders_detail od on o.id = orders_id
              join users u on u.id = o.users_id
              join warehouse w on o.warehouse_id = w.id
              where warehouse_id = ? ${filterByDateSql}
              ${statusSql}
              group by o.id
              order by o.updated_at desc
              limit ${parseInt(page) * parseInt(rowPerPage)},${parseInt(
              rowPerPage)}`;
        const dataTransaction = await dba(sql, dataAdmin[0].warehouse_id);
        sql = `select count(*) as totalData
              from orders o
              where warehouse_id = ${dataAdmin[0].warehouse_id}
              ${statusSql} ${filterByDateSql}`;
        let totalData = await dba(sql);
        return res
          .status(200)
          .send({ dataTransaction, totalData: totalData[0].totalData });
      } else {
        sql = `select u.role from users u
              join role r on r.id = u.role
              where u.uid = ?`;
        const dataAdminSuper = await dba(sql, [uid]);
        // console.log(dataAdminSuper[0].role, "ini data adminsuper");
        if (dataAdminSuper[0]) {
          sql = `select concat(year(o.updated_at),"-",month(o.updated_at),"-",day(o.updated_at)) as dateTime,
                concat(u.first_name,' ',u.last_name) as name,
                o.status,
                o.invoice_number as invoice,
                sum(od.qty * od.price) as amountTotal,
                o.id,
                od.orders_id,
                w.location as warehouse
                from orders o
                join orders_detail od on o.id = orders_id
                join users u on u.id = o.users_id
                join warehouse w on o.warehouse_id = w.id
                ${filterByWarehouse} ${statusSqlSuper} ${filterByDateSql}
                group by o.id
                order by o.updated_at desc
                limit ${parseInt(page) * parseInt(rowPerPage)},${parseInt(
            rowPerPage
          )}`;
          const dataTransaction = await dba(sql);
          sql = `select count(*) as totalData
                from orders o
                where o.id is true ${filterByWarehouseID} ${statusSqlSuper} ${filterByDateSql}`;
          let totalData = await dba(sql);
          return res.status(200).send({
            dataTransaction,
            totalData: totalData[0].totalData,
            roleAdmin: parseInt(dataAdminSuper[0].role),
          });
        } else {
          return res.status(500).send({ message: "data not found" });
        }
      }
    } catch (error) {
      console.log(error);
      return res.status(500).send(error);
    }
  },
  ConfirmTransactionAdmin: async (req, res) => {
    try {
      const { uid } = req.user;
      const { id } = req.body;
      // console.log(uid, 'ini uid admin')
      let dataUpdate = {
        status: "processed",
      };
      let sql = `update orders set ? where id = ?;`;
      await dba(sql, [dataUpdate, id]);
      sql = `select od.qty, o.warehouse_id, od.product_id
            from orders o
            join orders_detail od on o.id = orders_id
            where o.id = ?`
      let dataOd = await dba(sql, id)
      sql = `insert into products_location set ? `
      for(let i = 0; i<dataOd.length; i++){
        let dataInput = {
          warehouse_id: dataOd[i].warehouse_id,
          orders_id: id,
          readyToSend: 1,
          qty: -1*dataOd[i].qty,
          products_id: dataOd[i].product_id
        }
        await dba (sql, dataInput)
      }
      sql = `select u.id, concat(u.first_name,' ',u.last_name) as name, 
            u.role, r.role as warehouse, 
            w.id as warehouse_id 
            from users u
            join role r on r.id = u.role
            join warehouse w on w.role_id = u.role
            where u.uid = ?`;
      const dataAdmin = await dba(sql, [uid]);
      if (dataAdmin) {
        sql = `select concat(year(o.updated_at),"-",month(o.updated_at),"-",day(o.updated_at)) as dateTime,
              concat(u.first_name,' ',u.last_name) as name,
              o.status,
              o.invoice_number as invoice,
              sum(od.qty * od.price) as amountTotal,
              o.id
              from orders o
              join orders_detail od on o.id = orders_id
              join users u on u.id = o.users_id
              where warehouse_id = ?
              group by o.id`;
        const dataTransaction = await dba(sql, dataAdmin[0].warehouse_id);
        return res.status(200).send(dataTransaction);
      }
    } catch (error) {
      console.log(error);
      return res.status(500).send(error);
    }
  },
  RejectTransactionAdmin: async (req, res) => {
    try {
      const { uid } = req.user;
      const { id } = req.body;
      // console.log(uid, 'ini uid admin')
      let dataUpdate = {
        status: "rejected",
      };
      let sql = `update orders set ? where id = ?;`;
      await dba(sql, [dataUpdate, id]);
      sql = `select u.id, concat(u.first_name,' ',u.last_name) as name, 
            u.role, r.role as warehouse, 
            w.id as warehouse_id 
            from users u
            join role r on r.id = u.role
            join warehouse w on w.role_id = u.role
            where u.uid = ?`;
      const dataAdmin = await dba(sql, [uid]);
      if (dataAdmin) {
        sql = `select concat(year(o.updated_at),"-",month(o.updated_at),"-",day(o.updated_at)) as dateTime,
              concat(u.first_name,' ',u.last_name) as name,
              o.status,
              o.invoice_number as invoice,
              sum(od.qty * od.price) as amountTotal,
              o.id
              from orders o
              join orders_detail od on o.id = orders_id
              join users u on u.id = o.users_id
              where warehouse_id = ?
              group by o.id`;
        const dataTransaction = await dba(sql, dataAdmin[0].warehouse_id);
        return res.status(200).send(dataTransaction);
      }
    } catch (error) {
      console.log(error);
      return res.status(500).send(error);
    }
  },
  GetDataAdmin: async (req, res) => {
    try {
      const { uid } = req.user;
      let sql = `select u.role
                from users u
                where u.uid = ?`;
      const dataAdmin = await dba(sql, uid);
      if (dataAdmin[0].role == 2) {
        sql = `select concat(u.first_name,' ',u.last_name) as name,
              u.role
              from users u
              where u.uid = ?`;
        const dataAdminSuper = await dba(sql, uid);
        console.log(dataAdminSuper);
        return res.status(200).send(dataAdminSuper);
      } else {
        sql = `select concat(u.first_name,' ',u.last_name) as name,
              w.location as warehouse,
              u.role
              from users u
              join warehouse w on w.role_id = u.role
              where u.uid = ?`;
        const dataAdminWarehouse = await dba(sql, uid);
        console.log(dataAdminWarehouse);
        return res.status(200).send(dataAdminWarehouse);
      }
    } catch (error) {
      return res.status(500).send(error);
    }
  },
  ProcessingProduct: async (req, res) => {
    try {
      const { uid } = req.user;
      const { orders_id } = req.query;
      let sql = `select
                w.id as warehouse_id 
                from users u
                join role r on r.id = u.role
                join warehouse w on w.role_id = u.role
                where u.uid = ?`;
      const dataAdmin = await dba(sql, [uid]);
      sql = `select p.name as productName, od.product_id, od.qty, sum(pl.qty) as stock, od.on_request from orders_detail od
            join products_location pl on od.product_id = pl.products_id
            join products p on od.product_id = p.id
            where pl.warehouse_id = ? and od.orders_id = ? and pl.readyToSend = 0
            group by od.product_id`;
      const dataOrders = await dba(sql, [dataAdmin[0].warehouse_id, orders_id]);
      console.log(dataOrders)
      return res.status(200).send(dataOrders);
    } catch (error) {
      return res.status(500).send(error);
    }
  },
  GetLocationNearWarehouse: async (req, res) => {
    try {
      const { uid } = req.user;
      const {productId} = req.query;
      let sql = `select w.id, w.location as warehouse, w.latitude, w.longitude
                from users u
                join role r on r.id = u.role
                join warehouse w on w.role_id = u.role
                where u.uid = ?`;
      const dataAdmin = await dba(sql, [uid]);
      sql = `select * from warehouse w 
            join (select sum(pl.qty) as stock, pl.warehouse_id from products_location pl
            where pl.products_id = ? and pl.readyToSend = 0
            group by pl.warehouse_id) as pl on w.id = pl.warehouse_id
            where not w.id = ?`
      const dataWarehouse = await dba(sql, [productId, dataAdmin[0].id]);
      let warehouseOrdered = geolib.orderByDistance({ latitude: dataAdmin[0].latitude, longitude: dataAdmin[0].longitude}, dataWarehouse);
      // console.log(warehouseOrdered)
      return res.status(200).send(warehouseOrdered);

    } catch (error) {
      return res.status(500).send(error);
    }
  },
  RequestStock: async (req, res) => {
    try {
      const { uid } = req.user;
      const { productId, transactionOrder, orders_id } = req.body;
      let sql = `select w.id as warehouse_id , w.location as warehouse, w.latitude, w.longitude
                from users u
                join role r on r.id = u.role
                join warehouse w on w.role_id = u.role
                where u.uid = ?`;
      const dataAdmin = await dba(sql, [uid]);

      transactionOrder.forEach( async (val) => {
        let dataInsert = {
          products_id: productId,
          orders_id: orders_id,
          qty: val.qtyReq,
          warehouse_destinationId: val.warehouse_id,
          warehouse_originId: dataAdmin[0].warehouse_id,
          request_status: "propose"
        }
        sql = `insert into log_request set ?`
        await dba(sql, [dataInsert]);
      })

      sql = `update orders_detail set on_request = 1 where product_id = ? and orders_id = ?`
      await dba(sql, [productId, orders_id]);
      return res.status(200).send({ message: "request berhasil dilakukan" });
    } catch (error) {
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
        return res.status(500).send({ message: 'Server error' });
      }
      if (!result.length) {
        return res.status(204).send({ message: 'No data' });
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
        return res.status(500).send({ message: 'Server error' });
      }
      return res.status(200).send(result);
    });
  },



};
