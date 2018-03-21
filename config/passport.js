const LocalStrategy     = require('passport-local').Strategy;
const mongoose          = require('mongoose');

var User = mongoose.model('User');

/////////////////////////
/////////////////////////
////REPHRASE COMMENTS////
/////////////////////////
/////////////////////////

module.exports = function(passport) {

    passport.serializeUser(function(user, done) {
        done(null, user._id);
    });
    
    passport.deserializeUser(function(id, done) {
        User.findById(id, function(err, user) {
            done(err, user);
        });
    });

    passport.use('local-login', new LocalStrategy({
        passReqToCallback : true
    },
    function(req, username, password, done) { 
        // check in mongo if a player with the username exists or not
        User.findOne({ 'username' :  username }, function(err, user) {
            // In case of any error, return using the done method
            if (err)
                return done(err);
            // If the username is incorrect, message user not found
            if (!user){
                return done(null, false, req.flash('message', 'User Not found.'));                 
            }
            // User exists but wrong password, inform user that the password is invalid
            if (!user.isValidPassword(user, password)){
                return done(null, false, req.flash('message', 'Invalid Password'));
            }
            // User and password both match, take player to the logged in page
            // done method which will be treated like success
            return done(null, user);
        }
        );
    }));

    passport.use('local-signup', new LocalStrategy({
        passReqToCallback : true
      },
      function(req, username, password, done) {
        process.nextTick(function(){
          // find a user in Mongo with provided username
            var email = req.body.email;
            User.findOne({'username':username},function(err, user) {
                // In case of any error return
                if (err){
                    return done(err);
                }
                // already exists
                if (user) {
                    return done(null, false, req.flash('message', 'User Already Exists'));
                } else {
                    User.findOne({'email':email},function(err, user) {
                        // In case of any error return
                        if (err){
                            return done(err);
                        }
                        // already exists
                        if (user) {
                            return done(null, false, req.flash('message', 'Email Address Already Exists'));
                        }else{    
                            // if there is no user with that username or email address
                            // create the user
                            var newUser = new User();
                            newUser.username = username;
                            newUser.password = newUser.generateHash(password);
                            newUser.email = email;
                    
                            // save the user
                            newUser.save(function(err) {
                                if (err) {  
                                    throw err;  
                                }   
                                return done(null, newUser);
                            });
                        }
                    });
                };
            });
        });
    }));
}