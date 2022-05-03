var async = require('async');

exports.user_details = function(req, res) {
    res.send(`Implement response for user with username of ${req.params.username}`);
}