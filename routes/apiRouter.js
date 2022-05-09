const express = require('express');
require('dotenv').config()
const router = express.Router();
const gameController = require('../controllers/gameController');
const userController = require('../controllers/userController');
const reviewController = require('../controllers/reviewController');

router.get('/game/:id', gameController.game_details);

router.get('/game/:id/reviews', gameController.game_reviews);

router.get('/users', userController.user_list);

router.get('/user/:username', userController.user_details);

router.get('/user/:username/followers', userController.user_followers);

router.get('/user/:username/followings', userController.user_followings);

router.get('/user/:username/planning', userController.user_planning);

router.get('/user/:username/completed', userController.user_completed);

router.get('/user/:username/current', userController.user_current);

router.get('/user/:username/dropped', userController.user_dropped);

router.get('/user/:username/gamestatuses', userController.user_game_statuses);

router.get('/reviews', reviewController.review_list);

module.exports = router;