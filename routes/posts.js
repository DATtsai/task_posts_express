const express = require('express');
const postController = require('../controller/postsController')
const router = express.Router();

router.get('/', postController.getAllPosts);
router.post('/', postController.createPost);
router.delete('/', postController.removePosts);
router.delete('/:postId', postController.removePosts);
router.patch('/:postId', postController.updatePost);
router.options('/', (req, res, next) => res.status(200));

module.exports = router;