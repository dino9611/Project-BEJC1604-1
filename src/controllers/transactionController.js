const { mysqldb } = require("../connection");
const { promisify } = require('util');
const dba = promisify(mysqldb.query).bind(mysqldb);
const dbtransaction = promisify(mysqldb.beginTransaction).bind(mysqldb);
const dbcommit = promisify(mysqldb.commit).bind(mysqldb);
const { uploader } = require('../helpers');
const fs = require('fs');
const connection = require('../connection');
Date.prototype.addDays = function (days) {
    let date = new Date(this.valueOf());
    date.setDate(date.getDate() + days);
    return date;
};

const sqlCart = `select od.id as ordersdetail_id, p.id, p.name, p.price, p.category_id, p.image, o.status, o.users_id, o.warehouse_id, od.orders_id, od.product_id, od.qty from orders o
join orders_detail od on o.id = od.orders_id
join products p on od.product_id = p.id
where o.status = 'onCart' and users_id = ? and od.is_deleted = 0;`;

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
            if (cart.length) { // * cart.length true artinya cart sudah terbentuk
                // ? mencari tau apakah product sudah ada di cart atau belum
                // cart.length maksudnya adalah status = 'onCart' dan users_id tersebut sudah ada di table orders
                // maka tinggal edit qty saja di tabel orders_detail
                console.log('ini cart line 41', cart);
                sql = `select * from orders_detail where orders_id = ? and product_id = ? and is_deleted = 0`;
                let orders_id = cart[0].id;
                mysqldb.query(sql, [orders_id, prod_id], (error, isiCart) => {
                    if (error) {
                        return res.status(500).send({ message: "server error" });
                    }
                    console.log('ini isiCart line 48', isiCart);
                    if (isiCart.length) { // artinya jika barangnya sudah ada di cart, maka kita tinggal ubah qty saja
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
                                qty: qtyTotal
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
                                    console.log('ini hasil', hasil);
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
                            qty: qty
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
                        status: 'onCart',
                        users_id: users_id
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
                            product_id: prod_id
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
            qty: qty
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
                is_deleted: 1
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
    }
};