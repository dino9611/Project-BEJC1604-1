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
      let sql = `select p.name, p.price, p.description, p.image, c.category_name, r.role, wl.qty, wl.status, w.location, 
                    date_format(wl.created_at,'%d-%m-%y') as date, time_format(wl.created_at, '%H:%i') as hour_
                    from warehouse_log wl
                    join products p on wl.product_id = p.id
                    join warehouse w on wl.warehouse_id = w.id
                    join category c on p.category_id = c.id
                    join role r on w.role_id = r.id 
                    join users u on u.role = r.id
                    where r.role = ? ${statusSql};`;
      const dataProducts = await dba(sql, [role]);
      console.log(dataProducts);
      return res.status(200).send(dataProducts);
    } catch (error) {
      return res.status(500).send({ message: "server error" });
    }
  },
};
