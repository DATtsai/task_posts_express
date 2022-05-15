const express = require('express');
const postController = require('../controller/postsController')
const router = express.Router();

router.get('/', postController.getAllPosts);
router.delete('/', postController.removePosts);
router.options('/', (req, res, next) => res.status(200));

module.exports = router;