require('source-map-support').install();
let url = require('url');
let WebSocketServer = require('ws').Server;
let debug = require('debug')('ChennaiRadioNodeApp:server');
let userSession = require('./session/usersession');
let adCache = require('./cache/ad-cache');
var Utils = require('./utils');

class WebSocket {
	constructor(httpServer) {
		this.lastMess = null;
		this.connections = {};
		this.wss = new WebSocketServer({
			server: httpServer,
			verifyClient: function (info) {
				let req = info.req;
				let splitUrl = url.parse(req.url).pathname.split('/');
				let user = userSession.getUserSession(splitUrl[1]);
				if (user && splitUrl.length === 3 && splitUrl[2] === 'ws') {
					info.req.user = user;
					return true;
				}
				return false;
			}
		});
		this.wss.on('connection', ws => {
			debug('web-socket-server.js -> 	this.connections : ' + this.connections);
			this.connections['connection_' + ws.upgradeReq.user._id] = ws;
			debug('web-socket-server.js -> connection recieved : connection_' + ws.upgradeReq.user._id);
			if (this.lastMess !== null) {
				ws.send(JSON.stringify(this.processMessage(this.lastMess, ws.upgradeReq)));
			}
			ws.on('close', (code, message) => {
				delete this.connections['connection_' + ws.upgradeReq.user._id];
				debug('web-socket-server.js -> closing connection : connection_' + ws.upgradeReq.user._id);
			});
			ws.on('error', error => {
				delete this.connections['connection_' + ws.upgradeReq.user._id];
			});
		});
		adCache.addListener(this);
		userSession.addListener(this);
		debug('web-socket-server.js -> successfully created WebSocketServer');
	}

	sendToClient(mess) {
		if (mess) {
			this.lastMess = mess;
			debug('web-socket-server.js -> sendToClients : ' + JSON.stringify(mess));
			for (let property in this.connections) {
				if (this.connections.hasOwnProperty(property)) {
					let ws = this.connections[property];
					ws.send(JSON.stringify(this.processMessage(this.lastMess, ws.upgradeReq)));
				}
			}
		}
	}

	processMessage(messages, req) {
		let processedMess = [];
		for (let message of messages) {
			let url = Utils.getBaseUrl(req) + req.user._id + '/advertisement/' + message.id;
			processedMess.push({
				bufferUrl: url,
				imgUrl: message.url
			});
		}
		return processedMess;
	}

	closeWsConnection(id) {
		let connection = this.connections['connection_' + id];
		if (connection) {
			connection.close();
			delete this.connections['connection_' + id];
			debug('web-socket-server.js -> closeWsConnection : connection_' + id);
		}
	}
}

let wss = null;

function createWebServer(httpServer) {
	if (!wss && httpServer) {
		wss = new WebSocket(httpServer);
	}
	return wss;
}
module.exports = createWebServer;
