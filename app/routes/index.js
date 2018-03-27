const express   = require('express');
const router    = express.Router();
var wordNet = require('wordnet-magic');
module.exports = function(passport) {
 
    router.get('/', function(req, res) {
      if(req.user){
        res.render('index', { username: req.user.username, authenticated: true });
      }else{
        res.render('index', { authenticated: false });
      }
    });

    router.get('/login', function(req,res){
      res.render('logIn');
    });

    router.post('/login', function(req, res, next){
      passport.authenticate('local-login', function(err, user, info){
        if(err){
          return res.render('login');
        }
        if(!user){
          return res.render('login');
        }
        req.login(user, loginerror => {
          if(loginerror){
            return res.render('login');
          }
          return res.render('loggedIn');
        });
      })(req, res, next);
    });

    router.get('/signup', function(req,res){
      res.render('signUp');
    });

    router.post('/signup', function(req,res, next){
      passport.authenticate('local-signup', function(err, user, info){
        if(err){
          return next(err);
        }
        if(!user){
          return res.render('signUp');
        }
        req.login(user, loginerror => {
          if(loginerror) {
            return next(loginerror);
          }
          return res.render('loggedIn');
        });
      })(req, res, next);
    });

    router.get('/leaderboard', function(req,res){
      res.render('leaderboard');
      //here i will say: if user is logged in: show them their high score and overall position, else just show the top 10.
    });

    router.get('/rules', function(req,res){
      res.render('rules');
    });

    router.get('/loggedin', function(req,res){
      res.render('loggedIn');
    });

    router.get('/searching', function(req,res){
      res.render('searching');
    });

    router.get('/countdown', function(req,res){
      res.render('countdown');
    });

    router.get('/game', function(req,res){
      res.render('game');
    });


    router.post('/login', passport.authenticate('local-login', {
      successRedirect: '/',
      failureRedirect: '/',
      failureFlash : true 
    }));

    router.get('/logout', function(req, res) {
        req.logout();
        res.redirect('/');
    });

    router.get('/register', function(req, res){
      res.render('register', {message: req.flash('message')});
    });

    router.get('/endGame', function(req, res){
      res.render('endGame', {message: req.flash('message')});
    });

    router.get('/home', function(req, res){
      res.render('home', {message: req.flash('message')});
    });

    router.get('/game', function(req, res){
      res.render('game', {message: req.flash('message')});
    });
   
    router.get('/highscore', function(req, res){
      if(!req.user){
        return res.json({highscore: 40});
      }else{
        return res.json({highscore:req.user.highscore});
      }
    });

    router.post('/register', passport.authenticate('local-signup', {
      successRedirect: '/',
      failureRedirect: '/register',
      failureFlash : true 
    }));
   
    return router;
}
