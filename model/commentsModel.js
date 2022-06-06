const mongoose = require('mongoose');
const commentSchema = mongoose.Schema(
    {
        comment: {
            type: String,
            required: [true, 'comment 未填寫']
        },
        post: {
            type: mongoose.Schema.ObjectId,
            ref: 'posts',
            required: [true, '文章id未填寫']
        },
        user: {
            type: mongoose.Schema.ObjectId,
            ref: 'users',
            required: [true, '留言者資訊未填寫']
        },
        createAt: {
            type: Date,
            default: Date.now,
        },
        updateAt: {
            type: Date,
            default: Date.now,
        }
    },
    {
        versionKey: false,
    }
);
// 該Schema被呼叫，先做完前置的populate後再回傳
commentSchema.pre(/^find/, function(next) { // 此處用到this，注意不能使用箭頭函式寫法
    this.populate({path: 'user', select: 'id userName avatar'});
    next();
}); 

const Comments = mongoose.model('comments', commentSchema);

module.exports = Comments;