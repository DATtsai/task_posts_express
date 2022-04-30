const express = require('express');
const controller = require('../controller/postsController')
const router = express.Router();

router.get('/', controller.getAllPosts);
router.post('/', controller.createPost);
router.delete('/', controller.removePosts);
router.delete('/:postId', controller.removePosts);
router.patch('/:postId', controller.updatePost);
router.options('/', (req, res, next) => res.status(200));

module.exports = router;