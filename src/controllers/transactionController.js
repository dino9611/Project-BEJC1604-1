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

const sqlCart = `select p.id, p.name, p.price, p.category_id, p.image, o.status, o.users_id, o.warehouse_id, od.orders_id, od.product_id, od.qty from orders o
join orders_detail od on o.id = od.orders_id
join products p on od.product_id = p.id
where o.status = 'onCart' and users_id = ?`;

module.exports = {
    addToCart: (req, res) => {
        const { users_id, prod_id, qty } = req.body;
        if (!users_id || !prod_id || !qty) {
            return res.status(400).send({ message: "bad request" });
        }
        // mengecek apakah users sudah menambah kan produk ke cart atau belum
        // kalau ada maka, baca line setelah cart.length
        // kalau tidak ada akan menambahkan status ke table orders jadi onCart beserta users_id nya 
        // dan juga memasukan qty, orders_id dan product_id ke table orders_detail
        let sql = `select * from orders where status = 'onCart' and users_id = ?`;
        mysqldb.query(sql, [users_id], (error, cart) => {
            if (error) {
                console.log(error);
                return res.status(500).send({ message: "server error" });
            }
            if (cart.length) {
                // mencari apakah produk sudah ada didalam cart atau tidak
                // jika ada maka hanya edit qty saja
                // kalau tidak ada maka masukan product_id ke table orders_detail dan
                sql = `select * from orders_detail where orders_id = ? and product_id = ?`;
                mysqldb.query(sql, [cart[0].id, prod_id], (error, result1) => {
                    if (error) {
                        return res.status(500).send({ message: "server error" });
                    }
                    if (result1.length) {
                        // maka edit qty nya saja
                        let qtyNew = {
                            qty: qty + result1[0].qty
                        };
                        sql = `update orders_detail set ?  where id = ?`;
                        mysqldb.query(sql, [qtyNew, result1[0].id], (error) => {
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

                    } else {
                        // kalau result1.length 0 maka bahwa product tidak ada di dalam cart
                        // oleh karena itu harus masukan product_id, orders_id dan qty ke orders_detail
                        sql = `insert into orders_detail set ?`;
                        let insertData = {
                            product_id: prod_id,
                            orders_id: cart[0].id,
                            qty
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
                // menggunakan sql transactions, karena ada 2 langkah untuk manipulasi data
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
                            mysqldb.commit((err) => {
                                if (err) {
                                    console.error(error);
                                    return mysqldb.rollback(() => {
                                        return res.status(500).send({ message: "server error" });
                                    });
                                }
                                mysqldb.query(sqlCart, [users_id], (error, result2) => {
                                    if (error) {
                                        return res.status(500).send({ message: "server error" });
                                    }
                                    return res.status(200).send(result2);
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

    editQty: (req, res) => {
        const { prod_id, orders_id, qty, users_id } = req.body;
        let sql = `update orders_detail set ? where product_id = ? and orders_id = ?`;
        let dataEdit = {
            qty: qty
        };
        mysqldb.query(sql, [dataEdit, prod_id, orders_id], (error) => {
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

    deleteCart: (req, res) => {


    },

    stockByProduct: (req, res) => {
        const { prod_id } = req.params;
        let sql = `select sum(qty) as availableToUser, products_id from products_location where products_id = ? `;
        mysqldb.query(sql, prod_id, (error, result) => {
            if (error) {
                return res.status(500).send({ message: "server error" });
            }
            return res.status(200).send(result);
        });
    }
};