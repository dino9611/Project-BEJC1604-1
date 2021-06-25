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

module.exports = {
  TransactionAdmin: async (req, res) => {
    try {
      const { uid } = req.user;
      // console.log(uid, 'ini uid admin')
      let sql = `select u.id, concat(u.first_name,' ',u.last_name) as name, u.role, r.role as warehouse, w.id as warehouse_id from users u
      join role r on r.id = u.role
      join warehouse w on w.role_id = u.role
      where u.uid = ?`
      let dataAdmin = await dba(sql, [uid]);
      console.log(dataAdmin[0].warehouse_id, 'ini data warehouse admin')


      sql = `select concat(year(o.updated_at),"-",month(o.updated_at),"-",day(o.updated_at)) as dateTime, 
      concat(hour(o.updated_at),".",minute(o.updated_at)) as hourTime,  
      concat(u.first_name,' ',u.last_name) as name, 
      o.status, p.name as productName, od.qty as quantity, od.qty*od.price as amount
      from orders o
      join orders_detail od on o.id = od.orders_id
      join products p on p.id = od.product_id
      join users u on u.id = o.users_id
      where o.warehouse_id = ?`;
      let dataTransaction = await dba(sql, dataAdmin[0].warehouse_id);
      return res.status(200).send(dataTransaction);
    } catch (error) {
      console.log(error);
      return res.status(500).send({ message: "server error" });
    }
  },
};
