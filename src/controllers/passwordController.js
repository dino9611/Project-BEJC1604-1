const { mysqldb } = require('../connection');
const { promisify } = require('util');
const fs = require('fs');
const path = require('path');
const handlebars = require('handlebars');
const dba = promisify(mysqldb.query).bind(mysqldb);

module.exports = {
    changePassword: async (req, res) => {
        const { newPassword } = req.body;
        const { uid } = req.user;


    },
    forgotPassword: async (req, res) => {

    }
};