var express = require('express');
var bodyParser = require('body-parser');
var passport = require('passport');
var authJwtController = require('./auth_jwt');
var User = require('./Users');
var Movie = require('./Movies');
var Review = require('./Reviews');
var jwt = require('jsonwebtoken');
var cors = require('cors');
const crypto = require("crypto");
var rp = require('request-promise');
//require('dotenv').config({ path:'.env'});

var app = express();
module.exports = app;
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use(passport.initialize());

var router = express.Router();

/*
router.route('/test')
    .get(function (req, res) {
            then(function (response) {
                console.log(response.body);
                res.status(200).send('Event Successful.').end();
            })
    });
*/

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
        res.json({success: false, message: 'You must enter a username and password.'});
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
                    return res.json({ success: false, message: 'That username is taken. '});
                else
                    return res.send(err);
            }

            res.json({ success: true, message: 'Success!' });
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
                res.status(401).send({success: false, message: 'Wrong username or password.'});
            }
        });


    });
});

router.route('/movies/:reviews?')
    .post(authJwtController.isAuthenticated, function (req, res) {
        if (req.body.title && req.body.year_released && req.body.genre){
          if(Object.keys(req.body.actor_name).length < 3 || Object.keys(req.body.character_name).length < 3){
              res.json({success: false, message: 'Arrays must contain 3 values.'});
            }
          else {
              var movies = new Movie();
              movies.title = req.body.title;
              movies.year_released = req.body.year_released;
              movies.genre = req.body.genre;
              movies.actor_name = req.body.actor_name;
              movies.character_name = req.body.character_name;
              movies.ID = req.body.ID;
              movies.save(function (err) {
                  if (err) {
                      return res.send(err);
                  }
                  else {
                      res.status(200).send({
                          status: 200,
                          msg: 'Movie saved.',
                          headers: req.headers,
                          query: req.query,
                          env: process.env.UNIQUE_KEY
                      });
                  }
              });
          }
        }
        else{
            res.json({success: false, messsage: 'Required fields: Title, Release Date, Genre, Actors.'});
        }
    })
    .get(authJwtController.isAuthenticated, function (req, res) {
        if(req.query.reviews && req.query.moviename === undefined){
            Movie.aggregate()
                .match({ID: {$gte: 1}})
                .lookup({from: 'reviews', localField: 'ID', foreignField: 'ID', as: 'reviews'})
                .exec(function (err, movie) {
                    res.send(movie);
                })
        }
        else {
            Movie.find(function (err, result) {
                if (err) {
                    return res.send(err);
                } else {
                    if (req.query.moviename) {
                        let jsonToSend;
                        var movieJson;
                        var reviewJson;
                        var movie_found = false;
                        for (let i = 0; i < result.length; ++i) {
                            if (req.query.moviename === result[i]._doc.title) {
                                movieJson = result[i]._doc;
                                movie_found = true;
                                break;
                            }
                        }
                        if (movie_found === false) {
                            res.send("No movies exists with that title!");
                            return;
                        }
                        if (req.query.reviews === "true") {
                            Review.find(function (err, result) {
                                if (err) {
                                    return res.send(err);
                                } else {
                                    var review_found = false;
                                    for (let i = 0; i < result.length; ++i) {
                                        if (movieJson.ID === result[i]._doc.ID) {
                                            reviewJson = result[i]._doc;
                                            review_found = true;
                                            break;
                                        }
                                    }
                                    if (review_found) {
                                        jsonToSend = Object.assign(movieJson, reviewJson);
                                    } else {
                                        var tempJson = {"msg": "No reviews found for this movie!"};
                                        jsonToSend = Object.assign(movieJson, tempJson);
                                    }
                                    res.send(jsonToSend);
                                }
                            })
                        } else {
                            res.send(movieJson);
                        }
                    } else {
                        res.send(result);
                    }
                }
            });
        }
    })
    .put(authJwtController.isAuthenticated, function (req, res) {
        if(Object.keys(req.body.updatingJson).length == 2){
            var movie_array = req.body.updatingJson;
            var movie_title = movie_array[0].title;
          Movie.findOne({title: movie_title}, function (err, result) {
              if (err) {
                  return res.send(err);
              }
              else{
                  if(result == null){
                      res.send("No matching movies.");
                  }
                  else{
                      result.title = req.body.new_title;
                      Movie.update({title: movie_title}, movie_array[1], function (err, raw) {
                          if(err){
                              res.send(err);
                          }
                          res.send("Movie updated.");
                      });
                  }
              }
          })
        }
        else{
            res.send("Enter a title and the title you'd like to replace it with.");
        }
    })
    .delete(authJwtController.isAuthenticated, function(req,res){
        if(req.body.title){
            Movie.deleteOne({title: req.body.title}, function (err, raw) {
                if(err){
                    res.send(err);
                }
                res.send("Movie deleted.");
            });
        }
        else{
            res.send("Enter a movie title.");
        }
    })
    .all(function (req, res) {
        res.status(405).send({msg: 'Invalid method.'});
    });

router.route('/review')
    .post(authJwtController.isAuthenticated, function(req, res){
        if(req.body.name && req.body.review && req.body.rating && req.body.ID){
            Movie.find({ID : parseInt(req.body.ID)}, null, function (err, docs) {
                if(docs.length > 0) {
                    var review = new Review();
                    review.name = req.body.name;
                    review.review = req.body.review;
                    review.rating = req.body.rating;
                    review.ID = req.body.ID;
                    review.save(function (err) {
                        if (err) {
                            return res.send(err);
                        } else {
                            res.status(200).send({
                                status: 200,
                                msg: 'Review saved.',
                                headers: req.headers,
                                query: req.query,
                                env: process.env.UNIQUE_KEY
                            });
                        }
                    });
                }
                else{
                    res.status(400).send({success: false, message: 'No matching movies.'});
                }
            });
        }
        else{
            res.status(400).send({success: false, message: 'Required fiels: Name, Review, Rating, Movie ID'});
        }
    })
    .get(function(req,res){
        Review.find(function (err, result) {
            if (err) {
                return res.send(err);
            }
            else{
                res.send(result);
            }
        });
    })
    .all(function (req, res) {
        res.status(405).send({msg: 'Invalid Method.'});
    });


app.use('/', router);
app.listen(process.env.PORT || 8080);
