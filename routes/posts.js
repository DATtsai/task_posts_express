const express = require('express');
const postController = require('../controller/postsController')
const { isAuth } = require('../service/auth');
const router = express.Router();

router.post('/post', isAuth, postController.createPost);
router.delete('/post/:postId', isAuth, postController.removePost);
router.patch('/post/:postId', isAuth, postController.updatePost);
router.get('/post/:postId', isAuth, postController.getPost);
router.patch('/post/:postId/like', isAuth, postController.toggleLike);
router.post('/post/:postId/comment', isAuth, postController.addComment);
router.get('/', isAuth, postController.getAllPosts);
router.get('/user/:userId', isAuth, postController.getAllPosts);
router.delete('/', isAuth, postController.removePosts);
router.options('/', (req, res, next) => res.status(200));

module.exports = router;