require('source-map-support').install();
let url = require('url');
let WebSocketServer = require('ws').Server;
let debug = require('debug')('ChennaiRadioNodeApp:server');
let userSession = require('./session/usersession');
let adCache = require('./cache/ad-cache');
// let scheduleCache = require('./cache/schedules-cache');
let Config = require('./config.js');
var Utils = require('./utils');

class WebSocket {
	constructor(httpServer) {
		this.lastMess = {
			adMessage: null,
			scheduleMessage: null
		};
		this.connections = {};
		this.wss = new WebSocketServer({
			server: httpServer,
			verifyClient: function (info) {
				let req = info.req;
				let splitUrl = url.parse(req.url).pathname.split('/');
				let user = userSession.getUserSession(splitUrl[2]);
				if (user && splitUrl.length === 4 && splitUrl[3] === 'ws' && splitUrl[1] === 'rest') {
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
			this.processAndSendToClient(ws);
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
		// scheduleCache.addListener(this);
		debug('web-socket-server.js -> successfully created WebSocketServer');
	}

	sendToClient(mess) {
		if (mess) {
			this.populateLastMess(mess);
			debug('web-socket-server.js -> sendToClients : ' + JSON.stringify(this.lastMess));
			for (let property in this.connections) {
				if (this.connections.hasOwnProperty(property)) {
					let ws = this.connections[property];
					this.processAndSendToClient(ws);
					// ws.send(JSON.stringify(this.processMessage(mess, ws.upgradeReq)));
				}
			}
		}
	}

	processAndSendToClient(ws) {
		for (let mess in this.lastMess) {
			if (this.lastMess.hasOwnProperty(mess)) {
				debug('web-socket-server.js -> processAndSendToClient : lastMess : ' + JSON.stringify(this.lastMess[mess]));
				let messToBeSent = Object.create(this.lastMess[mess]);
				if (this.lastMess[mess]) {
					if (messToBeSent.type === Config.ADS_EVENT) {
						messToBeSent.type = messToBeSent.type;
						messToBeSent.mess = this.processAdMessage(messToBeSent.mess, ws.upgradeReq);
						debug('web-socket-server.js -> messToBeSent : ' + JSON.stringify(messToBeSent));
					} else {
						messToBeSent.type = messToBeSent.type;
						messToBeSent.mess = messToBeSent.mess;
					}
					ws.send(JSON.stringify(messToBeSent));
				}
			}
		}
	}

	populateLastMess(mess) {
		if (mess) {
			debug('web-socket-server.js ->  populateLastMess : ' + JSON.stringify(mess));
			if (mess.type === Config.ADS_EVENT) {
				this.lastMess.adMessage = mess;
			} else if (mess.type === Config.SCHEDULE_EVENT) {
				this.lastMess.scheduleMessage = mess;
			}
		}
	}

	processAdMessage(messages, req) {
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

	onUserRemoved(id) {
		let connection = this.connections['connection_' + id];
		if (connection) {
			connection.close();
			delete this.connections['connection_' + id];
			debug('web-socket-server.js -> onUserRemoved : connection_' + id);
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
