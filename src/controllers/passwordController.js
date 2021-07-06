const { mysqldb } = require("../connection");
const { promisify } = require("util");
const fs = require("fs");
const path = require("path");
const handlebars = require("handlebars");
const hashingPass = require("../helpers/hassingPass");
const dba = promisify(mysqldb.query).bind(mysqldb);
const { createForgotPassToken } = require("../helpers/createToken");
const transporter = require("../helpers/transporter");

const link = "http://localhost:3000/resetpassword/";

module.exports = {
  resetPassword: async (req, res) => {
    try {
      const { newPassword } = req.body;
      // console.log(newPassword);
      const { uid } = req.user;
      let dataChange = {
        password: hashingPass(newPassword),
      };
      let sql = `update users set ? where uid = ?`;
      await dba(sql, [dataChange, uid]);
      console.log("Password change");
      sql = `select * from users where uid = ? `;
      let hasil = await dba(sql, [uid]);
      console.log(hasil);
      return res.status(200).send(hasil[0]);
    } catch (error) {
      console.error(error);
      return res.status(500).send({ message: "Server error" });
    }
  },
  forgotPassword: async (req, res) => {
    try {
      const { email } = req.body;
      let sql = `select uid from users where email = ?`;
      let user = await dba(sql, email);
      if (user.length) {
        let filePath = path.resolve(
          __dirname,
          "../template/emailForgotPassword.html"
        );
        const htmlRender = fs.readFileSync(filePath, "utf-8");
        const template = handlebars.compile(htmlRender);
        let dataToken = {
          uid: user[0].uid,
        };
        const tokenForgot = createForgotPassToken(dataToken);
        const htmlToEmail = template({ link: link + tokenForgot });
        await transporter.sendMail({
          from: "Admin Fournir <omiputrakarunia@gmail.com>",
          to: email,
          subject: `Please change your password`,
          html: htmlToEmail,
        });
        return res
          .status(200)
          .send({ message: "A reset link has sent to your email!" });
      } else {
        return res.status(400).send({ message: "Email unregistered" });
      }
    } catch (error) {
      console.error(error);
      return res.status(500).send({ message: "Server error" });
    }
  },
  changePassword: async (req, res) => {
    try {
      // pertama ngecek dulu password lama, apakah ada atau engga?
      // kalau ada lanjut, update password yang baru
      // kirim pesan sukses
      const { oldPassword, newPassword, confirmPassword } = req.body;
      const { id } = req.params;
      if (!oldPassword || !newPassword || !confirmPassword) {
        return res.status(400).send({ message: "Input must be filled!" });
      }
      const sql = `select * from users where id = ? and password = ?`;
      // console.log(sql);
      const hasil = await dba(sql, [id, hashingPass(oldPassword)]);
      // console.log('ini hasil', hasil);
      if (hasil.length) {
        let validation = new RegExp("^(?=.*[a-z])(?=.*[0-9])(?=.*[A-Z])").test(
          newPassword
        );
        if (newPassword != confirmPassword) {
          return res
            .status(400)
            .send({
              message: "New password and confirm password is different",
            });
        } else if (newPassword.length < 6) {
          return res
            .status(400)
            .send({ message: "Password must be at least 6 characters" });
        } else if (validation === false) {
          return res
            .status(400)
            .send({
              message:
                "Password must contain a number, uppercase and lowercase letter",
            });
        } else {
          let sql2 = `update users set ? where id = ?`;
          let dataUpdate = {
            password: hashingPass(newPassword),
          };
          await dba(sql2, [dataUpdate, id]);
          sql2 = `select * from users where id = ? and password = ?`;
          let hasil2 = await dba(sql2, [id, hashingPass(newPassword)]);
          console.log(hasil2);
          return res.status(200).send(hasil2);
        }
      } else {
        return res.status(400).send({ message: "Password wrong, try again!" });
      }
    } catch (error) {
      console.error(error);
      return res.status(500).send({ message: "Server error" });
    }
  },
};
