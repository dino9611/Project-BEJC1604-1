const jwt = require('jsonwebtoken');

module.exports = {
    createAccessToken: (data) => {
        const key = process.env.TOKEN;
        const token = jwt.sign(data, key, { expiresIn: '10m' });
        return token;
    },
};