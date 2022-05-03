var async = require('async');
const axios = require('axios');

exports.game_details = function(req, res) {
    res.send('Implement game details for game with id of ' + req.params.id);
}