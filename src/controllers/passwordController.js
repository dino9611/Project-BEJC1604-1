const { mysqldb } = require('../connection');
const { promisify } = require('util');
const fs = require('fs');
const path = require('path');
const handlebars = require('handlebars');
const hashingPass = require('../helpers/hassingPass');
const dba = promisify(mysqldb.query).bind(mysqldb);
const { createForgotPassToken } = require('../helpers/createToken');
const transporter = require('../helpers/transporter');

const link = 'http://localhost:3000/resetpassword/';

module.exports = {
    resetPassword: async (req, res) => {
        try {
            const { newPassword } = req.body;
            // console.log(newPassword);
            const { uid } = req.user;
            let dataChange = {
                password: hashingPass(newPassword)
            };
            let sql = `update users set ? where uid = ?`;
            await dba(sql, [dataChange, uid]);
            console.log('Password change');
            sql = `select * from users where uid = ? `;
            let hasil = await dba(sql, [uid]);
            console.log(hasil);
            return res.status(200).send(hasil[0]);
        } catch (error) {
            console.error(error);
            return res.status(500).send({ message: 'Server error' });
        }
    },
    forgotPassword: async (req, res) => {
        try {
            const { email } = req.body;
            let sql = `select uid from users where email = ?`;
            let user = await dba(sql, email);
            if (user.length) {
                let filePath = path.resolve(__dirname, '../template/emailForgotPassword.html');
                const htmlRender = fs.readFileSync(filePath, 'utf-8');
                const template = handlebars.compile(htmlRender);
                let dataToken = {
                    uid: user[0].uid
                };
                const tokenForgot = createForgotPassToken(dataToken);
                const htmlToEmail = template({ link: link + tokenForgot });
                await transporter.sendMail({
                    from: "Admin Fournir <omiputrakarunia@gmail.com>",
                    to: email,
                    subject: `Please change your password`,
                    html: htmlToEmail,
                });
                return res.status(200).send({ message: 'A reset link has sent to your email!' });
            } else {
                return res.status(400).send({ message: 'Email unregistered' });
            }
        } catch (error) {
            console.error(error);
            return res.status(500).send({ message: 'Server error' });
        }

    }
};