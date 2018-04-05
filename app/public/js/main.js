var distance=61;
var currentGameScore=0;
var highScore=0;
var distancecountdown;
var x

function countdown(t) {
    $('#container').html('<h1 id="countdown" class="text-center" style="font-size:500%; margin-top:40%"></h1>');
    var t=Date.parse(t);
    t= new Date(t);
    k= new Date(t);
    t=t.getSeconds();
    littletimer=7
    var x = setInterval(function() {
        // Get date and time
        var now = new Date();
        var now = now.getSeconds();
        var distancecountdown = t - now;
        console.log(distancecountdown);
        littletimer=littletimer-1
        document.getElementById("countdown").innerHTML = littletimer + "s ";
        // If the count down is finished, say go! 
        if ((new Date())>=k){
            clearInterval(x);
            distance=61;
            document.getElementById("countdown").innerHTML = 'GO!';
            console.log("startGame");
        }
    }, 1000);
}
function loadleaderboard(){
    socket.emit("leaderboardScores");
}


function loadHomePage(){
    $.ajax({
        url: '/highscore',
        type: 'GET',
        success: function(data){
            highScore=data.highscore;
            console.log(highScore);
            $("#container").html('<div style="margin-top:2%;" class="row"> <div style=" text-align:left; padding-left:2%, margin-top:5%;" class="col-xs-6"> <button type="submit" onclick="logout()" class="btn btn-lg btn-default">Log Out</button> </div> <div style=" text-align:right; padding-right:2%" class="col-xs-6"> <h3 style="text-align:right; display:inline" id="highscore">High Score: 0</h3> </div> </div> <div style="margin-top:15%;" class="row"> <div style=" text-align:left; padding-left:20%" class="col-xs-6"> <button type="submit" style="padding: 4% 20% 4%; font-size:200%" onclick="findGame()" class="btn btn-lg btn-default">P VS P </button> <!--this button will first check if there is a table row in room, in the same game mode as the one selected that hasnt started or ended, if there isnt it will add a new one and take the user to th searching page, --> <!--if there is a available game it will go to the countdown page and will beguin the countdown for the game to start.--> <h2><span style="padding-left:14%; padding-right:14%" class="glyphicon glyphicon-user"></span> <p style="display:inline"> </p><span style="padding-left:5%" class="glyphicon glyphicon-user"></span> </h2> </div> <div style="text-align:right; padding-right:20%" class="col-xs-6"> <button type="submit" style="padding: 4% 20% 4%; font-size:200%" onclick="findComputerGame()" class="btn btn-lg btn-default">P VS C</button> <!--Once this button is clicked the countdown will begin--> <h2> <span style="padding-left:10%; padding-right:14%" class="glyphicon glyphicon-user"></span> <p style="display:inline"> </p><span style="padding-left:5%; padding-right:2%;" class="glyphicon glyphicon-open"></span> </h2> </div> </div> <div style="text-align:center; margin-top:7%;" class="row"> <select style="font-size:200%;" id="modeChooser" class="selectpicker"> <option>Classic</option> <option>Same Meanings</option> <option>Gerneric Terms</option> <option>Opposites</option> </select> </div> <div style="text-align:center; margin-top:1%;" class="row"> <button type="submit" style="padding:3% 6% 3% 6%; font-size:150%" onclick="loadleaderboard()" class="btn btn-lg btn-default">View High scores</button> </div> <div style="text-align:right; margin-top:7%; margin-right:3%;" class="row"> <button type="submit" style="padding:2% 4% 2%; font-size:150%" onclick="loadPage(&quot;rules&quot;)" class="btn btn-lg btn-default">?</button> </div>');
            var score = document.getElementById("highscore").innerHTML = ("High Score: " + (highScore));
        }
    });
    socket.emit('clearGames');
    clearInterval(x);
}

function highScoreTable(top10scores){
    $('#container').html(' <table id="highScoreTable" class="table table-bordered table-hover table-responsive" style="margin-top:10%"><thead><tr bgcolor="#ffa834"><th>Position</th><th>Username</th><th>Score</th></tr></thead></table> <div style="text-align:center; " class="row"><button type="submit" style="margin-top:6%; padding:4%; " onclick="loadHomePage()" class="btn btn-lg btn-default"> Back </button></div>')
    for(var i = 0; i < top10scores.length; i++){
        var table = document.getElementById("highScoreTable");
        var row = table.insertRow(i+1);
        var position = row.insertCell(0);
        var username = row.insertCell(1);
        var tableplayerscore=row.insertCell(2);
        // Add some text to the new cells:
        position.innerHTML = i+1;
        username.innerHTML = top10scores[i].username;
        tableplayerscore.innerHTML=top10scores[i].highscore;
    }
}

function playerNotification(title, matchBody){
    document.getElementById("informationBarText").innerHTML = matchBody;
    $("#informationBar").fadeIn(500);
    setTimeout(function(){  
        $("#informationBar").fadeOut(500); 
    }, 1200);
}

function newgame(keyword, mode, roomEndedAt, firstWord){
    $('#container').html('<div class="row" style="margin-top:4%;"><div class="col-xs-6" style=" text-align:left; padding-left:2%;"><h3 id="countdown">Time left:</h3></div><div class="col-xs-6" style=" text-align:right; padding-right:2%;"><h3 id="score">Score: </h3></div></div><div class="row"><div class="col-xs-4"><div class="container" style="background: #ffa834; border: 2px solid #000000; height:50%; margin-top:40%; width:100%;"><h4 style="width:110%;">Taboo Words:</h4><ul id="tabooList" style="list-style: none"></ul></div></div><div class="col-xs-4"><h3 style="width:120%;" id="mode" name="mode">Another word that means...</h3><h1 style="font-size:350%; margin-top:40%;" id="keyword" name="keyword"></h1></div><div class="col-xs-4"><div class="container" style="background: #ffa834; border: 2px solid #000000; height:50%; margin-top:40%; width:100%;"><h4>Your Words:</h4><ul id="guessList" style="list-style: none"></ul></div></div></div><div class="row"><div class="col-xs-10" style=" text-align:left; padding-left:2%;"><form id="form" onsubmit="addToGuessList(); sendWord(guess.value); return false;"><input class="form-control input-md" id="guess" name="guess" type="text" placeholder="Guesses" required="" style="font-size:180%; text-align:center; width:98%; margin-left:1%; margin-top:3%;"></form></div><div class="col-xs-2" style=" text-align:left; padding-left:.5%;"><button class="btn btn-danger" type="button" style="font-size:140%; display:inline; margin-top:10%;" onclick="pass();">Pass</button></div></div><div style="text-align:center; " class="row"><button type="submit" style="padding:4%; " onclick="playerhasquit(); loadHomePage()" class="btn btn-lg btn-default"> Quit </button></div><div id="informationBar" style="position:absolute; opacity: 0.8;background-color: orange; opacity:0.8; background-color:#ccc; padding:25%; position:fixed; width:100%; height:100%; top:0px; left:0px; z-index:1000; text-align:center; display:none;"><h1 style="font-size:130%; background-color:#ffa834" id="informationBarText">test</h1></div>');//<div class="row" id="informationBar" style="position:absolute; opacity: 0.8;background-color: <h1 id="informationBarText" style="width:100%">Some text some message..</h1></div>
    if(mode=="H"){
        var modetext="More Generic Term for ..."
    }else if(mode=="S"){
        var modetext="Another Word That Means..."
    }else if(mode=="A"){
        var modetext="Opposite of ..."
    }else{
        var modetext="unrecorgniced mode type: "+mode;
    }
    var keywordword = document.getElementById("keyword").innerHTML = keyword;
    var modeword = document.getElementById("mode").innerHTML = modetext;
    var guesses = document.getElementById("guessList").innerHTML = "";
    if(firstWord){
        currentGameScore=0;
        distance=61;
        var endGametime = Date.parse(roomEndedAt);
        endGametime= new Date(endGametime);
        x = setInterval(function() {
            distance=distance-1;
            var countdown= document.getElementById("countdown");
            countdown.innerHTML = "time left: " +(distance) + "s "; 
            if ((new Date())>=endGametime){
                clearInterval(x)
                socket.emit('gameOver', { room: roomId });
                $('#container').html("<div class='row', style='margin-top:2%;'><div class='col-xs-12', style=' text-align:right; padding-right:2%'><h3 style='text-align:right' id='highScoretext'> High Score: 0</h3></div></div><div class='row', style='margin-top:10%; text-align:center;'><h1 style='font-size:350%' id='gameScore'> You Scored: 0</h1></div><div class='row', style='margin-top:3%; text-align:center;'><button class='btn btn-lg btn-default', type='submit', style='padding: 4% 10% 4%; font-size:200%' onclick='loadHomePage()'> Home</button></div><div class='row', style='margin-top:3%; text-align:center;'> <button class='btn btn-lg btn-default', type='submit', style='padding:2% 6% 2%; font-size:150%', onclick='loadPage('leaderboard')'> View High scores </button></div>");
                document.getElementById("gameScore").innerHTML = ("You Scored: " + currentGameScore);
                document.getElementById("highScoretext").innerHTML = ("High Score: " + highScore);
                distance=61;
            }
        },1000);
    }
}

function addToGuessList(){
       var node = document.createElement("LI");
       var textnode = document.createTextNode(guess.value);
       node.appendChild(textnode);
       document.getElementById("guessList").appendChild(node);
}

function updateScore(score){
    var score = document.getElementById("score").innerHTML = ("Score: " + (score));
}

function loadPage(page) {
    $.ajax({
        url: page,
        success: function(data){
            $("#container").html(data);

        }
    })
}

function updateTabooWords(matchedwords){
    var arrayLength = matchedwords.length;
    for (var i = 0; i < arrayLength; i++) {
        var node = document.createElement("LI");
        var textnode = document.createTextNode(matchedwords[i]);
        node.appendChild(textnode);
        document.getElementById("tabooList").appendChild(node);
    }
}

function playerhasquit(){
    distancecountdown=1
    clearInterval(x)
    distance=61;
    socket.emit("playerHasQuit", {roomID:roomId})
}

function logout(){
    window.location.href = "/logout";
}

function submitForm(uri){
    var url = '/'+uri;
    $.ajax({
        url: url,
        type: $('#form').attr('method'),
        data: $('#form').serialize(),
        success: function(data){
            if(uri=='login'){
                createSocket();
                loadHomePage();
            }else{
                createSocket();
                $("#container").html(data);
            }
        }
    });
    return false;
}

var socket = null;
var roomId=0;
var gameId=0;
var endGametime=0
var t=0
var answers=0

function createSocket() {

    socket = io(); 

    socket.on('connect', function () {
        console.log("Connected");
        console.log(socket);
    });

    socket.on('created', function () {
        console.log("Created");
        loadPage('searching');//once they have created a game, take them to the searching game
    });

    socket.on('hereAreTheHighscores',function(topUsers){
        highScoreTable(topUsers);
        console.log(topUsers)
    });

    socket.on('hereIsUsersTheHighscores', function(user){
        updateHighscore(user)
    })

    socket.on('scoreUpdate', function(newScore) {
        updateScore(newScore);
        console.log("Score updated to : "+ newScore);
        currentGameScore=newScore;
        if(newScore>highScore){
            highScore=newScore
        }
    });

    socket.on('tabooWords', function(taboowords) {
        updateTabooWords(taboowords);
    });

    socket.on('opponentQuit', function(){
        loadHomePage();
        alert("Your Opponent Quit!");
    })

    socket.on('joined', function (t, room) {
        countdown(t);//once they have joined, go to the countdown page.
        console.log("Joined: " + t);
        roomId=room;
    });

    socket.on('newword', function(keyword, mode, game, roomEndedAt, firstWord){
        console.log("New Word: " + keyword);
        gameId=game;
        console.log(firstWord)
        newgame(keyword, mode, roomEndedAt, firstWord);
        answers=answers;
    });

    socket.on('match', function(guess){
        body="You matched on " + guess;
        playerNotification("Matched Word!", body);
    });

    socket.on('youPassed', function(guess){
        playerNotification("You Passes", "You Passed");
    });

    socket.on('ComputerPassed', function(guess){
        playerNotification("Computer Passed!", "Computer Passed!");
    });


    socket.on('opponentPassed', function(guess){
        playerNotification("Your Opponent Passed!", "Your Opponent Passed");
    });
}

function findComputerGame(){
    var chosenmode= document.getElementById("modeChooser").value;
    if(chosenmode==="Same Meanings"){
        chosenmode='S';
    }else if(chosenmode==="Gerneric Terms"){
        chosenmode='H';    
    }else if(chosenmode==="Opposites"){
        chosenmode='A';
    } else{
        chosenmode='R';
    }
    socket.emit("computerGame", { mode: chosenmode });
} 

function findGame(){
    console.log("Find Game");
    var chosenmode= document.getElementById("modeChooser").value;
    if(chosenmode==="Same Meanings"){
        chosenmode='S';
    }else if(chosenmode==="Gerneric Terms"){
        chosenmode='H';    
    }else if(chosenmode==="Opposites"){
        chosenmode='A';
    } else{
        chosenmode='R';
    }
    socket.emit('findGame', { mode: chosenmode });
}

function sendWord(guess){
    console.log("Guess");
    socket.emit('wordGuess', { guess: guess, game: gameId, room: roomId });
    document.getElementById('guess').value = '';
};

function pass(){
    console.log("pass");
    socket.emit('pass',{ game: gameId, room: roomId } );
};