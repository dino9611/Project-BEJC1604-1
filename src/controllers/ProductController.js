const { mysqldb } = require("../connection");
const { promisify } = require("util");
const dba = promisify(mysqldb.query).bind(mysqldb);

module.exports = {
  getAllProducts: async (req, res) => {
    try {
      let sql = `select p.id, p.name, p.price, p.description, p.image, sum(pl.qty) as quantity, c.category_name as category  
                       from products p 
                       left join products_location pl on p.id = pl.products_id 
                       left join warehouse w on pl.warehouse_id = w.id 
                       join category c on p.category_id = c.id where p.is_deleted = 0 group by p.id;
                       `;
      let dataProduct = await dba(sql);
      return res.status(200).send(dataProduct);
    } catch (error) {
      return res.status(500).send({ message: "server error" });
    }
  },

  getProductPaginate: async (req, res) => {
    try {
      const { pages, limit, status } = req.query;
      let statusSql = "";
      if (!pages || !limit)
        return res.status(400).send({ message: "Pages/limit harus diisi" });
      if (status) {
        statusSql = `and c.category_name = ${mysqldb.escape(status)}`;
      }
      let sql = `select p.id, p.name, p.price, p.description, p.image, sum(pl.qty) as quantity, c.category_name as category, w.location  
                        from products p 
                        left join products_location pl on p.id = pl.products_id 
                        left join warehouse w on pl.warehouse_id = w.id 
                        join category c on p.category_id = c.id 
                        where p.is_deleted = 0 ${statusSql}
                        group by p.id 
                        limit ${mysqldb.escape(
                          (parseInt(pages) - 1) * 12
                        )},${mysqldb.escape(parseInt(limit))}`;
      const dataProduct = await dba(sql);
      sql = `select count(*) as totaldata from products p
              join category c on p.category_id = c.id
              where p.is_deleted = 0 ${statusSql};`;
      const countProduct = await dba(sql);
      return res.status(200).send({
        dataProduct,
        totaldata: countProduct[0].totaldata,
      });
    } catch (error) {
      return res.status(500).send({ message: "server error" });
    }
  },

  getProductDetail: async (req, res) => {
    try {
      const { id } = req.params;
      let sql = `select p.id, p.name, p.price, p.description, p.image, sum(pl.qty) as quantity, c.category_name as category, w.location 
                  from products p 
                  left join products_location pl on p.id = pl.products_id 
                  left join warehouse w on pl.warehouse_id = w.id 
                  join category c on p.category_id = c.id where p.is_deleted = 0 and p.id = ${id} group by w.location ;
                  `;
      const productDetail = await dba(sql, [id]);
      return res.status(200).send(productDetail);
    } catch (error) {
      return res.status(500).send({ message: "server error" });
    }
  },

  getCategory: async (req, res) => {
    try {
      let sql = `select category_name from category;`;
      const dataCategory = await dba(sql);
      return res.status(200).send(dataCategory);
    } catch (error) {
      return res.status(500).send({ message: "server error" });
    }
  },
};
