'use strict';

const express       = require('express');
const app           = express();
const port          = process.env.PORT || 3000;

const http          = require('http');
const session       = require('express-session');
const mongoose      = require('mongoose');
const MongoStore    = require('connect-mongo')(session);
const sessionStore  = new MongoStore({ mongooseConnection: mongoose.connections[0] });
const bodyparser    = require('body-parser');
const passport      = require('passport');
const flash         = require('connect-flash');

const database      = require('./config/database')

// Database
//mongoose.connect('mongodb://c1528155:mYh3Rp6QUzzmP3H@csmongo.cs.cf.ac.uk:27017/c1528155');
//mongoose.connect(database.url);
mongoose.connect('mongodb://admin:wowow1234@ds153948.mlab.com:53948/heroku_5lmnn29z');
require('./app/models');

require('./config/passport')(passport);

// Socket
const server    = http.createServer(app);
const io        = require('socket.io')(server);

// Configuration
app.use('/static', express.static('app/public'))
app.set('view engine', 'pug');
app.set('views', './app/views')
app.use(bodyparser.json());
app.use(bodyparser.urlencoded({ extended: true }));
app.use(session({key: 'sid', secret: 'topsecret',resave: true, saveUninitialized: true, store: sessionStore })); //basicially 'topsecret' is the servers private key for sessions
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

// Routing
app.use('/', require('./app/routes')(passport));

app.use(function(req, res, next){
    console.log(res);
    res.status(404).json({ error: true });
});

app.use(function(err, req, res, next){
    console.log(err.message);
    res.status(err.status || 500).json({ error: true });
});

io.set('authorization', function (data, accept) {
    if (!data.headers.cookie) 
        return accept('No cookie transmitted.', false);

    data.cookie = require('cookie').parse(data.headers.cookie);
    var cookie = data.cookie['sid'];
    cookie = cookie.substring(2, cookie.indexOf("."));
    data.sessionId = cookie;

    sessionStore.get(data.sessionId, function (err, session) {
        if (err || !session) return accept('Error', false);

        data.session = session;
        return accept(null, true);
    });
});

require("./app/sockets")(io);



// Run Application
server.listen(port, function() {
    console.log(`listening on ${port}`)
})