const jwt = require('jsonwebtoken');
const Users = require('../model/usersModel'); 
const resHandle = require('./resHandle');

function generateJWT(user) {
    const token = jwt.sign({id: user._id}, process.env.JWT_SECRET, {expiresIn: process.env.JWT_EXPIRES_DAY});
    return token;
} 

async function isAuth(req, res, next) {
    let token;
    // 檢查是否有帶token
    if(req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }
    if(!token) {
        resHandle.appError(401, '您尚未登入!', next);
    }
    // token解密確認使用者
    const decoded = await new Promise((resolve, reject) => { // 由於jwt.verify並非promise物件，解密會有延遲故需要打包為promise
        jwt.verify(token, process.env.JWT_SECRET, (error, payload) => {
            if(error) reject(error);
            else resolve(payload);
        });
 
    });
    const user = await Users.findById(decoded.id);
    if(user) {
        req.user = user; // 將使用者資訊新增到req上，使其往其他middleware帶
    }
    else{
        resHandle.appError(401, '登入資訊異常!', next);
    }

    next();
}   

module.exports = {
    generateJWT,
    isAuth: resHandle.handleErrorAsync(isAuth)
};