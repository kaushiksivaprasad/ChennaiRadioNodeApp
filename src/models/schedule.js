require('source-map-support').install();
let mongoose = require('mongoose');
var debug = require('debug')('ChennaiRadioNodeApp:server');
let moment = require('moment');

let scheduleSchema = mongoose.Schema({
	text: {
		type: String,
		minlength: 1
	},
	hostedBy: {
		type: String,
		minlength: 1
	},
	//  based on GMT
	validTill: {
		type: Date,
		required: true
	},
	//  based on GMT
	validFrom: {
		type: Date,
		required: true
	}
});
scheduleSchema.index({
	validTill: 1,
	validFrom: 1
}, {
	unique: true
});

scheduleSchema.statics.getSchedulesStartingFromCurrentTime = function (cb) {
	debug('schedule.js -> getSchedulesStartingFromCurrentTime : ');
	if (!cb) {
		throw new Error('Callback is mandatory');
	}
	let currentUTCTime = moment.utc();
	let tomsUTCTime = moment().utc().add(1, 'days');

	this.find({
		validFrom: {
			$lte: tomsUTCTime.toDate()
		},
		validTill: {
			$gte: currentUTCTime.toDate()
		}
	}, (err, docs) => {
		if (err) {
			return cb(err);
		}
		let schedules = [];
		for (let doc of docs) {
			let schedule = doc.toObject({
				versionKey: false
			});
			delete schedule._id;
			schedules.push(schedule);
		}
		return cb(null, schedules);
	});
};

let Schedule = null;

function createScheduleModelIfNotExist(connection) {
	if (!Schedule && connection) {
		Schedule = connection.model('schedule', scheduleSchema);
		Schedule.ensureIndexes();
	}
}
module.exports = function (connection) {
	createScheduleModelIfNotExist(connection);
	if (!Schedule) {
		throw new Error('Schedule Model not created');
	}
	debug('schedule.js -> schedule obj : ' + Schedule);
	return Schedule;
};
