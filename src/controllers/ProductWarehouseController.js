const { mysqldb } = require("../connection");
const { promisify } = require("util");
const dba = promisify(mysqldb.query).bind(mysqldb);

module.exports = {
  getProductsInOut: async (req, res) => {
    try {
      const { role } = req.user;
      const { status } = req.query;
      //   console.log(role);
      let statusSql = "";
      if (status) {
        statusSql = `and wl.status = ${mysqldb.escape(status)}`;
      }
      let sql = `select p.name, p.price, p.description, p.image, c.category_name, wl.qty, wl.status, w.location, 
                  date_format(wl.created_at,'%d-%m-%y') as date, time_format(wl.created_at, '%H:%i') as hour_
                  from warehouse_log wl
                  join products p on wl.product_id = p.id
                  join warehouse w on wl.warehouse_id = w.id
                  join category c on p.category_id = c.id
                  where w.role_id = ? ${statusSql};`;
      const dataProducts = await dba(sql, [role]);
      console.log(dataProducts);
      return res.status(200).send(dataProducts);
    } catch (error) {
      return res.status(500).send({ message: "server error" });
    }
  },

  getProductsWarehouse: async (req, res) => {
    try {
      const { role } = req.user;
      const { pages, limit } = req.query;
      let sql = `select p.id, p.name, p.price, p.image, date_format(p.updated_at, "%d-%M-%y") as month_, 
                  c.category_name, ifnull(stock, 0) as stock from products p
                  left join (select sum(qty) as stock, products_id, r.role from products_location pl
                  join warehouse w on pl.warehouse_id = w.id
                  join role r on r.id = w.role_id
                  where w.role_id = ? and readyToSend = 0
                  group by products_id) as pl on pl.products_id = p.id
                  join category c on c.id = p.category_id
                  where p.is_deleted = 0 limit ${
                    parseInt(pages) * parseInt(limit)
                  },${parseInt(limit)};`;
      const dataProducts = await dba(sql, [role]);
      sql = `select count(*) as totaldata from products p
              join category c on p.category_id = c.id
              where p.is_deleted = 0`;
      const totalData = await dba(sql);
      console.log(dataProducts);
      console.log(totalData);
      return res
        .status(200)
        .send({ dataProducts, totalData: totalData[0].totaldata });
    } catch (error) {
      return res.status(500).send({ message: "server error" });
    }
  },

  updateStock: async (req, res) => {
    try {
      const { role } = req.user;
      const data = req.body;
      console.log(data);
      let sql = `select w.id from role r
                  join warehouse w on w.role_id = r.id
                  where w.role_id = ?;`;
      const dataAdmin = await dba(sql, [role]);
      console.log(dataAdmin);
      sql = `select ifnull(stock, 0) as stock from products p
              left join (select sum(qty) as stock, products_id, r.role from products_location pl
              join warehouse w on pl.warehouse_id = w.id
              join role r on r.id = w.role_id
              where w.role_id = ? and readyToSend = 0
              group by products_id) as pl on pl.products_id = p.id
              join category c on c.id = p.category_id
              where p.is_deleted = 0 and p.id = ?;`;
      const currentStock = await dba(sql, [role, data.products_id]);
      console.log(currentStock);
      let id_warehouse = dataAdmin[0].id;
      let dataInsert = {
        products_id: data.products_id,
        qty: data.qty - currentStock[0].stock,
        warehouse_id: id_warehouse,
      };
      sql = `insert into products_location set ?`;
      const updateInsert = await dba(sql, [dataInsert]);
      return res.status(200).send(updateInsert);
    } catch (error) {
      return res.status(500).send({ message: "server error" });
    }
  },
};
