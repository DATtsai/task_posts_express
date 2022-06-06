const express = require('express');
const usersController = require('../controller/usersController')
const { isAuth } = require('../service/auth');
const router = express.Router();

router.post('/sign_up', usersController.sign_up);
router.post('/login', usersController.login);
router.patch('/updatePassword', isAuth, usersController.updatePassword);
router.get('/profile', isAuth, usersController.getProfile);
router.patch('/profile', isAuth, usersController.updateProfile);
router.patch('/follow', isAuth, usersController.toggleFollow);
router.get('/likeList', isAuth, usersController.getLikeList);
router.get('/followingList', isAuth, usersController.getFollowingList);

module.exports = router;
