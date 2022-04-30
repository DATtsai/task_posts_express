const Posts = require('../model/postsModel'); // model Post
const resHandle = require('./resHandle');

async function createPost(req, res, next) {
    const post = req.body;
    console.log(req.body)
    try{
        if( !(post.name && post.tags[0] && post.type && post.content) ) {
            return resHandle.error400(res, '未填必填欄位(name, tags, type, content)');
        }
        const posts = await Posts.create(post);
        resHandle.success(res, posts);
    }
    catch(error){
        resHandle.error500(res, error);
    }
}

async function getAllPosts(req, res, next) {
    try{
        const posts = await Posts.find({});
        resHandle.success(res, posts);
    }
    catch(error) {
        resHandle.error500(res, error);
    }
}

async function removePosts(req, res, next) {
    const id = req.params.postId;
    console.log('remove id: ', id);
    try{
        if(!id) { // 刪除全部
            const posts = await Posts.deleteMany({});
            resHandle.success(res, posts);
        }
        else { // 刪除單筆
            const posts = await Posts.findByIdAndDelete(id);
            if(posts) {
                resHandle.success(res, posts);
            }
            else {
                resHandle.error400(res, '沒有此id');
            }
        }
    }
    catch(error) {
        resHandle.error500(res, error);
    }
}

async function updatePost(req, res, next) {
    const id = req.params.postId;
    const post = req.body;
    console.log('update id: ', id, ' body: ', post);
    try{
        if(!post.content) {
            return resHandle.error400(res, 'content不能為空白');
        }
        const posts = await Posts.findByIdAndUpdate(id, post);
        resHandle.success(res, posts);
    }
    catch(error) {
        resHandle.error500(res, String(error));
    }
}

module.exports = {createPost, getAllPosts, removePosts, updatePost};