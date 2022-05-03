const express = require('express');
const router = express.Router();
const gameController = require('../controllers/gameController');
const userController = require('../controllers/userController');

router.get('/games/:id', gameController.game_details);

router.get('/users/:username', userController.user_details);

module.exports = router;