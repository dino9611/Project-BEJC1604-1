const { mysqldb } = require("../connection");
const { promisify } = require("util");
const dba = promisify(mysqldb.query).bind(mysqldb);
const geolib = require("geolib");

module.exports = {
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
            where pl.warehouse_id = ? and od.orders_id = ? and pl.readyToSend = 0 and od.is_deleted = 0
            group by od.product_id`;
      const dataOrders = await dba(sql, [dataAdmin[0].warehouse_id, orders_id]);
      return res.status(200).send(dataOrders);
    } catch (error) {
      console.log(error);
      return res.status(500).send(error);
    }
  },
  GetLocationNearestWarehouse: async (req, res) => {
    try {
      const { uid } = req.user;
      const { productId } = req.query;
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
            where not w.id = ?`;
      const dataWarehouse = await dba(sql, [productId, dataAdmin[0].id]);
      let warehouseOrdered = geolib.orderByDistance(
        { latitude: dataAdmin[0].latitude, longitude: dataAdmin[0].longitude },
        dataWarehouse
      );
      return res.status(200).send(warehouseOrdered);
    } catch (error) {
      console.log(error);
      return res.status(500).send(error);
    }
  },
  RequestStockToAnotherWarehouse: async (req, res) => {
    try {
      const { uid } = req.user;
      const { productId, transactionOrder, orders_id } = req.body;
      let sql = `select w.id as warehouse_id , w.location as warehouse, w.latitude, w.longitude
                from users u
                join role r on r.id = u.role
                join warehouse w on w.role_id = u.role
                where u.uid = ?`;
      const dataAdmin = await dba(sql, [uid]);
      transactionOrder.forEach(async (val) => {
        let dataInsert = {
          products_id: productId,
          orders_id: orders_id,
          qty: val.qtyReq,
          warehouse_destinationId: val.warehouse_id,
          warehouse_originId: dataAdmin[0].warehouse_id,
          request_status: "propose",
        };
        sql = `insert into log_request set ?`;
        await dba(sql, [dataInsert]);
      });
      sql = `update orders_detail set on_request = 1 where product_id = ? and orders_id = ?`;
      await dba(sql, [productId, orders_id]);
      return res.status(200).send({ message: "request berhasil dilakukan" });
    } catch (error) {
      console.log(error);
      return res.status(500).send(error);
    }
  },
  SendingItem: async (req, res) => {
    try {
      const { row, transaction, transactionDetail } = req.body;
      transactionDetail.forEach(async (val) => {
        let dataInsert = {
          product_id: val.product_id,
          warehouse_id: transaction[0].warehouse_id,
          qty: val.qty,
          orders_id: row.orders_id,
          status: "out"
        };
        sql = `insert into warehouse_log set ?`;
        await dba(sql, [dataInsert]);
        let dataUpdate = {
          readyToSend: 0
        };
        sql = `update products_location set ? where orders_id = ? and warehouse_id = ? and products_id = ? and readyToSend = 0`;
        await dba(sql, [dataUpdate, row.orders_id, transaction[0].warehouse_id, val.product_id]);
      });
      let dataUpdate = {
        status: "sending",
      };
      sql = `update orders set ? where id = ?`;
      await dba(sql, [dataUpdate, row.orders_id]);
      return res.status(200).send({ message: "sending berhasil dilakukan" });
    } catch (error) {
      console.log(error);
      return res.status(500).send(error);
    }
  },
};
