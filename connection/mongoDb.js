const dotenv = require('dotenv');
const mongose = require('mongoose');

dotenv.config({path: `${__dirname}/../config.env`});
const DB = process.env.DATABASE.replace('<password>', process.env.DATABASE_PASSWORD);

async function connect() {
    return await mongose.connect(DB)
        .then(()=>{
            console.log('資料庫連線成功');
            return '資料庫連線成功'
        })
        .catch((error)=>{
            console.log(error);
            return error
        })
}

module.exports = connect;





