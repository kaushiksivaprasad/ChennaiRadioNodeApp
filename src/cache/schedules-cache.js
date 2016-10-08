require('source-map-support').install();
let debug = require('debug')('ChennaiRadioNodeApp:server');
let Config = require('../config');
// Constants
class ScheduleCache {
	constructor() {
		this.schedules = [];
		this.listeners = [];
	}

	setSchedules(schedules) {
		this.schedules = schedules;
		this.triggerListeners();
	}

	triggerListeners() {
		// debug('schedules-cache.js -> triggerListeners : length' + this.listeners.length)
		// if (this.listeners.length > 0) {
		// 	for (let listener of this.listeners) {
		// 		listener.sendToClient(this.getBodyForListeners());
		// 	}
		// }
	}

	getBodyForListeners() {
		let mess = [];
		let body = {
			type: Config.SCHEDULE_EVENT,
			mess: this.schedules
		}
		return body;
	}

	getImgBufferForId(id) {
		for (let schedule of this.schedules) {
			if (schedule._id === id) {
				return schedule.artistImg;
			}
		}
	}

	addListener(listener) {
		this.listeners.push(listener);
	}
}
let cache = null;
if (!cache) {
	cache = new ScheduleCache();
}
module.exports = cache;
