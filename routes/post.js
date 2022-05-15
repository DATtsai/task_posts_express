const express = require('express');
const postController = require('../controller/postsController')
const router = express.Router();

router.post('/', postController.createPost);
router.delete('/:postId', postController.removePost);
router.patch('/:postId', postController.updatePost);

module.exports = router;