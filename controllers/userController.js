var async = require('async');
const AWS = require('aws-sdk');
const AmazonCognitoIdentity = require('amazon-cognito-identity-js');

var myCredentials = new AWS.CognitoIdentityCredentials({IdentityPoolId:'us-east-1:1f1634e0-e85f-4ffe-a509-ecb75c777309'});
var myConfig = new AWS.Config({
  credentials: myCredentials, region: 'us-east-1'
});

AWS.config.update(myConfig);

const docClient = new AWS.DynamoDB.DocumentClient();

exports.user_login = function(req, res, next) {
    console.log(req.body.email);
    var params = {
        TableName: "GameGateAccounts",
        Key: {
            "Email": req.body.email
        }
    }
    docClient.get(params, function(err, data) {
        if(err) {
            console.log(err);
            res.send(err);
        } else if(Object.keys(data).length === 0) {
            const error = new Error('No user found');
            error.status = 401;
            next(error);
        }
        else if (!err && Object.keys(data).length !== 0) {
            if (req.body.password === data.Item.Password) {

                    const authDetails = new AmazonCognitoIdentity.AuthenticationDetails({
                        Username: req.body.email,
                        Password: req.body.password,
                    })
                    const poolData = {
                        UserPoolId: "us-east-1_hWhzBDves",
                        ClientId: "4bihl57dd69s099uhp3alaj649"
                    }

                    const UserPool = new AmazonCognitoIdentity.CognitoUserPool(poolData);

                    const user = new AmazonCognitoIdentity.CognitoUser({
                        Username: req.body.email,
                        Pool: UserPool,
                    })

                    user.authenticateUser(authDetails, {
                        onSuccess: function(result) {
                            var accessToken = result.getAccessToken().getJwtToken();

                            var idToken = result.idToken.jwtToken;
                            // res.json({
                            //     accessToken: accessToken,
                            //     idToken: idToken
                            // })
                            const newData = {};
                            for(let i in data.Item) {
                                if(i !== 'Password') {
                                    newData[i] = data.Item[i];
                                }
                            }
                            res.json(newData);
                        },
                        onFailure: function(err) {
                            res.send(err);
                        }
                    })
                }
        }
    })
}

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
                ProjectionExpression: 'FollowingMap, Email, ProfilePicture, Following, Planning, PlanningGames, Completed, CompletedGames, Followers, CurrentG, CurrentGames, Dropped, DroppedGames, FollowersMap, Username'
            }
            docClient.query(params, function(err, results) {
                let error = new Error('User does not exist');
                if(results.Count==0) {
                    error.status = 404;
                    callback(error);
                }
                else {
                    callback(err, results);
                }
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

exports.user_followings = function(req, res, next) {
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
        ProjectionExpression: 'Following, FollowingMap'
    }
    docClient.query(params, function(err, results) {
        if(err) { return next(err); }
        else {
            res.json(results);
        }
    })
}

exports.user_follows = function(req, res, next) {
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
        ProjectionExpression: 'Followers, FollowersMap, Following, FollowingMap'
    }
    docClient.query(params, function(err, results) {
        if(err) { return next(err); }
        else {
            res.json(results);
        }
    })
}

exports.user_planning = function(req, res, next) {
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
        ProjectionExpression: 'Planning, PlanningGames'
    }
    docClient.query(params, function(err, results) {
        if(err) { return next(err); }
        else {
            res.json(results);
        }
    })
}

exports.user_completed = function(req, res, next) {
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
        ProjectionExpression: 'Completed, CompletedGames'
    }
    docClient.query(params, function(err, results) {
        if(err) { return next(err); }
        else {
            res.json(results);
        }
    })
}

exports.user_current = function(req, res, next) {
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
        ProjectionExpression: 'CurrentG, CurrentGames'
    }
    docClient.query(params, function(err, results) {
        if(err) { return next(err); }
        else {
            res.json(results);
        }
    })
}

exports.user_dropped = function(req, res, next) {
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
        ProjectionExpression: 'Dropped, DroppedGames'
    }
    docClient.query(params, function(err, results) {
        if(err) { return next(err); }
        else {
            res.json(results);
        }
    })
}

exports.user_game_statuses = function(req, res, next) {
    const { gameName } = req.query;
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
        ProjectionExpression: 'Planning, PlanningGames, Completed, CompletedGames, CurrentG, CurrentGames, Dropped, DroppedGames'
    }
    docClient.query(params, function(err, results) {
        if(err) { return next(err); }
        else {
            if(gameName) {
                if(results.Count === 0) {
                    res.json({
                        status: null
                    })
                    return;
                }
                const arr = ['PlanningGames', 'CompletedGames', 'CurrentGames', 'DroppedGames'];
                for(let i of arr) {
                    for(let j in results.Items[0][i]) {
                        if(j == gameName) {
                            res.json({
                                status: i
                            });
                            return;
                        }
                    }
                }
                res.json({
                    status: null
                })
            }
            else {
                res.json(results);
            }
        }
    })
}

exports.user_list = function(req, res, next) {
    const { Username } = req.query;
    if(Username) {
        const params = {
            TableName: "GameGateAccounts",
            IndexName: "Username-index",
            KeyConditionExpression: "#username = :User3",
            ExpressionAttributeNames: {
                "#username": "Username"
            },
            ExpressionAttributeValues: {
                ":User3": Username
            },
            ProjectionExpression: 'ProfilePicture, Username'
        }
        docClient.query(params, function(err, results) {
            let error = new Error('User does not exist');
            if(results.Count==0) {
                error.status = 404;
                return next(error);
            }
            else {
                res.json(results);
            }
        })
    }
    else {
        const params = {
            TableName: "GameGateAccounts",
            ProjectionExpression: 'Email, ProfilePicture, Following, Planning, PlanningGames, Completed, CompletedGames, Followers, CurrentG, CurrentGames, Dropped, DroppedGames, FollowersMap, Username'
        };
        docClient.scan(params, function(err, results) {
            if(err) { return next(err); }
            else {
                res.json(results);
            }
        })
    }
}