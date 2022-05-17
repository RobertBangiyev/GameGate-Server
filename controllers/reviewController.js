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


exports.game_reviews_create = function(req, res, next) {
  const newId = req.body.newId ? true : false;
  var params = {
    TableName: "Games",
    Item: {
        "GameID": req.body.id,
        "GameName": req.body.gameName,
        "Email": req.body.email,
        "Username": req.body.username,
        "Review": req.body.reviewText,
        "Rating": req.body.reviewScore,
        "GameImage": req.body.gameImg,
        "ProfilePic": req.body.profPic,
        "Upvotes": {},
        "UpvotesCount": 0
    }
  }
  docClient.put(params, function(err, data) {
    if (!err) {
      const reviewInfo = JSON.parse(req.body.reviewInfo);
        const moreReviewInfo = [...reviewInfo];
        let found = false;
        for(let i = 0; i < moreReviewInfo.length; i++) {
            if(moreReviewInfo[i].Username === req.body.username) {
                moreReviewInfo[i] = {
                    GameID: req.body.id,
                    GameName: req.body.gameName,
                    Email: req.body.email,
                    Username: req.body.username,
                    Review: req.body.reviewText,
                    Rating: req.body.reviewScore,
                    GameImage: req.body.gameImg,
                    ProfilePic: req.body.profPic,
                    Upvotes: {},
                    UpvotesCount: 0
                }
                found = true;
            }
        }
        if(!found) {
            moreReviewInfo.push({
                GameID: req.body.id,
                GameName: req.body.gameName,
                Email: req.body.email,
                Username: req.body.username,
                Review: req.body.reviewText,
                Rating: req.body.reviewScore,
                GameImage: req.body.gameImg,
                ProfilePic: req.body.profPic,
                Upvotes: {},
                UpvotesCount: 0
            });
        }
        res.json({
          idToken: req.body.idToken,
          newId: newId,
          reviewInfo: moreReviewInfo
        })
        return;
    } else {
        return next(err);
    }
})
}

exports.game_reviews_upvote = function(req, res, next) {
  const newId = req.body.newId ? true : false;
  var params = {
    TableName:"Games",
        Key:{
        "GameID": req.body.gameID.toString(),
        "Email": req.body.theirEmail
    },
    UpdateExpression: "SET #uv.#em = :upvote, UpvotesCount = UpvotesCount + :val" ,
    ConditionExpression: "attribute_not_exists(#uv.#em.Username)",
    ExpressionAttributeNames: {
        "#uv": "Upvotes",
        "#em": req.body.email
    },
    ExpressionAttributeValues:{
        ":upvote": {
            "Username": req.body.username,
        },
        ":val": 1,
    },
    ReturnValues:"UPDATED_NEW"
  };
  docClient.update(params, function(err, data) {
    if (err) {
        return next(err);
    } else {
        res.json({
          idToken: req.body.idToken,
          newId: newId
        })
    }
  });
}

exports.game_reviews_downvote = function(req, res, next) {
  const newId = req.body.newId ? true : false;
  var params = {
    TableName:"Games",
        Key:{
        "GameID": req.body.gameID.toString(),
        "Email": req.body.theirEmail
    },
    UpdateExpression: "REMOVE #uv.#em SET UpvotesCount = UpvotesCount - :val" ,
    ConditionExpression: "attribute_exists(#uv.#em.Username)",
    ExpressionAttributeNames: {
        "#uv": "Upvotes",
        "#em": req.body.email
    },
    ExpressionAttributeValues:{
        ":val": 1,
    },
    ReturnValues:"UPDATED_NEW"
  };
  docClient.update(params, function(err, data) {
    if (err) {
        return next(err);
    } else {
        res.json({
          idToken: req.body.idToken,
          newId: newId
        })
    }
  });
}