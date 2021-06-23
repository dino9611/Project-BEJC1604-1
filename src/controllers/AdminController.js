const { db } = require("./../connection");
const { uploader } = require("../helpers");
const fs = require("fs");
const { promisify } = require("util");
const dba = promisify(db.query).bind(db);

module.exports = {
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
      let sql = `select p.id, p.name, p.price, p.image, sum(pl.qty) as quantity, c.category_name as category, w.location  
                    from products p 
                    left join products_location pl on p.id = pl.products_id 
                    left join warehouse w on pl.warehouse_id = w.id 
                    join category c on p.category_id = c.id 
                    where p.is_deleted = 0 group by p.id 
                    limit ${db.escape((parseInt(pages) - 1) * 10)},${db.escape(
        parseInt(limit)
      )}`;
      const dataProduct = await dba(sql);
      return res.status(200).send(dataProduct);
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
      let sql = `select id, location from warehouse`;
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

        db.query(
          `insert into products set ?`,
          dataInsert,
          async (err, result) => {
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

            let sql = `select p.id, p.name, p.price, p.image, sum(pl.qty) as quantity, c.category_name as category, w.location
              from products p
              left join products_location pl on p.id = pl.products_id
              left join warehouse w on pl.warehouse_id = w.id
              join category c on p.category_id = c.id where p.is_deleted = 0 group by p.id`;
            const resultAddProduct = await dba(sql);
            return res.status(200).send(resultAddProduct);
          }
        );
      });
    } catch (error) {
      return res.status(500).send({ message: "server error" });
    }
  },

  deleteProduct: async (req, res) => {
    try {
      const { id } = req.params;
      let sql = `select * from products where id = ?`;

      db.query(sql, [id], (err, result) => {
        if (err) return res.status(500).send(err);
        sql = `update products set is_deleted = 1 where id = ?`;

        db.query(sql, [id], async (err) => {
          if (err) return res.status(500).send(err);
          if (result[0].image) {
            fs.unlinkSync("./public" + result[0].image);
          }

          sql = `select * from products where is_deleted = 0`;
          const dataProduct = await dba(sql);
          return res.status(200).send(dataProduct);
        });
      });
    } catch (error) {
      return res.status(500).send({ message: "server error" });
    }
  },
};
