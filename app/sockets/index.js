const session       = require('express-session');
const mongoose      = require('mongoose');
const MongoStore    = require('connect-mongo')(session);
const connect       = require('connect');

const Room          = mongoose.model('Room');
const Game          = mongoose.model('Game');
const User          = mongoose.model('User');
const Keywords      = mongoose.model('Keywords');
const MatchedWords  = mongoose.model('MatchedWords'); 
const wn            = require("wordnetjs");

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
                                    setTimeout(function(){getRandomWordFromKeywordsSchema(data.mode, room.id, room.endedAt, room.score, "newgame")},7700);
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
            function getRandomWordFromKeywordsSchema(mode, roomId, roomEndedAt, score, previousgametype ,guess){
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

                            var gameWord = keyword.keyword.toLowerCase();
                            var client = io.sockets.connected[socket.opponent];
                            console.log(previousgametype);
                            if(previousgametype=="newgame"){
                                var firstWord= true;
                            }else{
                                var firstWord=false;
                            }
                            socket.emit('newword', newgame.keyword, newgame.relation, newgame.id, roomEndedAt, firstWord);
                            client.emit('newword', newgame.keyword, newgame.relation, newgame.id, roomEndedAt, firstWord); //tells the players that there is a new word, what the word is and its mode.
                            console.log("Create Game: " + newgame.keyword);
                            socket.emit('scoreUpdate', score);
                            client.emit('scoreUpdate', score);
                            MatchedWords.find(
                                { keyword:keyword.keyword, relation:mode, numberOfMatches:{ $gt: 3 } }).exec(function(err, matchedwords) {
                                if(matchedwords){
                                    var taboowords=[];
                                    if(matchedwords.length>0){
                                        for(var i = 0; i < matchedwords.length; i++){
                                            amatchedworddocument=matchedwords[i]
                                            taboowords.push(amatchedworddocument.matchedWord)
                                        }
                                        socket.emit('tabooWords', taboowords);
                                        client.emit('tabooWords', taboowords);
                                    }else{"there are no taboo words"}
                                }else{"there are no taboo words!"}
                            });
                            //if players matched
                            if(previousgametype=="pass"){
                                socket.emit('youPassed');
                                client.emit('opponentPassed');//tells the players theres been a match, and the word the match was on
                            }else if(previousgametype=="guess"){
                                socket.emit('match', guess);
                                client.emit('match', guess);
                            }
                        }
                    );
                });
            }

            socket.on("pass", function(data){
                var gameId=data.game;
                var roomId=data.room;
                Room.findById(roomId, function(err, room) {
                    var roommode=room.gamemode;
                    var currentScore=room.score;
                    var newScore=currentScore-100;
                    room.score=newScore
                    room.save(function (err) {
                        if (err) return console.error(err);
                    });
                    var client = io.sockets.connected[socket.opponent];
                    getRandomWordFromKeywordsSchema(roommode, roomId, room.endedAt, newScore, "pass");
                });

            });

            
            function checkWord(gameWord, mode) {
                var allSynonyms = new Set(); 
                var allHypernyms = new Set(); 
                var allAntonyms = new Set(); 
                if(mode=="A"||mode=="S"){
                    var synonyms = wn.synonyms(gameWord);
                    for(var i=0; i<synonyms.length; i++){
                        var closeSynonyms = synonyms[i].close;
                        var farSynonyms = synonyms[i].far;
                        
                        for(var j=0; j<closeSynonyms.length; j++){
                            allSynonyms.add(closeSynonyms[j]);
                        }
                        for(var j=0; j<farSynonyms.length; j++){
                            allSynonyms.add(farSynonyms[j]);
                        }
                    }
                }
                if(mode=="A"){
                    var antonyms = wn.antonyms(gameWord);
                    for(var i=0; i<antonyms.length; i++){
                        var words = antonyms[i].words;
            
                        for(var j=0; j<allSynonyms.length; j++){
                            var closeSynonym = allSynonyms[j];
                            var closeAntonyms = wn.antonyms(closeSynonym.toLowerCase());
                            for(var k=0; k<closeAntonyms.length; k++){
                                var closeWords = closeAntonyms[k].words;
                                
                                for(var l=0; l<closeWords.length; l++){
                                    allAntonyms.add(closeWords[l]);
                                }
                            }
                        }
                        for(var j=0; j<words.length; j++){
                            allAntonyms.add(words[j]);
                        }
                    }
                }
                if(mode=="H"){
                    var hypernyms=wn.lookup(gameWord);
                    for(var i=0; i<hypernyms.length; i++){
                        var category = hypernyms[i].syntactic_category;
                        if(category == "Noun"){
                            var relations = hypernyms[i].relationships.type_of;
                            for(var j=0; j<relations.length; j++){
                                var relationId = relations[j];
                                var relationWord = wn.lookup(relationId);
                                for(var k=0; k<relationWord.length; k++){
                                    var hypernymWords = relationWord[k].words;
                                    for(var l=0; l<hypernymWords.length; l++){
                                        allHypernyms.add(hypernymWords[l]);
                                    }
                                }
                            }
                        }
                    }
                    return allHypernyms;
                }
                if(mode=="S"){
                    return allSynonyms;
                }else{
                    return allAntonyms;
                } 
            }
            
            socket.on("wordGuess", function(data){
                var guess=data.guess.toLowerCase();
                var gameId=data.game;
                var roomId=data.room;
                var userId= socket.userId;
            
                Room.findById(roomId, function(err, room) {
                    var roommode=room.gamemode;
                    Game.findById(gameId, function(err, game) {
                        if(game){
                            var currentGuesses = game.guesses;
                            var isMatch = false;
                            for(var i=0; i<currentGuesses.length; i++) {
                                var guesser=currentGuesses[i].player;  
                                if(guesser != userId && currentGuesses[i].guess == guess ) {
                                    isMatch = true;
                                }
                            }
                            game.guesses.push({player: userId, guess: guess }); //add the guess to the system if it is not found
                            game.save(function (err) {
                                if (err) return console.error(err);
                            });    
                            if(isMatch) { //if there is a match in the game
                                MatchedWords.findOne({ keyword:game.keyword, matchedWord: guess, relation:game.relation }).exec(function(err, matchedwords) {
                                    var numberofthematches = 0;
                                    if(!matchedwords){
                                        var newMatchedWords = new MatchedWords({ keyword:game.keyword, matchedWord: guess, relation:game.relation, numberOfMatches:1 });
                                        newMatchedWords.save(function (err) {
                                            if (err) return console.error(err);
                                        });
                                    }else{
                                        numberofthematches = matchedwords.numberOfMatches;
                                        matchedwords.numberOfMatches=numberofthematches+1;
                                        matchedwords.save(function (err) {
                                            if (err) return console.error(err);
                                        });
                                    }
                                    if(numberofthematches < 10) {
                                        var mode=game.relation;
                                        var gameWord=game.keyword;
                                        var answers = checkWord(gameWord, mode)          
                                        if(answers.has(guess)){
                                            var currentScore=room.score;
                                            var newScore=currentScore+100;
                                            room.score=newScore;
                                            room.save(function (err) {
                                                if (err) return console.error(err);
                                            });
                                            getRandomWordFromKeywordsSchema(roommode, roomId, room.endedAt, newScore, "guess", guess);
                                        }else{
                                            console.log(guess)
                                            console.log("Wordnet says no!");
                                        }
                                    }
                                });
                            }
                        }
                    });
                });
            });

            socket.on("gameOver", function(data){
                roomId=data.room
                Room.findById(roomId, function(err, room) {
                    roomscore=room.score;
                    var userId= socket.userId;
                    User.findById(userId, function(err, user) {
                        if(user){
                            if(user.highscore<roomscore){
                                user.highscore=roomscore
                                user.save(function (err) {
                                    if (err) return console.error(err);
                                });
                            }
                        }else{console.log("Couldnt Find user!")}
                    })
                })
            })

            socket.on("leaderboardScores", function(data){
                User.find({}).sort({highscore: -1}).select('username highscore -_id').limit(10).exec( 
                    function(err, topUsers) {
                        socket.emit('hereAreTheHighscores', topUsers);
                    }
                );
            });


            socket.on('disconnect', function () {
                io.emit('user disconnected');
            });
        }
    });

    return io;
}