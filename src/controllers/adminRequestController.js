const { mysqldb } = require("../connection");
const { promisify } = require("util");
const {
  createAccessToken,
  createTokenRefresh,
} = require("../helpers/createToken");
const dba = promisify(mysqldb.query).bind(mysqldb);

module.exports = {
  GetRequestFromAnotherWarehouse: async (req, res) => {
    try {
      const { uid } = req.user;
      const {rowPerPage, page} = req.query;
      console.log(rowPerPage, page)
      let sql = `select
                w.id as warehouse_id 
                from users u
                join role r on r.id = u.role
                join warehouse w on w.role_id = u.role
                where u.uid = ?`;
      const dataAdmin = await dba(sql, [uid]);
      sql = `select sum(pl.qty) as stock,
            w.location as warehouseAsal, 
            w.id as warehouseAsalId,
            p.name as productName, 
            lr.orders_id,
            lr.products_id,
            lr.qty as requestStock, 
            lr.request_status as status, 
            date_format(lr.updated_at, "%Y %M %d") as date
            from log_request lr
            join products_location pl on lr.products_id = pl.products_id
            join warehouse w on w.id = lr.warehouse_originid
            join products p on p.id = lr.products_id
            where pl.readyToSend = 0 and pl.warehouse_id = ? and lr.warehouse_destinationid = ?
            group by lr.products_id
            limit ${parseInt(page) * parseInt(rowPerPage)},${parseInt(rowPerPage)}`;
      const dataRequest = await dba(sql, [dataAdmin[0].warehouse_id, dataAdmin[0].warehouse_id]);
      sql = `select count(*) as totalData
            from log_request lr
            join products_location pl on lr.products_id = pl.products_id
            where pl.warehouse_id = ?`;
      let totalData = await dba(sql, dataAdmin[0].warehouse_id);
      return res.status(200).send({ dataRequest, totalData: totalData[0].totalData });
    } catch (error) {
      console.log(error);
      return res.status(500).send(error);
    }
  },
  AcceptRequest: async (req, res) => {
    try {
      const { uid } = req.user;
      const { id, request_list } = req.body;
      let orders_id = 0
      let sql = `select
                w.id as warehouse_id 
                from users u
                join role r on r.id = u.role
                join warehouse w on w.role_id = u.role
                where u.uid = ?`;
      const dataAdmin = await dba(sql, [uid]);
      request_list.forEach(async (val) => {
        orders_id = val.orders_id
        // table warehouse_log
        let dataInsert = {
          product_id: id,
          warehouse_id: dataAdmin[0].warehouse_id,
          qty: val.requestStock,
          status: "out"
        };
        sql = `insert into warehouse_log set ?`;
        await dba(sql, [dataInsert]);
        dataInsert = {
          product_id: id,
          warehouse_id: val.warehouseAsalId,
          qty: val.requestStock,
          status: "in"
        };
        sql = `insert into warehouse_log set ?`;
        await dba(sql, [dataInsert]);

        // product_location
        dataInsert = {
          products_id: id,
          warehouse_id: val.warehouseAsalId,
          qty: val.requestStock,
          orders_id: orders_id
        };
        sql = `insert into products_location set ?`;
        await dba(sql, [dataInsert]);
        dataInsert = {
          products_id: id,
          warehouse_id: dataAdmin[0].warehouse_id,
          qty: -val.requestStock,
          orders_id: orders_id
        };
        sql = `insert into products_location set ?`;
        await dba(sql, [dataInsert]);

      });
      sql = `update log_request set request_status = "accepted" where products_id = ? and orders_id = ?`;
      await dba(sql, [id, orders_id]);
      sql = `update orders_detail set on_request = 0 where product_id = ? and orders_id = ?`;
      await dba(sql, [id, orders_id]);
      return res.status(200).send({ message: "stok berhasil dikirim" });
    } catch (error) {
      console.log(error);
    }
  },
  RejectRequest: async (req, res) => {
    try {
      const { id, request_list } = req.body;
      let orders_id = 0
      request_list.forEach(async (val) => {
        orders_id = val.orders_id
      });
      let sql = `update log_request set request_status = "rejected" where products_id = ? and orders_id = ?`;
      await dba(sql, [id, orders_id]);
      sql = `update orders_detail set on_request = 0 where product_id = ? and orders_id = ?`;
      await dba(sql, [id, orders_id]);
      return res.status(200).send({ message: "request is rejected" });
    } catch (error) {
      console.log(error);
    }
  }
};
