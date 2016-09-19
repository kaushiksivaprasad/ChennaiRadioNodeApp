require('source-map-support').install();
var express = require('express');
var debug = require('debug')('ChennaiRadioNodeApp:server');
var passport = require('passport');
var bodyParser = require('body-parser');
var User = require('../models/user.js')();
var Utils = require('../utils.js');
var userSession = require('../session/usersession.js');
var Config = require('../config');

// Config
let timeout = Config.TIMEOUT;

var router = express.Router();
router.get('/login', function (req, res, next) {
	passport.authenticate('local', function (err, user, info) {
		if (err) {
			return next(err);
		}
		if (!user) {
			return res.status(401).json(info);
		}
		let id = userSession.setUserSession(user);
		res.status(200).json({
			url: Utils.getBaseUrl(req) + id + '/refresh'
		});
		return user.cleanUserSessionOnTimeOut();
	})(req, res, next);
});

router.get('/:userId/refresh', function (req, res, next) {
	req.user.refreshUserSession();
	res.status(200).end();
});

router.post('/signup', bodyParser.json(), function (req, res, next) {
	let user = new User(req.body);
	user.save((err, user) => {
		if (err) {
			console.log('error occured in user creation');
			next(err);
		} else {
			return res.status(201).json({
				message: 'User created'
			});
		}
	});
});

module.exports = router;
