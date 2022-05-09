var async = require('async');
const AWS = require('aws-sdk');

var myCredentials = new AWS.CognitoIdentityCredentials({IdentityPoolId:'us-east-1:1f1634e0-e85f-4ffe-a509-ecb75c777309'});
var myConfig = new AWS.Config({
  credentials: myCredentials, region: 'us-east-1'
});

AWS.config.update(myConfig);

const docClient = new AWS.DynamoDB.DocumentClient();

exports.user_details = function(req, res, next) {
    async.waterfall([
        function(callback) {
            const params = {
                TableName: "GameGateAccounts",
                IndexName: "Username-index",
                KeyConditionExpression: "#username = :User3",
                ExpressionAttributeNames: {
                    "#username": "Username"
                },
                ExpressionAttributeValues: {
                    ":User3": req.params.username
                },
                ProjectionExpression: 'FollowingMap, Email, ProfilePicture, Following, Planning, Completed, Followers, CurrentG, Dropped, FollowersMap, Username'
            }
            docClient.query(params, function(err, results) {
                callback(err, results);
            })
        },
        function(results, callback) {
            var params = {
                TableName: "Games",
                IndexName: "Email-GameID-index",
                KeyConditionExpression: "#email = :Email3",
                ExpressionAttributeNames: {
                    "#email": "Email"
                },
                ExpressionAttributeValues: {
                    ":Email3": results.Items[0].Email
                }
            }
            docClient.query(params, function(err, newResults) {
                callback(err, results, newResults);
            })
        }
    ], function(err, results, newResults) {
        if(err) { return next(err); }
        else {
            const userInfo = {
                user: results,
                reviews: newResults
            };
            res.json(userInfo);
        }
    })
}

exports.user_followers = function(req, res, next) {
    const params = {
        TableName: "GameGateAccounts",
        IndexName: "Username-index",
        KeyConditionExpression: "#username = :User3",
        ExpressionAttributeNames: {
            "#username": "Username"
        },
        ExpressionAttributeValues: {
            ":User3": req.params.username
        },
        ProjectionExpression: 'Followers, FollowersMap'
    }
    docClient.query(params, function(err, results) {
        if(err) { return next(err); }
        else {
            res.json(results);
        }
    })
}

exports.user_list = function(req, res, next) {
    const params = {
        TableName: "GameGateAccounts",
        ProjectionExpression: 'FollowingMap, Email, ProfilePicture, Following, Planning, Completed, Followers, CurrentG, Dropped, FollowersMap, Username'
    };
    docClient.scan(params, function(err, results) {
        // console.log(results);
        if(err) { return next(err); }
        else {
            res.json(results);
        }
    })
}