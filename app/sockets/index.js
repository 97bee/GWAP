const session       = require('express-session');
const mongoose      = require('mongoose');
const MongoStore    = require('connect-mongo')(session);
const connect       = require('connect');

const Room          = mongoose.model('Room');
const Game          = mongoose.model('Game');
const Keywords      = mongoose.model('Keywords');
const wordnet       = require('wordnet-magic');
const wn            = wordnet();

//i want this to happen only when you go onto the pvp page.
module.exports = function(io) {

    io.on('connection', function (socket) {
        console.log("Connected");

        if(socket.request.session.passport) {
            socket.userId = socket.request.session.passport.user;

            socket.on('findGame', function (data, t) {
                console.log('Find Game');
                var t = new Date();
                t.setSeconds(t.getSeconds() + 7);
                var noDate = new Date(0);
                Room.findOne(
                    { gamemode:data.mode, endedAt: noDate, startedAt: noDate },//finds a room of the same game mode that hasnt started
                )
                .populate({
                    path: 'host',
                    model: 'User'
                })
                .exec(function(err, room) {
                    if(!room){
                        console.log('Cant find a Game that hasnt started');
                        // Create a new Room if there is not one
                        var now = new Date();
                        var newroom = new Room({ gamemode: data.mode, host : socket.userId, createdAt: now, startedAt: noDate, endedAt: noDate, score: 0 });
                        newroom.save(function (err) {
                            if (err) return console.error(err);
                        });
                        socket.emit('created');
                    }else{
                        console.log('Found a Game that hasnt started');
                        // Found a Room
                        var clients = io.sockets.clients().sockets;// gets all the clients that are connected
                        //add opponenet id to room
                        for (var clientId in clients ) {//goes through all the clients that are connected
                            var client = io.sockets.connected[clientId]; 
                            if(client.userId == room.host.id) {
                                if(client.userId!=socket.userId){//if the room is not created by the user
                                    // update with opponent and started
                                    room.opponent=client.userId;
                                    var roomEndedAt = new Date();
                                    roomEndedAt.setSeconds(roomEndedAt.getSeconds() + 68);
                                    room.endedAt=roomEndedAt;
                                    room.save(function (err) {
                                        if (err) return console.error(err);
                                    });
                                    client.emit('joined', t, room.id);//tells the players we have joined and also sends t, the start time for the game.
                                    socket.emit('joined', t, room.id);

                                    socket.opponent = clientId;
                                    console.log(socket);
                                    client.opponent = socket.id;
                                    setTimeout(function(){getRandomWordFromKeywordsSchema(data.mode, room.id, room.endedAt)},7700);
                                    break;
                                }else{
                                    console.log('Game was created by own player, going to waiting room');
                                    socket.emit('created');
                                }
                            }
                        }
                    }
                });
            });
            function getRandomWordFromKeywordsSchema(mode, roomId, roomEndedAt){
                console.log("Game mode: "+ mode);
                //we need to say here, if mode = random, randomly select: S, A, H (synonyms, hypernums or atonyms) 
                if(mode=="R"){
                    var modes = ['S', 'A', 'H'];
                    mode=modes[Math.floor(Math.random() * 3)];
                }
                // Get the count of all keywords
                Keywords.count({mode:mode}).exec(function (err, count) {
                    // Get a random entry
                    var random = Math.floor(Math.random() * count)
  
                    // query all keywords, fetch one offset by random number and with correct mode
                    Keywords.findOne({mode:mode}).skip(random).exec(
                        function (err, keyword) {
                            //need to find out the two users and how to send this to them, we also need to find out the room id, 
                            var newgame = new Game({room:roomId, keyword:keyword.keyword, relation:mode});
                            newgame.save(function (err) {
                                if (err) return console.error(err);
                            });

                            var kword = new wn.Word(keyword.keyword.toLowerCase());
                            kword.getSynsets(function(err, wordNetArray){
                                console.log(wordNetArray);
                            });
                            kword.getAntonyms(function(err, wordNetArray){
                                console.log(wordNetArray);
                            });

                            /*if(mode==="S"){
                                wordNetArray="synonym";
                                console.log(wordNetArray);
                            }else if(mode==="H"){
                                kword.getHypernyms(function(err, wordNetArray){
                                    console.log(wordNetArray);
                                });
                            }else if(mode==="A"){
                                kword.getAntonyms(function(err, wordNetArray){
                                    console.log(wordNetArray);
                                });
                            }
                            console.log(wordNetArray);
*/

                            var client = io.sockets.connected[socket.opponent];

                            socket.emit('newword', newgame.keyword, newgame.relation, newgame.id, roomEndedAt);
                            client.emit('newword', newgame.keyword, newgame.relation, newgame.id, roomEndedAt); //tells the players that there is a new word, what the word is and its mode.
                            console.log("Create Game: " + newgame.keyword);
                        }
                    );
                });
            }
            
            socket.on("wordGuess", function(data){
                var guess=data.guess;
                var gameId=data.game;
                var roomId=data.room;
                var userId= socket.userId;
                Room.findById(roomId, function(err, room) {
                    if(room){
                        roommode=room.gamemode;
                    }
                });
                Game.findById(gameId, function(err, game) {
                    if(game){
                        var currentGuesses = game.guesses;
                        var isMatch = false;
                        for(var i=0; i<currentGuesses.length; i++) {
                            if(currentGuesses[i].player.id != userId && currentGuesses[i].guess == guess ) {
                                isMatch = true;
                            }
                        }
                        game.guesses.push({player: userId, guess: guess });//add the guess to the system if it is not found
                        game.save(function (err) {
                            if (err) return console.error(err);
                        });
                        //we have a match
                        //update score
                        if(isMatch) {
                            var client = io.sockets.connected[socket.opponent];
                            socket.emit('match', guess);
                            client.emit('match', guess);//tells the players theres been a match, and the word the match was on
                            getRandomWordFromKeywordsSchema(roommode, roomId);
                        }
                        //call the nextKeyword function
                        //i need to change the mode from random to the games mode 
                    }
                });
            });


            socket.on('disconnect', function () {
                io.emit('user disconnected');
            });
        }
    });

    return io;
}