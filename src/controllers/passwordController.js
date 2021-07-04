const { mysqldb } = require('../connection');
const { promisify } = require('util');
const fs = require('fs');
const path = require('path');
const handlebars = require('handlebars');
const hassingPass = require('../helpers/hassingPass');
const dba = promisify(mysqldb.query).bind(mysqldb);

module.exports = {
    changePassword: async (req, res) => {
        try {
            const { newPassword } = req.body;
            const { id } = req.params;
            let dataChange = {
                password: newPassword
            };
            let sql = `update users set ? where id = ?`;
            await dba(sql, [dataChange, id]);
            console.log('Password change');
            sql = `select * from users where id = ? `;
            let hasil = await dba(sql, [id]);
            console.log(hasil);
            return res.status(200).send(hasil[0]);
        } catch (error) {
            console.error(error);
            return res.status(500).send({ message: 'Server error' });
        }
    },
    forgotPassword: async (req, res) => {

    }
};