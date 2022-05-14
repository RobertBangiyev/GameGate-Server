const express = require('express');
require('dotenv').config()
const router = express.Router();
const gameController = require('../controllers/gameController');
const userController = require('../controllers/userController');
const reviewController = require('../controllers/reviewController');
const generalController = require('../controllers/generalController');

router.get('/game/:id', gameController.game_details);

router.get('/game/:id/reviews', gameController.game_reviews);

router.get('/games', gameController.game_list);

router.get('/users', userController.user_list);

router.post('/users', userController.user_registration);

router.post('/users/login', userController.user_login);

router.get('/user/:username', userController.user_details);

router.get('/user/:username/followers', userController.user_followers);

router.get('/user/:username/followings', userController.user_followings);

router.get('/user/:username/follows', userController.user_follows);

router.get('/user/:username/planning', userController.user_planning);

router.get('/user/:username/completed', userController.user_completed);

router.get('/user/:username/current', userController.user_current);

router.get('/user/:username/dropped', userController.user_dropped);

router.get('/user/:username/gamestatuses', userController.user_game_statuses);

router.get('/reviews', reviewController.review_list);

router.use(generalController.verify_login);

router.post('/reviews', reviewController.game_reviews_create);

router.post('/user/:username/following', userController.user_followings_add);

router.post('/user/:username/followers', userController.user_followers_add);

router.post('/user/:username/following/delete', userController.user_followings_delete);

router.post('/user/:username/followers/delete', userController.user_followers_delete);

router.post('/user/:username/planning', userController.user_planning_add);


module.exports = router;