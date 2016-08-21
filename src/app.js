require('source-map-support').install();
var path = require('path');
var http = require('http');
var debug = require('debug')('ChennaiRadioNodeApp:server');
var express = require('express');
var logger = require('morgan');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var Utils = require('./utils.js');
var wss = require('./web-socket-server');
var userSession = require('./session/usersession')

var app = express();
var server = http.createServer();
var port = 8080;

// DB Models
var User = null;
var Advertisement = null;

app.use(logger('dev'));
app.use(passport.initialize());
app.use('/:userId/public', express.static(path.join(__dirname, '..', '..', 'public')));

if (app.get('env') === 'development') {
	app.use(function (err, req, res, next) {
		res.status(err.status || 500);
		res.json({
			message: err.message,
			error: err
		});
	});
}

// production error handler
// no stacktraces leaked to user
app.use(function (err, req, res, next) {
	res.status(err.status || 500);
	res.json({
		message: err.message
	});
});
// Initiate DB
let dbPromise = Utils.createDBConnection();
dbPromise.then(connection => {
	// Initiate Models
	User = require('./models/user.js')(connection);
	Advertisement = require('./models/advertisement.js')(connection);

	// Initiate web-socket-server
	wss(server);
	//	define routes
	var registrationRoute = require('./routes/registration.js');
	var adRoute = require('./routes/advertisement-route.js');
	var rjRoute = require('./routes/rj.js');

	// Declare routes
	app.param('userId', function (req, res, next, id) {
		let user = userSession.getUserSession(id);
		debug('app.js -> User Retrived for id =' + id + ' is : ' + user);
		if (user === null || typeof user === 'undefined') {
			let error = new Error('Invalid id or the user has timed out');
			error.status = 404;
			next(error);
		} else {
			req.user = user;
			next();
		}
	});

	app.all('/:userId/*', function (req, res, next) {
		next();
	});

	app.use('/', registrationRoute);
	app.use('/', rjRoute);
	app.use('/', adRoute);

	passport.use('local', new LocalStrategy({
		usernameField: 'email',
		passwordField: 'password'
	}, function (email, password, done) {
		User.findOne({
			emailId: email
		}, function (err, user) {
			if (err) {
				return done(err);
			}
			if (!user) {
				return done(null, false, {
					message: 'Incorrect username.'
				});
			}
			user.validatePassword(password, (err, res) => {
				if (err) {
					return done(err);
				}
				if (res) {
					return done(null, user);
				}
				return done(null, false, {
					message: 'Incorrect password.'
				});
			});
		});
	}));
	debug('app.js -> Loaded...');
}).catch(err => {
	debug('app.js -> Some error occured in creating DB' + err);
});

app.set('port', port);
server.on('request', app);
server.listen(port);

module.exports = app;
