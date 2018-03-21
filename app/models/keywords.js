const mongoose  = require('mongoose');//requires the module mongoose

// keywords model
const keywordsSchema    = mongoose.Schema({
   //this is the keywords schema like the database 
   keyword    : { type: String, maxlength: 20 },
   mode       : {type:String}
});
 
// keywords methods

var getRandomKeyword = function(){
    return ('random')
}
module.exports = mongoose.model('Keywords', keywordsSchema); //this string keywords will always refer to this keyword schema