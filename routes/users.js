const express = require('express');
const usersController = require('../controller/usersController')
const { isAuth } = require('../service/auth');
const router = express.Router();

router.post('/sign_up', usersController.sign_up);
router.post('/login', usersController.login);
router.patch('/updatePassword', isAuth, usersController.updatePassword);
router.get('/profile', isAuth, usersController.getProfile);
router.patch('/profile', isAuth, usersController.updateProfile);

module.exports = router;
