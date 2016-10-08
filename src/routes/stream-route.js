require('source-map-support').install();
var express = require('express');
var debug = require('debug')('ChennaiRadioNodeApp:server');
var streamHandler = require('../stream-handler.js');

var router = express.Router();
router.get('/:userId/stream', function (req, res, next) {
	req.user.refreshUserSession();
	res.writeHead(200, {
		'Content-Type': 'audio/mpeg',
		'Transfer-Encoding': 'chunked'
	});
	// Add the response to the clients array to receive streaming
	// clients.push(res);
	streamHandler.addClient(req.user._id, res);
	debug('Client connected; streaming');
});

module.exports = router;
