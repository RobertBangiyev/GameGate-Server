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

router.get('/reviews', reviewController.review_list);

module.exports = router;