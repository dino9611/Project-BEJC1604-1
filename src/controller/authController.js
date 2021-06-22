const { mysqldb } = require('../connection');
const { promisify } = require('util');
const dba = promisify(mysqldb.query).bind(mysqldb);
const geolib = require('geolib');

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
    addPersonalData: (req, res) => {
        try {
            const { id } = req.params;
            const { first_name, last_name, gender, age, phone_number } = req.body;
            let dataToAdd = {
                first_name: first_name,
                last_name: last_name,
                gender: gender,
                age: age,
                phone_number: phone_number
            };
            let sql = `update users set ? where id = ?`;
            mysqldb.query(sql, [dataToAdd, id], (error) => {
                if (error) return res.status(500).send(error);
                sql = `select id, first_name, last_name, email, phone_number, gender, age from users where id = ? `;
                mysqldb.query(sql, [id], (error, result) => {
                    if (error) return res.status(500).send(error);
                    return res.status(200).send(result);
                });
            });
        } catch (error) {
            console.error(error);
            return res.status(500).send({ error: true, message: error.message });
        }
    },
    addAddress: (req, res) => {
        try {
            const { id } = req.params;
            const { address, city, zip, description, } = req.body;
            let insertData = {
                address: address,
                city: city,
                zip: zip,
                description: description,
                users_id: id
            };
            let sql = `insert into address set ?`;
            mysqldb.query(sql, [insertData], (error) => {
                if (error) return res.status(500).send({ message: "bad request" });
                sql = `select a.address, a.city, a.zip, a.description from address a 
                join users u on a.users_id=u.id where u.id = ?`;
                mysqldb.query(sql, [id], (error, result) => {
                    if (error) return res.status(500).send(error);
                    return res.status(200).send(result);
                });
            });
        } catch (error) {
            console.error(error);
            return res.status(500).send({ error: true, message: error.message });
        }
    }
};