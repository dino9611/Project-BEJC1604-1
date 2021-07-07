const { mysqldb } = require("../connection");
const { promisify } = require("util");
const dba = promisify(mysqldb.query).bind(mysqldb);

module.exports = {
  Transaction: async (req, res) => {
    try {
      const { uid } = req.user;
      const { status, rowPerPage, page, monthFrom, monthTo, warehouse_id } = req.query;
      let statusSql = "";
      let statusSqlSuper = "";
      let filterByDateSql = "";
      let filterByWarehouse = "";
      let filterByWarehouseID = "";
      if (status) {
        statusSql = `and status = ${mysqldb.escape(status)}`;
        statusSqlSuper = `and status = ${mysqldb.escape(status)}`;
      }
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
      let sql = `select
                w.id as warehouse_id 
                from users u
                join role r on r.id = u.role
                join warehouse w on w.role_id = u.role
                where u.uid = ?`;
      const dataAdmin = await dba(sql, [uid]);
      if (dataAdmin[0]) {
        sql = `select date_format(o.updated_at, "%Y %M %d") as dateTime,
              concat(u.first_name,' ',u.last_name) as name,
              o.status,
              o.bukti_pembayaran as bukti,
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
          .send({ dataTransaction, totalData: totalData[0].totalData, bukti: dataTransaction[0].bukti });
      } else {
        sql = `select u.role from users u
              join role r on r.id = u.role
              where u.uid = ?`;
        const dataAdminSuper = await dba(sql, [uid]);
        if (dataAdminSuper[0]) {
          sql = `select date_format(o.updated_at, "%Y %M %d") as dateTime,
                concat(u.first_name,' ',u.last_name) as name,
                o.status,
                o.bukti_pembayaran as bukti,
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
                limit ${parseInt(page) * parseInt(rowPerPage)},${parseInt(rowPerPage)}`;
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
        sql = `select date_format(o.updated_at, "%H.%i") as hourTime, 
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
              where o.warehouse_id = ? and od.orders_id = ${orders_id} and od.is_deleted = 0`;
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
          sql = `select date_format(o.updated_at, "%H.%i") as hourTime,  
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
  ConfirmTransactionAdmin: async (req, res) => {
    try {
      const { uid } = req.user;
      const { id } = req.body;
      let dataUpdate = {
        status: "processed",
      };
      let sql = `update orders set ? where id = ?;`;
      await dba(sql, [dataUpdate, id]);
      sql = `select od.qty, o.warehouse_id, od.product_id
            from orders o
            join orders_detail od on o.id = orders_id 
            where o.id = ? and od.is_deleted = 0`;
      let dataOd = await dba(sql, id);
      sql = `insert into products_location set ? `;
      for (let i = 0; i < dataOd.length; i++) {
        let dataInput = {
          warehouse_id: dataOd[i].warehouse_id,
          orders_id: id,
          readyToSend: 1,
          qty: -1 * dataOd[i].qty,
          products_id: dataOd[i].product_id,
        };
        await dba(sql, dataInput);
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
        return res.status(200).send(dataAdminSuper);
      } else {
        sql = `select concat(u.first_name,' ',u.last_name) as name,
              w.location as warehouse,
              u.role
              from users u
              join warehouse w on w.role_id = u.role
              where u.uid = ?`;
        const dataAdminWarehouse = await dba(sql, uid);
        return res.status(200).send(dataAdminWarehouse);
      }
    } catch (error) {
      console.log(error);
      return res.status(500).send(error);
    }
  },
};
