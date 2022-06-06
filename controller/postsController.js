const { isObjectIdOrHexString } = require('mongoose');
const Posts = require('../model/postsModel');
const Users = require('../model/usersModel'); 
const Comments = require('../model/commentsModel');
const resHandle = require('../service/resHandle');

async function createPost(req, res, next) {
    const post = req.body;
    console.log(req.body)
    if(!post.user) { post.user = req.user.id }
    else {
        if(!isObjectIdOrHexString(post.user)) {
            return resHandle.appError(400, '使用者id有誤', next);
        }
    }
    if( !(post.tags[0] && post.type && post.content) ) {
        return resHandle.appError(400, '未填必填欄位(tags, type, content)', next);
    }
    const user = await Users.findById(post.user).exec()
    if(!user) return resHandle.appError(400, '使用者id有誤', next);
    const posts = await Posts.create(post);
    console.log(posts)
    if(posts) {
        return resHandle.success(res, posts);
    }
}

async function getAllPosts(req, res, next) {
    // console.log(req.query, req.params.userId)
    let userId = req.params.userId;
    let { keyword, sortby = 'datetime_pub', s: size = 10, p: page = 1, asc = 0, all } = req.query;
    let filter = keyword ? { content: new RegExp(keyword) } : {} ;
    if(userId) {
        if(!isObjectIdOrHexString(userId)) {
            return resHandle.appError(400, '使用者id有誤', next);
        }
        filter.user = userId;
    }
    let sort = sortby === 'datetime_pub' ? { createAt: +asc === 1 ? 1 : -1 } : {} ;
    page = +page > 0 ? +page : 1;
    size = +size > 0 ? +size : 10;

    const count = await Posts.find(filter).count();
    if(all == 1) {
        size = count;
        page = 1;
    }
    let skip = size * ( page - 1 );

    const posts = await Posts.find(filter).sort(sort).skip(skip).limit(size)
        .populate({
            path: 'user', // 定義post schema中需關聯之欄位
            select: 'userName avatar'
        })
        .populate({ 
            path: 'comments', 
            select: 'user comment createAt -post'
        })

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
    let paylaod = { count, size, page, posts: postsData };
    return resHandle.success(res, paylaod);
}

async function getPost(req, res, next) {
    const postId = req.params.postId;
    if(!isObjectIdOrHexString(postId)) {
        return resHandle.appError(400, '文章id不存在', next);
    }
    const post = await Posts.findById(postId)
        .populate({ path: 'user', select: 'userName avatar' })
        .populate({ path: 'comments', select: 'user comment createAt -post'})
    if(!post) {
        return resHandle.appError(400, '文章id不存在', next);
    }
    let payload = { posts: [{
        postId: post._id,
        user: post.user,
        content: post.content,
        image: post.image,
        datetime_pub: post.createAt,
        comments: post.comments,
    }]};

    return resHandle.success(res, payload);
}

async function removePosts(req, res, next) { // 刪除全部
    const posts = await Posts.deleteMany({});
    return resHandle.success(res, posts);
}

async function removePost(req, res, next) { // 刪除單筆
    const id = req.params.postId;
    console.log('remove id: ', id);
    if(!isObjectIdOrHexString(id)) {
        return resHandle.appError(400, '沒有此id', next);
    }
    const posts = await Posts.findByIdAndDelete(id);
    if(posts) {
        return resHandle.success(res, posts);
    }
    else {
        return resHandle.appError(400, '沒有此id', next);
    }
}

async function updatePost(req, res, next) {
    const id = req.params.postId;
    if(!isObjectIdOrHexString(id)) {
        return resHandle.appError(400, '文章id有誤', next);
    }
    const post = req.body;
    console.log('update id: ', id, ' body: ', post);

    if(!post.content) {
        return resHandle.appError(400, 'content不能為空白', next);
    }
    const posts = await Posts.findByIdAndUpdate(id, post);
    if(posts) {
        return resHandle.success(res, posts);
    }
    else {
        return resHandle.appError(400, '沒有此id', next)
    }
}

async function toggleLike(req, res, next) {
    const userId = req.user.id;
    const postId = req.params.postId;
    if(!isObjectIdOrHexString(postId)) {
        return resHandle.appError(400, '文章id有誤', next);
    }

    // 取消按讚 未找到文章回傳null
    let post = await Posts.findOneAndUpdate({ $and: [{_id: postId}, {likes: {$in: [userId]}}]}, {$pull: {likes: userId}})
    let user = await Users.findOneAndUpdate({ $and: [{_id: userId}, {likeList: {$in: [postId]}}]}, {$pull: {likeList: postId}})
    
    // 按讚
    if(!post) {
        post = await Posts.findByIdAndUpdate(postId, {$addToSet: {likes: userId} })
        if(!post) return resHandle.appError(400, '文章id有誤', next);
        user = await Users.findByIdAndUpdate(userId, {$addToSet: {likeList: postId} })
        
        return resHandle.success(res, { userId, action: 'like', postId});
    }

    return resHandle.success(res, { userId, action: 'unlike', postId});
}

async function addComment(req, res, next) {
    const userId = req.user.id;
    const postId = req.params.postId;
    if(!isObjectIdOrHexString(postId)) {
        return resHandle.appError(400, '文章id有誤', next);
    }
    const { content } = req.body;
    if(!content) {
        return resHandle.appError(400, '未填寫留言', next);
    }

    const post = await Posts.findById(postId);
    if(!post) {
        return resHandle.appError(400, '文章id有誤', next);
    }

    const comment = await Comments.create({
        post: postId,
        user: userId,
        comment: content,
    });
    if(comment) {
        let payload = { userId: comment.user, action: 'comment', postId: comment.post}
        return resHandle.success(res, payload);
    }
}

module.exports = {
    createPost: resHandle.handleErrorAsync(createPost), 
    getAllPosts: resHandle.handleErrorAsync(getAllPosts), 
    getPost: resHandle.handleErrorAsync(getPost),
    addComment: resHandle.handleErrorAsync(addComment),
    removePosts: resHandle.handleErrorAsync(removePosts), 
    removePost: resHandle.handleErrorAsync(removePost), 
    updatePost: resHandle.handleErrorAsync(updatePost),
    toggleLike: resHandle.handleErrorAsync(toggleLike),
};