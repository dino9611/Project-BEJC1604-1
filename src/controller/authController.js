const { mysqldb } = require('../connection');
const { promisify } = require('util');
const dba = promisify(mysqldb.query).bind(mysqldb);


module.exports = {
    getAllUsers: (req, res) => {
        let sql = `select * from users`;
        mysqldb.query(sql, (error, result) => {
            if (error) return res.status(500).send(error);
            return res.status(200).send(result);
        });
    },
    getUser: (req, res) => {
        const { id } = req.params;
        let sql = `select * from users where id = ?`;
        mysqldb.query(sql, [id], (error, result) => {
            if (error) return res.status(500).send(error);
            return res.status(200).send(result);
        });
    },
    addDataUser: (req, res) => {
        try {
            const { id } = req.params;
            const { first_name, last_name, gender, age } = req.body;
            let dataToAdd = {
                first_name: first_name,
                last_name: last_name,
                gender: gender,
                age: age
            };
            let sql = `update users set ? where id = ?`;
            mysqldb.query(sql, [dataToAdd, id], (error) => {
                if (error) return res.status(500).send(error);
                sql = `select * from users where first_name = ?`;
                mysqldb.query(sql, [first_name], (error, result) => {
                    if (error) return res.status(400).send(error);
                    return res.status(200).send(result);
                });
            });
        } catch (error) {
            console.error(error);
            return res.status(500).send({ error: true, message: error.message });
        }
    },
};