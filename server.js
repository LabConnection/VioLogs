var Promise = require('promise');
var request = require('request');
var crypto = require('crypto');
var fs = require('fs');
/* Express stuff */
var compression = require('compression');
var express = require('express');
var helmet = require('helmet');
var session = require('express-session');
var async = require('async');
/*************************************** 
				Setup
***************************************/
var mysql = require('./libs/mysql');
// Express & Socket.io
var app = express();
var server = app.listen(7463);
// Compression, and helmet module for hsts etc
app.use(helmet());
app.use(compression());
// static properties
function unpack(str) {
    var bytes = [];
    for (var i = 0; i < str.length; i++) {
        var char = str.charCodeAt(i);
        bytes.push(char & 0xFF);
    }
    return bytes.join('');
}

function createHash(pw, salt) {
    return crypto.createHash('sha512').update(pw + salt).digest('base64');
}

function setStaticHeaders(res, path) {
    res.setHeader("Expires", new Date(Date.now() + 6048000000).toUTCString());
    res.setHeader("Cache-Control", "public, max-age=604800");
}
app.use('/img', express.static(__dirname + '/views/img', {
    setHeaders: setStaticHeaders
}));
app.use('/css', express.static(__dirname + '/views/css', {
    setHeaders: setStaticHeaders
}));
app.use('/js', express.static(__dirname + '/views/js', {
    setHeaders: setStaticHeaders
}));
app.use('/fonts', express.static(__dirname + '/views/fonts', {
    setHeaders: setStaticHeaders
}));
app.use('/libs', express.static(__dirname + '/views/libs', {
    setHeaders: setStaticHeaders
}));
var session_middleware = session({
    secret: "jkpoasdfipu42t5",
    name: "session",
    resave: true,
    saveUninitialized: false,
});
app.use(session_middleware);
// view engine and view-directory
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
// adding our passport session to the session_middleware
// Login
app.get('/logout', function(req, res) {
    console.log("Logged out", req.session.user.name);
    req.session.destroy();
    res.redirect('/');
})
app.get('/login', function(req, res) {
    let username = req.query.username;
    let password = req.query.password;
    mysql.query('SELECT * FROM accounts WHERE Name = ?;', [username]).then(function(data) {
        let logs = [];
        if (data.results.length > 0) {
            console.log("account found")
            let pepper = data.results[0].Pepper;
            let salt = data.results[0].Salt;
            let hPassword = data.results[0].Password;
            let LogLevel = data.results[0].LogLevel;
            console.log("pepper", pepper);
            console.log("salt", salt);
            var hash = createHash(createHash(password, salt), pepper);
            if (hPassword == hash) {
                console.log("auth succesful")
                if (LogLevel > 0) {
                    console.log("has log access")
                    req.session.user = {};
                    req.session.user.logs = true;
                    req.session.user.log_level = LogLevel;
                    req.session.user.name = username;
                    req.session.save()
                    res.redirect('/');
                } else {
                    res.redirect('/');
                }
            } else {
                res.redirect('/');
            }
        } else {
            console.log("account not found")
            res.redirect('/');
        }
    });
});

// route delivering
app.get('/', function(req, res) {
    if ((req.session.user) && (req.session.user.logs == true)) {
    	let log_level_access = req.session.user.log_level
        mysql.query('SELECT DISTINCT Logger FROM system_logs ORDER BY Logger;').then(function(data) {
            let logger = [];
            if (data.results.length > 0) {
                logger = data.results.map(function(e) {
                    return e.Logger;
                })
                mysql.query('SELECT * FROM system_logs_access ORDER BY Logger;').then(function(data_access) {
                	if (data_access.results.length > 0) {
                		let log_access = data_access.results.map(function(e) {
                			return {Logger:e.Logger,Level:e.Level}
                		}).filter(function(e) {
                            return log_level_access >= e.Level;
                        })
                		logger = logger.filter(function(Logger) {
                			return log_access.findIndex(w => w.Logger == Logger) > -1;
                		})
		                res.render('index', {
		                    viewableLogs: logger
		                });
		            }
            	})
            }
        });
    } else {
        res.render('login');
    }
});
app.get('/logs/:log', function(req, res) {
    if ((req.session.user) && (req.session.user.logs == true)) {
        let log = req.params.log;
        mysql.query('SELECT * FROM system_logs WHERE Logger = ? ORDER BY Timestamp DESC;', [log]).then(function(data) {
            let logs = [];
            if (data.results.length > 0) {
                logs = data.results.map(function(e) {
                    return {
                        string: e.Log,
                        timestamp: e.Timestamp
                    }
                })
                res.render('logs', {
                    type: log,
                    logs: logs
                });
            }
        });
    } else {
        res.redirect('/');
    }
});
app.get('*', function(req, res) {
    console.log(req.session);
    console.log(req.params);
    res.redirect('/');
});
app.post('*', function(req, res) {
    res.redirect('/');
});