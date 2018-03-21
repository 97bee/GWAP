var distance=61;

function countdown(t) {
    $('#container').html('<h1 id="countdown" class="text-center" style="font-size:500%; margin-top:40%"></h1>');
    var t=Date.parse(t);
    t= new Date(t);
    t=t.getSeconds();
    var x = setInterval(function() {
        // Get date and time
        var now = new Date();
        var now = now.getSeconds();
        var distance = t - now;
        // Display the result in the element with id="countdown"
        console.log(distance);
        document.getElementById("countdown").innerHTML = distance + "s ";
        // If the count down is finished, say go! 
        if (distance < 1){
            clearInterval(x);
            document.getElementById("countdown").innerHTML = 'GO!';
            console.log("startGame");
        }
    }, 1000);
}

function newgame(keyword, mode, roomEndedAt){
    $('#container').html('<div class="row" style="margin-top:4%;"><div class="col-xs-6" style=" text-align:left; padding-left:2%;"><h3 id="countdown">Time left:</h3></div><div class="col-xs-6" style=" text-align:right; padding-right:2%;"><h3>Score: </h3></div></div><div class="row"><div class="col-xs-4"><div class="container" style="background: #ffa834; border: 2px solid #000000; height:50%; margin-top:40%; width:100%;"><h4 style="width:110%;">Taboo Words:</h4></div></div><div class="col-xs-4"><h3 style="width:120%;" id="mode" name="mode">Another word that means...</h3><h1 style="font-size:500%; margin-top:40%;" id="keyword" name="keyword"></h1></div><div class="col-xs-4"><div class="container" style="background: #ffa834; border: 2px solid #000000; height:50%; margin-top:40%; width:100%;"><h4>Your Words:</h4><ul id="guessList" style="list-style: none"></ul></div></div></div><div class="row"><div class="col-xs-10" style=" text-align:left; padding-left:2%;"><form id="form" onsubmit="addToGuessList(); sendWord(guess.value); return false;"><input class="form-control input-md" id="guess" name="guess" type="text" placeholder="Guesses" required="" style="font-size:180%; text-align:center; width:98%; margin-left:1%; margin-top:3%;"></form></div><div class="col-xs-2" style=" text-align:left; padding-left:.5%;"><button class="btn btn-danger" type="button" style="font-size:140%; display:inline; margin-top:10%;">Pass</button></div></div><div class="row"><div class="progress-bar progress-bar-success" role="progressbar" aria-valuenow="1" aria-valuemin="0" aria-valuemax="100" style="width:90%; height:5%; margin-top:3%; text-align:center; margin-left:5%;"></div></div>');
    if(mode=="H"){
        var modetext="More Generic Term for ..."
    }else if(mode=="S"){
        var modetext="Another Word That Means..."
    }else if(mode=="A"){
        var modetext="Opposite of ..."
    }else{
        var modetext="unrecorgniced mode type: "+mode;
    }
    
    var endGametime = Date.parse(roomEndedAt);
    endGametime= new Date(endGametime);
    var x = setInterval(function() {
        distance=distance-1;
        document.getElementById("countdown").innerHTML = "time left: " +(distance) + "s ";
        console.log(endGametime);
        console.log(new Date());
        if ((new Date())>=endGametime){
            clearInterval(x)
            loadPage("endGame");
        }
    },1000);

    var keywordword = document.getElementById("keyword").innerHTML = keyword;
    var modeword = document.getElementById("mode").innerHTML = modetext;
    var guesses = document.getElementById("guessList").innerHTML = "";
    console.log("mode: "+mode);
}

function addToGuessList(){
       var node = document.createElement("LI");
       var textnode = document.createTextNode(guess.value);
       node.appendChild(textnode);
       document.getElementById("guessList").appendChild(node);
}

function loadPage(page) {
    $.ajax({
        url: page,
        success: function(data){
            $("#container").html(data);
        }
    })
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
            $("#container").html(data);
        }
    });
    return false;
}

var socket = io(); 
var roomId=0;
var gameId=0;
var endGametime=0
var t=0

socket.on('connect', function () {
    console.log("Connected");
});

socket.on('created', function () {
    console.log("Created");
    loadPage('searching')//once they have created a game, take them to the searching game
});

socket.on('joined', function (t, room) {
    countdown(t);//once they have joined, go to the countdown page.
    console.log("Joined: " + t);
    roomId=room;
});

socket.on('newword', function(keyword, mode, game, roomEndedAt){
    console.log("New Word: " + keyword);
    gameId=game;
    newgame(keyword, mode, roomEndedAt);
});

socket.on('match', function(guess){
    window.alert("matched word!" + guess);
});

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
};