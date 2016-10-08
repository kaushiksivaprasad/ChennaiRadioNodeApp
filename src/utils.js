require('source-map-support').install();
var mongoose = require('mongoose');
var debug = require('debug')('ChennaiRadioNodeApp:server');

module.exports = (function () {
	class Utils {
		constructor() {
			this.mongoose = null;
		}

		createDBConnection() {
			return new Promise((resolve, reject) => {
				mongoose.connect('mongodb://chennaiRadioUser:chennaiRadioNodeUser@localhost:27017/chennaiRadioDb', {
					config: {
						autoIndex: false
					}
				});
				let connection = mongoose.connection;
				connection.on('error', reject);
				connection.once('open', function () {
					debug('Db connection open');
					resolve(connection);
				});
			});
		}

		getBaseUrl(req) {
			if (!req) {
				throw new Error('Req is a mandatory argument');
			}
			return 'http://' + req.headers.host + '/rest/';
		}

		formatScheduleResponse(schedules) {
			let response = [];
			for (let schedule of schedules) {
				schedule.programs = schedule.programs.map(item => {
					return {
						artistImgUrl: '/schedule/artistImg/' + item._id,
						programName: item.programName,
						startTimeInHour: item.startTimeInHour,
						endTimeInHour: item.endTimeInHour,
						startTimeInMinutes: item.startTimeInMinutes,
						endTimeInMinutes: item.endTimeInMinutes,
						hostedBy: item.hostedBy
					};
				});
				response.push(schedule);
			}
			return response;
		}
	}
	return new Utils();
})();
