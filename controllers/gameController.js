var async = require('async');
const axios = require('axios');
const AWS = require('aws-sdk');

var myCredentials = new AWS.CognitoIdentityCredentials({IdentityPoolId:'us-east-1:1f1634e0-e85f-4ffe-a509-ecb75c777309'});
var myConfig = new AWS.Config({
  credentials: myCredentials, region: 'us-east-1'
});

AWS.config.update(myConfig);

const docClient = new AWS.DynamoDB.DocumentClient();

function timeConverter(UNIX_timestamp){
    var a = new Date(UNIX_timestamp * 1000);
    var year = a.getFullYear();
    return year;
}

exports.game_details = function(req, res, next) {
    async.parallel({
        game: function(callback) {
            var data = `fields name,first_release_date,genres.name,platforms.name,cover.url,summary; where id=${req.params.id};`;

            var config = {
            method: 'post',
            url: 'https://api.igdb.com/v4/games',
            headers: { 
                'Client-ID': process.env.CLIENT_ID,
                'Authorization': process.env.BEARER_TOKEN, 
                'Content-Type': 'text/plain'
            },
            data : data
            };

            axios(config)
            .then(function (response) {
                let arr = (response.data[0].cover.url).split('/');
                arr[6] = 't_cover_big';
                const newUrl = arr.join('/');
                response.data[0].smallCover = response.data[0].cover.url;
                response.data[0].cover.url = newUrl;
                response.data[0].first_release_date = timeConverter(response.data[0].first_release_date);
                callback(null, response);
            })
            .catch(function (error) {
                callback(error, null);
            });
        },
        reviews: function(callback) {
            const params = {
                TableName: "Games",
                KeyConditionExpression: "#gameID = :gameID3",
                ExpressionAttributeNames: {
                    "#gameID": "GameID",
                },
                ExpressionAttributeValues: {
                    ":gameID3": req.params.id
                }
            };
            docClient.query(params, function(err, data) {
                callback(err, data);
            })
        }
    }, function(err, results) {
        if(err) { return next(err); }
        let totalScore = 'No Ratings';
        if(results.reviews.Count != 0) {
            totalScore = 0;
            for(let i = 0; i < results.reviews.Count; i++) {
                totalScore += parseInt(results.reviews.Items[i].Rating);
            }
            totalScore = totalScore / results.reviews.Count;
            totalScore = Math.round(totalScore * 100) / 100;
        }
        const output = {
            game: results.game.data,
            averageScore: totalScore,
            reviews: results.reviews
        };
        res.json(output);
    })
}

exports.game_reviews = function(req, res, next) {
    const params = {
        TableName: "Games",
        KeyConditionExpression: "#gameID = :gameID3",
        ExpressionAttributeNames: {
            "#gameID": "GameID",
        },
        ExpressionAttributeValues: {
            ":gameID3": req.params.id
        }
    };
    docClient.query(params, function(err, data) {
        if(err) { return next(err); }
        else {
            res.json(data);
        }
    })
}

exports.game_list = function(req, res, next) {
    const { searchTerm } = req.query;
    if(searchTerm) {
        var data = `search "${searchTerm}";fields name,cover.url, first_release_date;`;

        var config = {
            method: 'post',
            url: 'https://api.igdb.com/v4/games',
            headers: { 
                'Client-ID': process.env.CLIENT_ID,
                'Authorization': process.env.BEARER_TOKEN, 
                'Content-Type': 'text/plain'
            },
            data : data
        };

        axios(config)
        .then(function (response) {
            res.json(response.data);
        })
        .catch(function (error) {
            res.json(error);
        });
    } else {
        var data = 'fields name,cover.url, first_release_date; limit 20;';

        var config = {
        method: 'post',
        url: 'https://api.igdb.com/v4/games',
        headers: { 
            'Client-ID': process.env.CLIENT_ID,
            'Authorization': process.env.BEARER_TOKEN, 
            'Content-Type': 'text/plain'
        },
        data : data
        };

        axios(config)
        .then(function (response) {
            res.json(response.data);
        })
        .catch(function (error) {
            console.log(error);
        });
    }
}