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
      const { pages, limit, status, search, price } = req.query;
      let statusSql = "";
      let searchSql = "";
      let priceSql = "";
      if (!pages || !limit)
        return res.status(400).send({ message: "Pages/limit harus diisi" });
      if (status) {
        statusSql = `and c.category_name = ${mysqldb.escape(status)}`;
      }
      if (search) {
        searchSql = `and p.name like ${mysqldb.escape("%" + search + "%")}`;
      }
      if (price) {
        if (price === "asc") {
          priceSql = `order by p.price asc`;
        } else if (price === "desc") {
          priceSql = `order by p.price desc`;
        }
      }
      // if(search)
      let sql = `select p.id, p.name, p.price, p.description, p.image, sum(pl.qty) as quantity, c.category_name as category, w.location  
                          from products p 
                          left join products_location pl on p.id = pl.products_id 
                          left join warehouse w on pl.warehouse_id = w.id 
                          join category c on p.category_id = c.id 
                          where p.is_deleted = 0 ${statusSql} ${searchSql}
                          group by p.id 
                          ${priceSql}
                          limit ${mysqldb.escape(
                            (parseInt(pages) - 1) * parseInt(limit)
                          )},${mysqldb.escape(parseInt(limit))}`;
      console.log(searchSql);
      console.log(statusSql);
      console.log(priceSql);
      const dataProduct = await dba(sql);
      sql = `select count(*) as totaldata from products p
                join category c on p.category_id = c.id
                where p.is_deleted = 0 ${statusSql} ${searchSql}                        
                ${priceSql};`;
      const countProduct = await dba(sql);
      return res.status(200).send({
        dataProduct,
        totaldata: countProduct[0].totaldata,
      });
    } catch (error) {
      console.log(error)
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
