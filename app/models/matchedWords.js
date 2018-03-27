const mongoose  = require('mongoose');//requires the module mongoose

// matchedWords model
const matchedWordsSchema    = mongoose.Schema({
   //this is the matchedWords schema like the database 
   keyword          : { type: String, maxlength: 20 },
   matchedWord      : { type: String, maxlength: 20 },    
   relation         : { type: String, maxlength: 1 },
   numberOfMatches  : { type: Number, min: 0 },
});
 
// matchedWords methods


var isValidmatch = function(keyword, enteredword, relation){// this function checkes if the word enetered is a valid match, if it isnt there at all, we add it
    //return any(keyword, matchedWord.keyword), enteredword, ;
}
module.exports = mongoose.model('MatchedWords', matchedWordsSchema); //this string matchedWords will always refer to this keyword schema