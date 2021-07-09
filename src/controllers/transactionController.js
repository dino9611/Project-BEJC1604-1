const { mysqldb } = require("../connection");
const { promisify } = require("util");
const dba = promisify(mysqldb.query).bind(mysqldb);
const dbtransaction = promisify(mysqldb.beginTransaction).bind(mysqldb);
const dbcommit = promisify(mysqldb.commit).bind(mysqldb);
const { uploader } = require("../helpers");
const fs = require("fs");
const connection = require("../connection");
Date.prototype.addDays = function (days) {
  let date = new Date(this.valueOf());
  date.setDate(date.getDate() + days);
  return date;
};
const geolib = require("geolib");

const sqlCart = `select od.id as ordersdetail_id, p.id, p.name, p.price, p.category_id, p.image, o.status, o.users_id, o.warehouse_id, od.orders_id, od.product_id, od.qty from orders o
join orders_detail od on o.id = od.orders_id
join products p on od.product_id = p.id
where o.status = 'onCart' and users_id = ? and od.is_deleted = 0;`;

const generateInvoice = (orders_id, users_id) => {
  return "TRX" + orders_id + new Date().getTime() + users_id;
};

module.exports = {
  addToCart: (req, res) => {
    // algorithm : pertama cek dulu pada table orders apakah ada status = 'onCart' dengan users_id tersebut
    const { users_id, prod_id, qty } = req.body;
    if (!users_id || !prod_id || !qty) {
      return res.status(400).send({ message: "bad request" });
    }
    // let roleCheck = `select * from users where role = 1 and users_id = ?`;
    // mysqldb.query(roleCheck, [users_id], (error, hasilRole) => {
    //     if (error) {
    //         return res.status(401).send({ message: `Admin can't buy` });
    //     }
    //     if(hasilRole.length){

    //     }
    // });
    // mengecek apakah users sudah menambahkan produk ke cart atau belum
    // kalau ada maka, baca line setelah cart.length
    // kalau tidak ada akan menambahkan status ke table orders jadi onCart beserta users_id nya
    // dan juga memasukan qty, orders_id dan product_id ke table orders_detail
    let sql = `select * from orders where status = 'onCart' and users_id = ?;`;
    mysqldb.query(sql, [users_id], (error, cart) => {
      if (error) {
        console.log(error);
        return res.status(500).send({ message: "server error" });
      }
      if (cart.length) {
        // * cart.length true artinya cart sudah terbentuk
        // ? mencari tau apakah product sudah ada di cart atau belum
        // cart.length maksudnya adalah status = 'onCart' dan users_id tersebut sudah ada di table orders
        // maka tinggal edit qty saja di tabel orders_detail
        console.log("ini cart line 41", cart);
        sql = `select * from orders_detail where orders_id = ? and product_id = ? and is_deleted = 0`;
        let orders_id = cart[0].id;
        mysqldb.query(sql, [orders_id, prod_id], (error, isiCart) => {
          if (error) {
            return res.status(500).send({ message: "server error" });
          }
          console.log("ini isiCart line 48", isiCart);
          if (isiCart.length) {
            // artinya jika barangnya sudah ada di cart, maka kita tinggal ubah qty saja
            // pertama cek dulu apakah penambahan qty akan melebihi qty di inventory/products_location
            sql = `select sum(qty) as availableToUser, products_id from products_location where products_id = ? `;
            mysqldb.query(sql, [prod_id], (error, result1) => {
              if (error) {
                console.error(error);
                return res.status(500).send({ message: "server error" });
              }
              // kalau qty + qty yang sudah ada > qty inventory
              // maka gagalkan
              let qtyTotal = isiCart[0].qty + qty;
              if (qtyTotal > result1[0].availableToUser) {
                return res.status(500).send({ message: "Quantity over!" });
              }
              // *update qty di cart untuk produk tersebut
              sql = `update orders_detail set ? where id = ?;`;
              let detailUpdate = {
                qty: qtyTotal,
              };
              mysqldb.query(sql, [detailUpdate, isiCart[0].id], (error) => {
                if (error) {
                  console.error(error);
                  return res.status(500).send({ message: "server error" });
                }
                mysqldb.query(sqlCart, [users_id], (error, hasil) => {
                  if (error) {
                    console.error(error);
                    return res.status(500).send({ message: "server error" });
                  }
                  console.log("ini hasil", hasil);
                  return res.status(200).send(hasil);
                });
              });
            });
          } else {
            // kalau isiCart.length 0 artinya product tidak ada di dalam cart
            // oleh karena itu harus masukan product_id, orders_id dan qty ke orders_detail
            sql = `insert into orders_detail set ?`;
            let insertData = {
              product_id: prod_id,
              orders_id: orders_id,
              qty: qty,
            };
            mysqldb.query(sql, insertData, (error) => {
              if (error) {
                return res.status(500).send({ message: "server error" });
              }
              mysqldb.query(sqlCart, [users_id], (error, result2) => {
                if (error) {
                  return res.status(500).send({ message: "server error" });
                }
                return res.status(200).send(result2);
              });
            });
          }
        });
      } else {
        // kalau status 'onCart' dan users_id nya tidak ada di table orders
        // maka data akan dimasukan, ke table orders dan table orders_detail
        mysqldb.beginTransaction((error) => {
          if (error) {
            return res.status(500).send({ message: "server error" });
          }
          sql = `insert into orders set ?`;
          let dataInsert = {
            status: "onCart",
            users_id: users_id,
          };
          mysqldb.query(sql, [dataInsert], (error, result) => {
            if (error) {
              console.error(error);
              return mysqldb.rollback(() => {
                return res.status(500).send({ message: "server error" });
              });
            }
            sql = `insert into orders_detail set ?`;
            let detailInsert = {
              qty: qty,
              orders_id: result.insertId,
              product_id: prod_id,
            };
            mysqldb.query(sql, [detailInsert], (error) => {
              if (error) {
                console.error(error);
                return mysqldb.rollback(() => {
                  return res.status(500).send({ message: "server error" });
                });
              }
              mysqldb.commit((error) => {
                if (error) {
                  console.error(error);
                  return mysqldb.rollback(() => {
                    return res.status(500).send({ message: "server error" });
                  });
                }
                // get cart
                mysqldb.query(sqlCart, [users_id], (error, newCart) => {
                  if (error) {
                    console.log(error);
                    return res.status(500).send({ message: "server error" });
                  }
                  return res.status(200).send(newCart);
                });
              });
            });
          });
        });
      }
    });
  },
  getBank: async (req, res) => {
    try {
      let sql = `select * from bank`;
      const bank = await dba(sql);
      return res.status(200).send(bank);
    } catch (error) {
      console.error(error);
      return res.status(500).send({ message: "Server error" });
    }
  },
  checkOut: async (req, res) => {
    try {
      let {
        bank_id,
        address_id,
        users_id,
        users_latitude,
        users_longitude,
        orders_id,
        cart,
      } = req.body;
      let sql = `select * from warehouse`;
      let hasil = await dba(sql);
      let arrLatLong = hasil.map((val) => {
        return { latitude: val.latitude, longitude: val.longitude };
      });
      let users_location = {
        latitude: users_latitude,
        longitude: users_longitude,
      };
      let nearest = geolib.findNearest(users_location, arrLatLong);
      console.log(nearest);
      let dataWarehouseNear = hasil.filter(
        (val) =>
          val.latitude == nearest.latitude && val.longitude == nearest.longitude
      );
      let jarak = geolib.getDistance(users_location, nearest);
      let ongkirPerKm = Math.ceil(jarak / 1000) * 16000;
      sql = `update orders set ? where id = ?`;
      let dataUpdate = {
        bank_id: bank_id,
        address_id: address_id,
        warehouse_id: dataWarehouseNear[0].id,
        status: "awaiting payment",
        ongkir: ongkirPerKm,
      };
      await dba(sql, [dataUpdate, orders_id]);
      cart.forEach(async (val) => {
        try {
          let cartUpdate = {
            price: val.price,
          };
          await dba(`update orders_detail set ? where id = ?`, [
            cartUpdate,
            val.ordersdetail_id,
          ]);
        } catch (error) {
          console.error(error);
        }
      });
      let cart1 = await dba(sqlCart, [users_id]);
      return res.status(200).send(cart1);
    } catch (error) {
      console.error(error);
      return res.status(500).send({ message: "Server error" });
    }
  },
  getOrders: async (req, res) => {
    try {
      const { users_id } = req.params;
      let sql = `select o.*, b.name, b.account_number, sum(od.qty * od.price) as total from orders o 
            join bank b on b.id = o.bank_id
            join orders_detail od on od.orders_id = o.id
            where status = 'awaiting payment' and users_id = ?
            group by o.id
            order by updated_at`;
      let history = await dba(sql, users_id);
      return res.status(200).send(history);
    } catch (error) {
      console.error(error);
      return res.status(500).send({ message: "Server error" });
    }
  },
  uploadPayment: (req, res) => {
    try {
      const { orders_id } = req.params;
      const path = "/payment";

      const upload = uploader(path, "PAY").fields([{ name: "photo" }]);
      upload(req, res, async (error) => {
        if (error) {
          return res
            .status(500)
            .json({ message: "Upload photo failed!", error: error.message });
        }
        console.log("success");
        console.log(req.files);
        const { photo } = req.files;
        const imagePath = photo ? path + "/" + photo[0].filename : null;
        console.log(imagePath);
        const data = JSON.parse(req.body.data);
        const dataUpdate = {
          invoice_number: generateInvoice(orders_id, data.users_id),
          status: "awaiting confirmation",
          bukti_pembayaran: imagePath,
        };
        try {
          let sql = `update orders set ? where id = ?`;
          await dba(sql, [dataUpdate, orders_id]);
          sql = `select o.*, b.name, b.account_number, sum(od.qty * od.price) as total from orders o 
                    join bank b on b.id = o.bank_id
                    join orders_detail od on od.orders_id = o.id
                    where status = 'awaiting payment' and users_id = ?
                    group by o.id
                    order by updated_at`;
          const result = await dba(sql, [data.users_id]);
          return res.status(200).send(result);
        } catch (error) {
          console.error(error);
          if (imagePath) {
            fs.unlink("./public" + imagePath);
          }
          return res.status(500).send({ message: "Server error" });
        }
      });
    } catch (error) {
      console.error(error);
      return res.status(500).send({ message: "Server error" });
    }
  },
  getDetailOrders: async (req, res) => {
    try {
      const { orders_id } = req.params;
      let sql = `select p.name as productName, c.category_name as category, 
                     od.qty as quantity, 
                     od.price, od.qty*od.price as amount
                    from orders o
                    join orders_detail od on o.id = od.orders_id
                    join products p on p.id = od.product_id
                    join category c on p.category_id = c.id
                    where o.id = ?`;
      let hasil = await dba(sql, orders_id);
      return res.status(200).send(hasil);
    } catch (error) {
      console.error(error);
      return res.status(500).send({ message: "Server error" });
    }
  },
  getCart: (req, res) => {
    const { users_id } = req.params;
    mysqldb.query(sqlCart, [users_id], (error, result) => {
      if (error) {
        return res.status(500).send({ message: "server error" });
      }
      return res.status(200).send(result);
    });
  },
  // edit Qty
  editQty: (req, res) => {
    const { ordersdetail_id, users_id, qty } = req.body;
    let sql = `update orders_detail set ? where id = ?`;
    let dataEdit = {
      qty: qty,
    };
    mysqldb.query(sql, [dataEdit, ordersdetail_id], (error) => {
      if (error) {
        return res.status(500).send({ message: "server error" });
      }
      mysqldb.query(sqlCart, [users_id], (error, result) => {
        if (error) {
          return res.status(500).send({ message: "server error" });
        }
        return res.status(200).send(result);
      });
    });
  },

  deleteCart: async (req, res) => {
    // mengubah kolom is_deleted pada table orders_detail menjadi 1 atau true
    try {
      const { ordersdetail_id, users_id } = req.params;
      let sql = `update orders_detail set ? where id = ?`;
      let dataDelete = {
        is_deleted: 1,
      };
      await dba(sql, [dataDelete, ordersdetail_id]);
      let cart = await dba(sqlCart, [users_id]);
      return res.status(200).send(cart);
    } catch (error) {
      console.error(error);
      return res.status(500).send({ message: "server error" });
    }
  },

  stockByProduct: (req, res) => {
    const { prod_id } = req.params;
    let sql = `select sum(qty) as availableToUser, products_id from products_location where products_id = ? `;
    mysqldb.query(sql, prod_id, (error, result) => {
      if (error) {
        return res.status(500).send({ message: "server error" });
      }
      return res.status(200).send(result[0]);
    });
  },

  getHistory: async (req, res) => {
    try {
      const { uid } = req.user;
      const { status, search } = req.query;
      let searchSql = "";
      console.log(req.user);
      if (search) {
        searchSql = `and p.name like ${mysqldb.escape("%" + search + "%")}`;
      }
      let sql = `select o.id, p.name as name, u.uid, p.image, o.status, date_format(od.date,'%d %M %y') as date, 
                  time_format(od.date, '%H:%i') as hour_, sum(od.price*od.qty) as total_price, od.price, 
                  o.invoice_number as invoice, od.qty, o.users_id 
                  from orders o 
                  left join orders_detail od on o.id = od.orders_id
                  left join products p on p.id = od.product_id 
                  join users u on o.users_id = u.id
                  where u.uid = ? and od.is_deleted = 0 and o.status in ("awaiting payment", "awaiting confirmation", "processed", "sending","delivered", "rejected")
                  ${searchSql}
                  group by o.id 
                  order by od.date desc;`;
      if (status) {
        sql = `select o.id, p.name as name, u.uid, p.image, o.status, date_format(od.date,'%d %M %y') as date, 
                  time_format(od.date, '%H:%i') as hour_, sum(od.price*od.qty) as total_price, od.price, 
                  o.invoice_number as invoice, od.qty, o.users_id 
                  from orders o 
                  left join orders_detail od on o.id = od.orders_id
                  left join products p on p.id = od.product_id 
                  join users u on o.users_id = u.id
                  where u.uid = ? and od.is_deleted = 0 and o.status = ${mysqldb.escape(
          status
        )} ${searchSql}
                  group by o.id 
                  order by od.date desc;`;
      }

      const dataHistory = await dba(sql, [uid]);
      // console.log(dataHistory);
      return res.status(200).send(dataHistory);
    } catch (error) {
      return res.status(500).send({ message: "server error" });
    }
  },

  getDetailHistory: async (req, res) => {
    try {
      const { id } = req.params;
      let sql = `select o.id, p.name as name, o.users_id, u.uid, p.image, o.status, date_format(od.date,'%d %M %y') as date, 
                  time_format(od.date, '%H:%i') as hour_, od.price, o.invoice_number as invoice, od.qty, o.users_id 
                  from orders_detail od 
                  join orders o on o.id = od.orders_id 
                  join products p on od.product_id = p.id
                  join users u on o.users_id = u.id 
                  where o.status in ("awaiting payment", "awaiting confirmation", "processed", "sending", "delivered", "rejected") and od.is_deleted = 0 and o.id = ?
                  order by od.date desc;`;
      const orderDetail = await dba(sql, [id]);
      console.log(orderDetail);
      return res.status(200).send(orderDetail);
    } catch (error) {
      return res.status(500).send({ message: "server error" });
    }
  },

  acceptedOrder: async (req, res) => {
    try {
      const { status, row } = req.body;
      let dataUpdate = {
        status: status,
      };
      let sql = `update orders set ? where invoice_number = ? and id = ?`;
      await dba(sql, [dataUpdate, row.invoice, row.id]);
      return res.status(200).send({ message: "berhasil" });
    } catch (error) {
      return res.status(500).send({ message: "server error" });
    }
  },
};

// update bukti pembayaran, status, invoice number where orders.id
// get orders_detail where by orders.id
// ambilnya qyt dan products_id
// karena mau insert lebih dari 1 row makanya dilooping, yg di looping data dari orders detail
// ubah readyToSend jadi 1

// data yang di insert qty, product_id, warehouse_id, orders_id, readyToSend
