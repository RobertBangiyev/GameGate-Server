var jwt = require('jsonwebtoken');
var jwkToPem = require('jwk-to-pem');
const AmazonCognitoIdentity = require('amazon-cognito-identity-js');
var CognitoRefreshToken = require('amazon-cognito-identity-js').CognitoRefreshToken;

exports.verify_login = function(req, res, next) {
    const idToken = req.body.idToken;
    const refreshToken = req.body.refreshToken;

    let jwk = {
        keys: [
        {
        alg: "RS256",
        e: "AQAB",
        kid: "7TBkUbkW4HX+7rcIFG7bMrDZn7cI5Cfj0sfCEtXyjKE=",
        kty: "RSA",
        n: "uP3Zv_uSVb1623BjACz2hdS9-QfzSsoj-qPhCS5YdHERM6R9imFz6ruNlS3DMls5fJtMa0osndg8QqrBG5I01h_rJVjnCJrD04OgmQMizcOe0VPBCE7OvSnsp2lIMrkeAoIhwglWP5hgtIMft2wAqL_PENln5Nc4NCe0TPyCAArr9D4QIyL3JdaNAlG7DBci5zTOY1atP4g00HoGmviflslQLO1-HzqTrxkbNuvMDuShtIr1jbbxn0LKYbJNT-cn80WZUhuS-lVdejNUlWuJYYWvpSuQ3MN1d8pllswINgL3DcJh18mUut-S0tiORXf0SsKWBkuWxn-9weQd8IJs0Q",
        use: "sig"
        },
        {
        alg: "RS256",
        e: "AQAB",
        kid: "r9mwyJuOq6s3KNbZdCO3z32wcZlmiHyEgUNNp+xJjiI=",
        kty: "RSA",
        n: "wor8C8e2wYJLXRCs8yb9Mm7oQdzt-Dc91b8ykOuZrxDRYwqZtlEHpxZM_yYtzU1zx0RgjLrz3UxtjzAM4Ar7lP-u0jlHAR_hSChgTCj9PmQL5CU-hWk5cBEILUelBPrNz9ZMT-KtxAvRlk65wRkwgJtKrenndQ5Uh-7iTUVdlaLCezEHrYd7DiyLa_fvab25EdnyernhuanDPw3fWITpQA7HaK_A4paP_bnGlNLXcWjEwTI9NEhSCp8nOYP8haL5Fr4tWdNxzB1zjZZKPOkPUZTyqbr2Yu7P1hru8J7wA8bvHTARYWlkGu_6kviBgIChEdai85NLIl60-ijOkiKgEw",
        use: "sig"
        }
        ]
    }

    var pem = jwkToPem(jwk.keys[0]);
    jwt.verify(idToken, pem, { algorithms: ['RS256'] }, function(err, decodedToken) {
        if(err && err.message === 'invalid token') {
            const error = new Error('Unauthorized access');
            error.status = 401;
            return next(error);
        } else if(decodedToken == undefined) {
            var token = new CognitoRefreshToken({ RefreshToken: refreshToken });
            const poolData = {
                UserPoolId: "us-east-1_hWhzBDves",
                ClientId: "4bihl57dd69s099uhp3alaj649"
            }
            
            var userPool = new AmazonCognitoIdentity.CognitoUserPool(poolData);
            
            const cognitoUser = new AmazonCognitoIdentity.CognitoUser({
                Username: req.body.email,
                Pool: userPool,
            })

            cognitoUser.refreshSession(token, (err, session) => {
                if(err) {
                    const error = new Error('Unauthorized access');
                    error.status = 401;
                    return next(error); 
                }
                else {
                    req.newIdToken = session.idToken.jwtToken;
                    req.body.idToken = session.idToken.jwtToken;
                    return next();
                }
            })
        } else {
            if(decodedToken.email === req.body.email) {
                return next();
            } else {
                const error = new Error('Unauthorized access');
                error.status = 401;
                return next(error);
            }
        }
    });
}
