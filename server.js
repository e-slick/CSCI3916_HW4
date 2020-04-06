var express = require('express');
var bodyParser = require('body-parser');
var passport = require('passport');
var authJwtController = require('./auth_jwt');
var User = require('./Users');
var jwt = require('jsonwebtoken');
var cors = require('cors');

var Movie = require('./Movies');

var app = express();
module.exports = app; // for testing
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use(passport.initialize());

var router = express.Router();

router.route('/postjwt')
    .post(authJwtController.isAuthenticated, function (req, res) {
            console.log(req.body);
            res = res.status(200);
            if (req.get('Content-Type')) {
                console.log("Content-Type: " + req.get('Content-Type'));
                res = res.type(req.get('Content-Type'));
            }
            res.send(req.body);
        }
    );

router.route('/users/:userId')
    .get(authJwtController.isAuthenticated, function (req, res) {
        var id = req.params.userId;
        User.findById(id, function(err, user) {
            if (err) res.send(err);

            var userJson = JSON.stringify(user);
            res.json(user);
        });
    });

router.route('/users')
    .get(authJwtController.isAuthenticated, function (req, res) {
        User.find(function (err, users) {
            if (err) res.send(err);
            // return the users
            res.json(users);
        });
    });

router.post('/signup', function(req, res) {
    if (!req.body.username || !req.body.password) {
        res.json({success: false, message: 'Please pass username and password.'});
    }
    else {
        var user = new User();
        user.name = req.body.name;
        user.username = req.body.username;
        user.password = req.body.password;
        // save the user
        user.save(function(err) {
            if (err) {
                // duplicate entry
                if (err.code == 11000)
                    return res.json({ success: false, message: 'A user with that username already exists. '});
                else
                    return res.send(err);
            }

            res.json({ success: true, message: 'User created!' });
        });
    }
});

router.post('/signin', function(req, res) {
    var userNew = new User();
    userNew.username = req.body.username;
    userNew.password = req.body.password;

    User.findOne({ username: userNew.username }).select('name username password').exec(function(err, user) {
        if (err) res.send(err);

        user.comparePassword(userNew.password, function(isMatch){
            if (isMatch) {
                var userToken = {id: user._id, username: user.username};
                var token = jwt.sign(userToken, process.env.SECRET_KEY);
                res.json({success: true, token: 'JWT ' + token});
            }
            else {
                res.status(401).send({success: false, message: 'Authentication failed.'});
            }
        });


    });
});

router.post('/movies', authJwtController.isAuthenticated, function(req, res){
        if (req.body.releaseDate || req.body.title || req.body.genre){
            if(Object.keys(req.body.actorName).length < 3 || Object.keys(req.body.charName).length < 3){
                res.json({success: false, message: 'Actor/Character array requires 3 attributes'});
            }
            else {
                var movies = new Movie();
                movies.releaseDate = req.body.releaseDate;
                movies.title = req.body.title;
                movies.genre = req.body.genre;
                movies.actorName = req.body.actorName;
                movies.charName = req.body.charName;
                movies.save(function (err) {
                    if (err) {
                        return res.send(err);
                    }
                    else {
                        res.status(200).send({
                            status: 200,
                            msg: 'Saved successfully.',
                            headers: req.headers,
                            query: req.query,
                            env: process.env.UNIQUE_KEY
                        });
                    }
                });
            }
        }
        else{
            res.json({success: false, message: 'Title, Release Date, Genre and Actors fields all required.'});
        }
    })
router.get('/movies', authJwtController.isAuthenticated, function (req, res) {
        Movie.find(function (err, result) {
            if (err) {
                return res.send(err);
            }
            else{
                res.send(result);
            }
        }); })

router.put('/movies', authJwtController.isAuthenticated, function (req, res) {
        if(Object.keys(req.body.newInfo).length == 2){
            var arrMovies = req.body.newInfo;
            var mTitle = arrMovies[0].title;
            Movie.findOne({title: mTitle}, function (err, result) {
                if (err) {
                    return res.send(err);
                }
                else{
                    if(result == null){
                        res.send("That movie doesn't exist in the database.");
                    }
                    else{
                        result.title = req.body.new_title;
                        Movie.update({title: mTitle}, arrMovies[1], function (err, raw) {
                            if(err){
                                res.send(err);
                            }
                            res.send("Movie updated.");
                        });
                    }
                }
            })
        }
        else {
            res.send("Enter the movie title to find. Then enter the updated title.");
        }
    })

router.delete('/movies', authJwtController.isAuthenticated, function(req,res){
        if(req.body.title){
            Movie.deleteOne({title: req.body.title}, function (err, raw) {
                if(err){
                    res.send(err);
                }
                res.send("Movie deleted.");
            });
        }
        else{
            res.send("Enter your movie title.");
        }
    })

router.all(function (req, res) {
        res.status(405).send({msg: 'HTTP method not supported.'});
    });


app.use('/', router);
app.listen(process.env.PORT || 8080);
