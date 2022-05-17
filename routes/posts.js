const express = require('express');
const postController = require('../controller/postsController')
const router = express.Router();

router.post('/post', postController.createPost);
router.delete('/post/:postId', postController.removePost);
router.patch('/post/:postId', postController.updatePost);
router.get('/posts', postController.getAllPosts);
router.delete('/posts', postController.removePosts);
router.options('/', (req, res, next) => res.status(200));

module.exports = router;