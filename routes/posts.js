const express = require('express');
const postController = require('../controller/postsController')
const { isAuth } = require('../service/auth');
const router = express.Router();

router.post('/post', isAuth, postController.createPost);
router.delete('/post/:postId', isAuth, postController.removePost);
router.patch('/post/:postId', isAuth, postController.updatePost);
router.get('/posts', isAuth, postController.getAllPosts);
router.delete('/posts', isAuth, postController.removePosts);
router.options('/', (req, res, next) => res.status(200));

module.exports = router;