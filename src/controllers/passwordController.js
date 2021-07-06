const { mysqldb } = require('../connection');
const { promisify } = require('util');
const fs = require('fs');
const path = require('path');
const handlebars = require('handlebars');
const hashingPass = require('../helpers/hassingPass');
const dba = promisify(mysqldb.query).bind(mysqldb);

module.exports = {
    changePassword: async (req, res) => {
        try {
            // pertama ngecek dulu password lama, apakah ada atau engga?
            // kalau ada lanjut, update password yang baru
            // kirim pesan sukses
            const { oldPassword, newPassword, confirmPassword } = req.body;
            const { id } = req.params;
            if (!oldPassword || !newPassword || !confirmPassword) {
                return res.status(400).send({ message: 'Input must be filled!' });
            }
            const sql = `select * from users where id = ? and password = ?`;
            // console.log(sql);
            const hasil = await dba(sql, [id, hashingPass(oldPassword)]);
            // console.log('ini hasil', hasil);
            if (hasil.length) {
                let validation = new RegExp("^(?=.*[a-z])(?=.*[0-9])(?=.*[A-Z])").test(newPassword);
                if (newPassword != confirmPassword) {
                    return res.status(400).send({ message: 'New password and confirm password is different' });
                } else if (newPassword.length < 6) {
                    return res.status(400).send({ message: "Password must be at least 6 characters", });
                } else if (validation === false) {
                    return res.status(400).send({ message: "Password must contain a number, uppercase and lowercase letter", });
                } else {
                    let sql2 = `update users set ? where id = ?`;
                    let dataUpdate = {
                        password: hashingPass(newPassword)
                    };
                    await dba(sql2, [dataUpdate, id]);
                    sql2 = `select * from users where id = ? and password = ?`;
                    let hasil2 = await dba(sql2, [id, hashingPass(newPassword)]);
                    console.log(hasil2);
                    return res.status(200).send(hasil2);
                }
            } else {
                return res.status(400).send({ message: 'Password wrong, try again!' });
            }
        } catch (error) {
            console.error(error);
            return res.status(500).send({ message: 'Server error' });
        }
    },
};