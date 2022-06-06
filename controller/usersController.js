const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const validator = require('validator');
const Users = require('../model/usersModel'); 
const Posts = require('../model/postsModel');
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
    if(!validate('regExp', { password }, '^([a-zA-Z]+\\d+|\\d+[a-zA-Z]+)[a-zA-Z0-9]*$')) {
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
    return resHandle.success(res, payload);
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
    return resHandle.success(res, payload);
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
        return resHandle.success(res, {id: user._id, userName: user.userName, message: 'update password'});
    }
    else {
        return resHandle.appError(400, '沒有此id', next);
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
        return resHandle.success(res, {id: user._id, message: 'update profile'});
    }
    else {
        return resHandle.appError(400, '沒有此id', next);
    }
}

async function toggleFollow(req, res, next) {
    let userId = req.user.id;
    let { followId } = req.body;

    const followed = await Users.find({ $and: [{_id: userId}, {'follow.id': followId}] });
    if(!followed.length) { // 追蹤
        const userfollow = await Users.findByIdAndUpdate(userId, { $push: { follow: { id: followId } } });
        const userbefollowed = await Users.findByIdAndUpdate(followId, { $push: { beFollowed: { id: userId } } });
        if(userfollow && userbefollowed) {
            return resHandle.success(res, { userId, action: 'follow', followId })
        }
    }
    else { // 取消追蹤
        const userfollow = await Users.findByIdAndUpdate(userId, { $pull: { follow: { id: followId } } });
        const userbefollowed = await Users.findByIdAndUpdate(followId, { $pull: { beFollowed: { id: userId } } });
        if(userfollow && userbefollowed) {
            return resHandle.success(res, { userId, action: 'unfollow', followId })
        }
    }
    return resHandle.appError(400, '追蹤id輸入有誤', next);    
}

async function getLikeList(req, res, next) {
    const userId = req.user.id;
    let { sortby = 'datetime_pub', s: size = 10, p: page = 1, asc = 0, all } = req.query;
    let sort = sortby === 'datetime_pub' ? { createAt: +asc === 1 ? 1 : -1 } : {} ;
    page = +page > 0 ? +page : 1;
    size = +size > 0 ? +size : 10;

    const user = await Users.findById({_id: userId});
    const filter = { _id: {$in: user.likeList }};
    const count = await Posts.find(filter).count();
    if(all == 1) {
        size = count;
        page = 1;
    }
    let skip = size * ( page - 1 );

    const posts = await Posts.find(filter).sort(sort).skip(skip).limit(size)
        .populate({ path: 'user', select: 'userName avatar'})
        .populate({ path: 'comments', select: 'user comment createAt -post'})
    let postsData = posts.map((item) => {
        return {
            postId: item._id,
            user: item.user,
            content: item.content,
            image: item.image,
            datetime_pub: item.createAt,
            comments: item.comments,
        }
    });
    let payload = { count, size, page, posts: postsData };
    
    return resHandle.success(res, payload);
}

async function getFollowingList(req, res, next) {
    const userId = req.user.id;
    let { s: size = 10, p: page = 1, all } = req.query;
    const user = await Users.findById(userId)
        .populate({ path: 'follow.id', select: 'userName avatar' })
    let following = user.follow;
    const count = following ? following.length : 0 ;
    if(all == 1) {
        size = count;
        page = 1;
    }
    let skip = size * ( page - 1 );
    following = following.slice(skip, skip+size);
    following = following.map((item) => {
        return {
            user: item.id,
            datetime_update: item.datetime_update,
        }
    })

    let payload = { count, size, page, following };
    return resHandle.success(res, payload);
}

module.exports = {
    sign_up: resHandle.handleErrorAsync(sign_up),
    login: resHandle.handleErrorAsync(login),
    updatePassword: resHandle.handleErrorAsync(updatePassword),
    getProfile: resHandle.handleErrorAsync(getProfile),
    updateProfile: resHandle.handleErrorAsync(updateProfile),
    toggleFollow: resHandle.handleErrorAsync(toggleFollow),
    getLikeList: resHandle.handleErrorAsync(getLikeList),
    getFollowingList: resHandle.handleErrorAsync(getFollowingList),
};