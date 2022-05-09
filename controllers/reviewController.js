var async = require('async');
const AWS = require('aws-sdk');

var myCredentials = new AWS.CognitoIdentityCredentials({IdentityPoolId:'us-east-1:1f1634e0-e85f-4ffe-a509-ecb75c777309'});
var myConfig = new AWS.Config({
  credentials: myCredentials, region: 'us-east-1'
});

AWS.config.update(myConfig);

const docClient = new AWS.DynamoDB.DocumentClient();

exports.review_list = function(req, res, next) {
  const { GameID, Username } = req.query;
  var params = {
    TableName: "Games"
  };
  docClient.scan(params, function(err, reviews) {
    if(err) { return next(err); }
    const newResult = {
      Items: [],
      Count: 0,
      ScannedCount: 0
    }
    if(GameID && Username) {
      reviews.Items.map(review => {
        if(review.GameID==GameID && review.Username==Username) {
          newResult.Items.push(review);
          newResult.Count++;
          newResult.ScannedCount++;
        }
      })
    }
    else if(GameID) {
      reviews.Items.map(review => {
        if(review.GameID==GameID) {
          newResult.Items.push(review);
          newResult.Count++;
          newResult.ScannedCount++;
        }
      })
      res.json(newResult);
    } else if(Username) {
      reviews.Items.map(review => {
        if(review.Username==Username) {
          newResult.Items.push(review);
          newResult.Count++;
          newResult.ScannedCount++;
        }
      })
      res.json(newResult);
    }
    else {
      res.json(reviews);
    }
  })
}