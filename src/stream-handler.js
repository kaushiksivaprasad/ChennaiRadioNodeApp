require('source-map-support').install();
var icy = require('icy');
var debug = require('debug')('ChennaiRadioNodeApp:server');
let userSession = require('./session/usersession.js');
let Config = require('./config');

class StreamHandler {
	constructor() {
		this.lastSentData = null;
		this.clients = {};
		// URL to a known ICY stream
		// var url = 'http://firewall.pulsradio.com';
		// var url = 'http://38.96.148.18:6150';
		var url = Config.STREAM_URL;
		// connect to the remote stream
		var getStreamData = () => {
			icy.get(url, res => {
				// res.on('metadata', function (metadata) {
				// 	var parsed = icy.parse(metadata);
				// 	console.error(parsed);
				// });
				res.on('data', data => {
					this.lastSentData = data;
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

				res.on('end', data => {
					debug('stream-handler.js -> end -> stream ended hence restarting: ');
					return (() => {
						let timer = setTimeout(() => {
							clearTimeout(timer);
							debug('stream-handler.js  -> in timer');
							getStreamData();
						}, 5000);
					})();
				});
			});
		}
		getStreamData();
		userSession.addListener(this);
		debug('stream-handler.js  -> loaded');
	}

	addClient(userId, res) {
		this.clients[userId] = res;
		if (this.lastSentData) {
			try {
				res.write(this.lastSentData);
			} catch (err) {
				debug('stream-handler.js -> some error occured : ' + err);
			}
		}
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
