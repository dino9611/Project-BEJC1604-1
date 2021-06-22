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
            const { first_name, last_name, gender, age, address, city, phone_number, zip } = req.body;
            let data1 = {
                first_name: first_name,
                last_name: last_name,
                gender: gender,
                age: age,
                phone_number: phone_number
            };
            let sql = `update users set ? where id = ?`;
            mysqldb.query(sql, [data1, id], (error) => {
                if (error) return res.status(500).send(error);
                let data2 = {
                    address: address,
                    city: city,
                    zip: zip
                };
                sql = `insert into address set ?`;
            });
        } catch (error) {
            console.error(error);
            return res.status(500).send({ error: true, message: error.message });
        }
    },
};