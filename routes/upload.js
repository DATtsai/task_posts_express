const express = require('express');
const { isAuth } = require('../service/auth');
const upload = require('../service/uploadImage');
const uploadController = require('../controller/uploadController');
const router = express.Router();

router.post('/', isAuth, upload, uploadController.uploadImage);

module.exports = router;