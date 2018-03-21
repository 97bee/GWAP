const mongoose  = require('mongoose');//requires the module mongoose

// room model
const roomSchema    = mongoose.Schema({
   //this is the room schema like the database 
   host         : { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
   opponent     : { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
   gamemode     : { type: String },
   createdAt    : { type: Date },
   startedAt    : { type: Date },
   endedAt      : { type: Date },
   score        : { type: Number},
});
 
// room methods

module.exports = mongoose.model('Room', roomSchema);