const mongoose  = require('mongoose');//requires the module mongoose
const bCrypt    = require('bcrypt-nodejs'); //brypt is a hashing thing to make the password secure (encryption)

// user model
const userSchema    = mongoose.Schema({
   //this is the user schema like the database 
   username     : { type: String, maxlength: 20, lowercase: true },
   password     : { type: String },
   email        : { type: String, maxlength: 34 },
   highscore    : { type: Number, min: 0 , default: 0 },
});
 
// User methods
userSchema.methods.isValidPassword = function(user, password){
    return bCrypt.compareSync(password, user.password);
}

userSchema.methods.generateHash = function(password){
    return bCrypt.hashSync(password, bCrypt.genSaltSync(10), null);
}

module.exports = mongoose.model('User', userSchema); //this string user will always refer to this user schema