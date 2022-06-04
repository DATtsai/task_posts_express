const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const validator = require('validator');
const Users = require('../model/usersModel'); 
const resHandle = require('../service/resHandle');
const { generateJWT } = require('../service/auth');

const validate = (type, data, options) => {
    switch(type) {
        case 'notEmpty': {
            let values = Object.values(data);
            return values.every(item => item)
        }
        case 'confirmPassword': {
            let values = Object.values(data);
            return values[0] === values[1];
        }
        case 'enoughLength': {
            let values = Object.values(data);
            return values.every(item => validator.isLength(item, {min: options}));
        }
        case 'emailFormat': {
            let values = Object.values(data);
            return values.every(item => validator.isEmail(item));
        }
        case 'regExp': {
            let values = Object.values(data);
            let regExp = new RegExp(options, 'g');
            return values.every(item => item.match(regExp));
        }
        default:
            console.log('no type for validating!')
            return false;
    }
}

async function sign_up(req, res, next) {
    let { userName, email, password, confirmPassword } = req.body;
    // 表單驗證
    if(!validate('notEmpty', { userName, email, password, confirmPassword })) {
        return resHandle.appError(400, '必填欄位未填', next);
    }
    if(!validate('emailFormat', { email })) {
        return resHandle.appError(400, 'email格式不符', next);
    }
    if(!validate('enoughLength', { userName }, 2)) {
        return resHandle.appError(400, '暱稱至少2個字', next);
    }
    if(!validate('enoughLength', { password }, 8)) {
        return resHandle.appError(400, '密碼不得少於8碼', next);
    }
    if(!validate('regExp', { password }, '^([a-zA-Z]+\d+|\d+[a-zA-Z]+)[a-zA-Z0-9]*$')) {
        return resHandle.appError(400, '密碼需為英數混合', next);
    }
    if(!validate('confirmPassword', { password, confirmPassword })) {
        return resHandle.appError(400, '密碼不一致', next);
    }

    // 密碼加密
    password = await bcrypt.hash(password, 12);
    const user = {email, password, userName};
    const users = await Users.create(user);
    console.log(users);
    let payload = {userId: users._id, email: users.email, userName: users.userName, createAt: users.createAt};
    resHandle.success(res, payload);
}

async function login(req, res, next) {
    const userLogin = req.body;
    if(!validate('notEmpty', userLogin)) {
        return resHandle.appError(400, '必填欄位未填', next);
    }
    const user = await Users.findOne({email: userLogin.email}).select('+password');
    const isAuth = await bcrypt.compare(userLogin.password, user.password);
    console.log(isAuth ? `${user._id} 登入` : `${user._id} 登入失敗`);
    if(!isAuth) {
        return resHandle.appError(400, '密碼錯誤', next)
    }
    const token = generateJWT(user);
    let payload = {token, userName: user.userName};
    resHandle.success(res, payload);
}

async function updatePassword(req, res, next) {
    let { password, confirmPassword } = req.body;
    let userId = req.user.id; // 由middleware帶進來的user資訊
    // 表單驗證
    if(!validate('notEmpty', { password, confirmPassword })) {
        return resHandle.appError(400, '必填欄位未填', next);
    }
    if(!validate('enoughLength', { password }, 8)) {
        return resHandle.appError(400, '密碼不得少於8碼', next);
    }
    if(!validate('confirmPassword', { password, confirmPassword })) {
        return resHandle.appError(400, '密碼不一致', next);
    }
    password = await bcrypt.hash(password, 12);
    const user = await Users.findByIdAndUpdate(userId, {password});
    if(user) {
        resHandle.success(res, {id: user._id, userName: user.userName, message: 'update password'});
    }
    else {
        resHandle.appError(400, '沒有此id', next);
    }
}

async function getProfile(req, res, next) {
    const user = await Users.findById(req.user.id);
    resHandle.success(res, user);
}

async function updateProfile(req, res, next) {
    let { userName, gender, avatar } = req.body;
    const user = await Users.findByIdAndUpdate(req.user.id, { userName, gender, avatar }, { runValidators: true });
    if(user) {
        resHandle.success(res, {id: user._id, message: 'update profile'});
    }
    else {
        resHandle.appError(400, '沒有此id', next);
    }
}

module.exports = {
    sign_up: resHandle.handleErrorAsync(sign_up),
    login: resHandle.handleErrorAsync(login),
    updatePassword: resHandle.handleErrorAsync(updatePassword),
    getProfile: resHandle.handleErrorAsync(getProfile),
    updateProfile: resHandle.handleErrorAsync(updateProfile)
};