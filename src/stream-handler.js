require('source-map-support').install();
var icy = require('icy');
var debug = require('debug')('ChennaiRadioNodeApp:server');
let userSession = require('./session/usersession.js');

class StreamHandler {
	constructor() {
		this.clients = {};
		// URL to a known ICY stream
		var url = 'http://firewall.pulsradio.com';
		// connect to the remote stream
		icy.get(url, res => {
			// res.on('metadata', function (metadata) {
			// 	var parsed = icy.parse(metadata);
			// 	console.error(parsed);
			// });
			res.on('data', data => {
				for (let property in this.clients) {
					if (this.clients.hasOwnProperty(property)) {
						let clientResponse = this.clients[property];
						try {
							clientResponse.write(data);
						} catch (err) {
							debug('stream-handler.js -> some error occured : ' + err);
						}
					}
				}
			});
		});
		userSession.addListener(this);
		debug('stream-handler.js  -> loaded');
	}

	addClient(userId, res) {
		this.clients[userId] = res;
		debug('stream-handler.js  -> userId added to client list');
	}

	onUserRemoved(userId) {
		let client = this.clients[userId];
		if (client) {
			delete this.clients[userId];
			debug('stream-handler.js -> onUserRemoved : userId removed : ' + userId);
		}
	}
}

let streamHandler = new StreamHandler();

module.exports = streamHandler;
