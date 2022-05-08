const mongoose = require('mongoose');
const userSchema = mongoose.Schema(
    {
        email: {
            type: String,
            required: [true, 'email為必填欄位'],
            unique: true,
            lowercase: true,
            select: false
        },
        userName: {
            type: String,
            required: [true, '名稱未填寫'],
        },
        avatar: {
            type: String,
            default: 'https://randomuser.me/api/portraits/lego/3.jpg'
        },
    },
    {
        versionKey: false, // 去除__v欄位
    }
);

const Users = mongoose.model('users', userSchema);

module.exports = Users;