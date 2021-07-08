const { mysqldb } = require("../connection");
const { promisify } = require("util");
const dba = promisify(mysqldb.query).bind(mysqldb);

module.exports = {
  getAllUser: async (req, res) => {
    try {
      let sql = `select concat(first_name, " " ,last_name) as name_, email, phone_number, photo, gender, age, id, 
                    date_format(created_at,"%d-%m-%y") as month_
                    from users where is_deleted = 0 and is_verified = 1 and role = 1;`;
      const dataUser = await dba(sql);
      sql = `select w.role_id as id, r.role from warehouse w 
                left join role r on r.id = w.role_id;;`;
      const dataRole = await dba(sql);
      return res.status(200).send({ dataUser, dataRole });
    } catch (error) {
      return res.status(500).send({ message: "server error" });
    }
  },

  addAdmin: async (req, res) => {
    try {
      const data = req.body;
      let sql = `update users set role = ? where id = ?`;
      const updateRole = await dba(sql, [data.role, data.id]);
      return res.status(200).send(updateRole);
    } catch (error) {
      return res.status(500).send({ message: "server error" });
    }
  },
};
