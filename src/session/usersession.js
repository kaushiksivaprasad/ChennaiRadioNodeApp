require('source-map-support').install();
var debug = require('debug')('ChennaiRadioNodeApp:server');
let Config = require('../config');
// Config
let timeout = Config.TIMEOUT;

class UserSession {
	constructor() {
		this.listeners = [];
	}
	getUserSession(id) {
		return this['session_' + id];
	}

	setUserSession(user) {
		let userFromSession = this.getUserSession(user._id);
		if (userFromSession) {
			user = userFromSession;
			user.refreshUserSession();
		} else {
			user.cleanUserSessionOnTimeOut = () => {
				if (user.timeout) {
					clearTimeout(user.timeout);
				}
				user.timeout = setTimeout(() => {
					this.removeUserSession(user._id);
					clearTimeout(user.timeout);
				}, timeout);
			};
			user.refreshUserSession = () => {
				user.cleanUserSessionOnTimeOut();
			};
			this['session_' + user._id] = user;
		}
		return user._id;
	}

	removeUserSession(id) {
		debug('usersession.js -> Removing User %s from user session', id);
		delete this['session_' + id];
		this.triggerListeners(id);
	}

	triggerListeners(id) {
		if (this.listeners.length > 0) {
			for (let listener of this.listeners) {
				listener.closeWsConnection(id);
			}
		}
	}

	addListener(listener) {
		this.listeners.push(listener);
	}
}
let userSession = null;
if (!userSession) {
	userSession = new UserSession();
}
module.exports = userSession;
