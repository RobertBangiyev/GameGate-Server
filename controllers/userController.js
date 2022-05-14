var async = require('async');
const AWS = require('aws-sdk');
const bcrypt = require('bcryptjs');
const AmazonCognitoIdentity = require('amazon-cognito-identity-js');

var myCredentials = new AWS.CognitoIdentityCredentials({IdentityPoolId:'us-east-1:1f1634e0-e85f-4ffe-a509-ecb75c777309'});
var myConfig = new AWS.Config({
  credentials: myCredentials, region: 'us-east-1'
});

AWS.config.update(myConfig);

const docClient = new AWS.DynamoDB.DocumentClient();

exports.user_login = function(req, res, next) {
    var params = {
        TableName: "GameGateAccounts",
        Key: {
            "Email": req.body.email
        }
    }
    docClient.get(params, function(err, data) {
        if(err) {
            const error = new Error('Incorrect credentials');
            error.status = 400;
            return next(error);
        } else if(Object.keys(data).length === 0) {
            const error = new Error('No user found');
            error.status = 401;
            next(error);
        }
        else if (!err && Object.keys(data).length !== 0) {
            const samePass = bcrypt.compareSync(req.body.password, data.Item.Password);
            if (samePass) {
                    const authDetails = new AmazonCognitoIdentity.AuthenticationDetails({
                        Username: req.body.email,
                        Password: data.Item.Password,
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
                            const idToken = result.idToken.jwtToken;
                            const refreshToken = result.getRefreshToken().getToken();

                            const newData = {};
                            for(let i in data.Item) {
                                if(i !== 'Password') {
                                    newData[i] = data.Item[i];
                                }
                            }
                            res.json({
                                userInfo: newData,
                                refreshToken: refreshToken,
                                idToken: idToken
                            });
                        },
                        onFailure: function(err) {
                            const error = new Error('Incorrect credentials');
                            error.status = 400;
                            return next(error);
                        }
                    })
            } else {
                const error = new Error('Incorrect credentials');
                error.status = 400;
                return next(error);
            }
        }
    })
}

exports.user_registration = function(req, res, next) {
    let error = new Error('Email or username already in use');
    error.status = 400;
    async.parallel({
        email: function(callback) {
            const params = {
                TableName: "GameGateAccounts",
                KeyConditionExpression: "#email = :email3",
                ExpressionAttributeNames: {
                    "#email": "Email"
                },
                ExpressionAttributeValues: {
                    ":email3": req.body.email
                }
            }
            docClient.query(params, function(err, data) {
                callback(err, data);
            })
        },
        username: function(callback) {
            var params = {
                TableName: "GameGateAccounts",
                IndexName: "Username-index",
                KeyConditionExpression: "#username = :User3",
                ExpressionAttributeNames: {
                    "#username": "Username"
                },
                ExpressionAttributeValues: {
                    ":User3": req.body.username
                }
            }
            docClient.query(params, function(err, data){
                callback(err, data);
            })
        }
    }, function(err, results) {
        if(err) { 
            return next(err); 
        }
        else {
            if(results.email.Count === 0 && results.username.Count === 0) {
                const poolData = {
                    UserPoolId: "us-east-1_hWhzBDves",
                    ClientId: "4bihl57dd69s099uhp3alaj649"
                }

                const UserPool = new AmazonCognitoIdentity.CognitoUserPool(poolData);

                const newSalt = bcrypt.genSaltSync(10);
                const hashedPassword = bcrypt.hashSync(req.body.pw, newSalt);

                UserPool.signUp(req.body.email, hashedPassword, [], null, (err, data) => {
                    if(err) {
                        const err = new Error("Password must be at least 6 characters");
                        err.status = 400;
                        return next(err);
                    } else {
                        var params = {
                            TableName: "GameGateAccounts",
                            Item: {
                                "Email": req.body.email,
                                "Password": hashedPassword,
                                "Username": req.body.username,
                                "ProfilePicture": "https://i.imgur.com/y0B5yj6.jpg",
                                "CurrentG": 0,
                                "Completed": 0,
                                "Dropped": 0,
                                "Planning": 0,
                                "Followers": 0,
                                "Following": 0,
                                "FollowersMap": {},
                                "FollowingMap": {},
                                "CompletedGames": {},
                                "CurrentGames": {},
                                "DroppedGames": {},
                                "PlanningGames": {},
                                "UserFeedIDs": []
                            }
                        }
                        docClient.put(params, function(err, data) {
                            if (err) {
                                const error = new Error('Registration failed');
                                error.status = 400;
                                return next(error);
                            } else {
                                res.json({
                                    success: true
                                });
                            }
                        })
                    }
                })
            } else {
                const error = new Error('Email or username already used');
                error.status = 400;
                return next(error);
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

exports.user_followings_add = function(req, res, next) {
    const newId = req.body.newId ? true : false;
    var params = {
        TableName:"GameGateAccounts",
            Key:{
            "Email": req.body.email,
        },
        UpdateExpression: "SET #fl.#userN = :userViewedName, Following = Following + :val",
        ConditionExpression: "attribute_not_exists(#fl.#userN.Username)",
        ExpressionAttributeNames: {
            "#fl": "FollowingMap",
            "#userN": req.body.theirEmail
        },
        ExpressionAttributeValues:{
            ":userViewedName":{
                "Username": req.body.theirUsername,
                "ProfilePicture": req.body.theirProfilePicture
            },
            ":val": 1
        },
        ReturnValues:"UPDATED_NEW"
    };
    docClient.update(params, function(err, data) {
        if(err) { return next(err); }
        else {
            res.json({
                idToken: req.body.idToken,
                newId: newId,
                newFollowingsInfo: data
            });
        }
    })
}

exports.user_followers_add = function(req, res, next) {
    const newId = req.body.newId ? true : false;
    var params = {
        TableName:"GameGateAccounts",
            Key:{
            "Email": req.body.theirEmail,
        },
        UpdateExpression: "SET #fl.#userN = :yourUsername, Followers = Followers + :val",
        ConditionExpression: "attribute_not_exists(#fl.#userN.Username)",
        ExpressionAttributeNames: {
            "#fl": "FollowersMap",
            "#userN": req.body.email
        },
        ExpressionAttributeValues:{
            ":yourUsername":{
                "Username": req.body.username,
                "ProfilePicture": req.body.profilePic
            },
            ":val": 1
        },
        ReturnValues:"UPDATED_NEW"
    };
    docClient.update(params, function(err, data) {
        if(err) { return next(err); }
        else {
            res.json({
                idToken: req.body.idToken,
                newId: newId,
                newFollowersInfo: data
            });
        }
    })
}