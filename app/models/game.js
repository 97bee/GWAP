const mongoose  = require('mongoose');//requires the module mongoose

// game model
const gameSchema    = mongoose.Schema({
   //this is the game schema like the database 
   room         : { type: mongoose.Schema.Types.ObjectId, ref: 'Room' },
   keyword      : { type: String },
   relation    : { type: String },
   guesses      : [{
                    player: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, 
                    guess:  { type: String },
                }]
});
 
// game methods
module.exports = mongoose.model('Game', gameSchema);