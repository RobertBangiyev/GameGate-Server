const express = require('express');
require('dotenv').config()
const router = express.Router();
const gameController = require('../controllers/gameController');
const userController = require('../controllers/userController');

router.get('/game/:id', gameController.game_details);

router.get('/user/:username', userController.user_details);

module.exports = router;