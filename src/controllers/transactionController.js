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

module.exports = {
    addToCart: (req, res) => {
        const { users_id, prod_id, qty } = req.body;
        if (!users_id || !prod_id || !qty) {
            return res.status(400).send({ message: "bad request" });
        }
        let sql = `select * from orders where status = 'onCart' and users_id = ?`;
        mysqldb.query(sql, [users_id], (error, cart) => {
            if (error) {
                console.log(error);
                return res.status(500).send({ message: "server error" });
            }
            if (cart.length) {

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
                                    return mysqldb.rollback(function () {
                                        return res.status(500).send({ message: "server error" });
                                    });
                                }
                                return res.status(200).send({ message: 'berhasil' });
                            });
                        });
                    });
                });
            }
        });
    }
};