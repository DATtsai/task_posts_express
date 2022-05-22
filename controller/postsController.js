const Posts = require('../model/postsModel');
const Users = require('../model/usersModel'); 
const resHandle = require('../service/resHandle');

async function createPost(req, res, next) {
    const post = req.body;
    console.log(req.body)
    if(!post.user) { post.user = req.user.id }
    if( !(post.tags[0] && post.type && post.content) ) {
        resHandle.appError(400, '未填必填欄位(tags, type, content)', next);
    }
    const user = await Users.findById(post.user).exec()
        .catch(error => resHandle.appError(400, '使用者不存在', next));
    const posts = await Posts.create(post);
    console.log(posts)
    resHandle.success(res, posts);
}

async function getAllPosts(req, res, next) {
    console.log(req.query)
    let { keyword, sortby, s: size = 10, p: page = 1, asc = 0, all } = req.query;
    let filter = keyword ? { content: new RegExp(keyword) } : {} ;
    sort = sortby === 'datetime_pub' ? { createAt: +asc === 1 ? 1 : -1 } : {} ;
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
        });

    let postsData = posts.map((item) => {
        return {
            postId: item._id,
            user: item.user,
            content: item.content,
            image: item.image,
            datetime_pub: item.createAt
        }
    });
    let paylaod = { count, size, page, posts: postsData };
    resHandle.success(res, paylaod);
}

async function removePosts(req, res, next) { // 刪除全部
    const posts = await Posts.deleteMany({});
    resHandle.success(res, posts);
}

async function removePost(req, res, next) { // 刪除單筆
    const id = req.params.postId;
    console.log('remove id: ', id);

    const posts = await Posts.findByIdAndDelete(id);
    if(posts) {
        resHandle.success(res, posts);
    }
    else {
        resHandle.appError(400, '沒有此id', next);
    }
}

async function updatePost(req, res, next) {
    const id = req.params.postId;
    const post = req.body;
    console.log('update id: ', id, ' body: ', post);

    if(!post.content) {
        resHandle.appError(400, 'content不能為空白', next);
    }
    const posts = await Posts.findByIdAndUpdate(id, post);
    if(posts) {
        resHandle.success(res, posts);
    }
    else {
        resHandle.appError(400, '沒有此id', next)
    }
}

module.exports = {
    createPost: resHandle.handleErrorAsync(createPost), 
    getAllPosts: resHandle.handleErrorAsync(getAllPosts), 
    removePosts: resHandle.handleErrorAsync(removePosts), 
    removePost: resHandle.handleErrorAsync(removePost), 
    updatePost: resHandle.handleErrorAsync(updatePost)
};