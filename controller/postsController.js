const Posts = require('../model/postsModel');
const Users = require('../model/usersModel'); 
const resHandle = require('../service/resHandle');

async function createPost(req, res, next) {
    const post = req.body;
    console.log(req.body)
    try{
        if( !(post.user && post.tags[0] && post.type && post.content) ) {
            return resHandle.error400(res, '未填必填欄位(user, tags, type, content)');
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
        console.log(req.query)
        let { keyword, sortby, s: size = 10, p: page = 1, asc = 0, all } = req.query;
        let filter = keyword ? { content: new RegExp(keyword) } : {} ;
        sort = sortby === 'datetime_pub' ? { createAt: asc ? 1 : -1 } : {} ;
        page = page > 0 ? page : 1;

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
        if(posts) {
            resHandle.success(res, posts);
        }
        else {
            resHandle.error400(res, '沒有此id');
        }
    }
    catch(error) {
        resHandle.error500(res, String(error));
    }
}

module.exports = {createPost, getAllPosts, removePosts, updatePost};