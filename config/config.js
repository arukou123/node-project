require('dotenv').config();

module.exports = {
  development: {
    username: 'root',
    password: process.env.SEQUELIZE_PASSWORD,
    database: 'nodebird',
    host: '127.0.0.1',
    dialect: 'mysql',
    operatorsAliases: 'false',
  },
  production: {
    username: 'root',
    password: process.env.SEQUELIZE_PASSWORD,
    database: 'nodebird',
    host: '127.0.0.1',
    dialect: 'mysql',
    operatorsAliases: 'false',
    logging: false,  //쿼리를 수행할 때마다 콘솔에 SQL문이 노출됩니다. 이걸 막기 위해 false로 설정
  },
};
