require('source-map-support').install();
let mongoose = require('mongoose');
var debug = require('debug')('ChennaiRadioNodeApp:server');
var moment = require('moment');

var programSchema = new mongoose.Schema({
	programId: {
		type: mongoose.Schema.Types.ObjectId,
		default: () => {
			return new mongoose.Types.ObjectId();
		},
		required: true
	},
	artistImg: {
		type: Buffer
	},
	programName: {
		type: String,
		minlength: 1,
		required: true
	}, // based on gmt
	startTimeInHour: {
		type: Number,
		min: 0,
		max: 23,
		required: true
	},
	// based on gmt
	endTimeInHour: {
		type: Number,
		min: 0,
		max: 23,
		required: true
	},
	startTimeInMinutes: {
		type: Number,
		min: 0,
		max: 59,
		required: true
	},
	endTimeInMinutes: {
		type: Number,
		min: 0,
		max: 59,
		required: true
	},
	hostedBy: {
		type: String,
		minlength: 1
	}
});

let scheduleSchema = mongoose.Schema({
	programs: [programSchema],
	dayPlayed: {
		type: Number,
		enum: [0, 1, 2, 3, 4, 5, 6]
	}
});
scheduleSchema.index({
	dayPlayed: 1
}, {
	unique: true
});

scheduleSchema.statics.getSchedulesForTheNext24Hours = function (cb) {
	debug('schedule.js -> getSchedulesForTheNext24Hours : ');
	if (!cb) {
		throw new Error('Callback is mandatory');
	}
	let currentTime = moment.utc();
	let tomTime = moment.utc().add(1, 'd');
	let currentDay = currentTime.format('d');
	let tomDay = currentTime.format('d');
	this.find({
		$or: [{
			'programs.endTimeInHour': {
				$gt: currentTime.format('H')
			},
			'dayPlayed': currentDay
		}, {
			'programs.endTimeInHour': {
				$eq: currentTime.format('H')
			},
			'programs.endTimeInMinutes': {
				$gt: currentTime.format('m')
			},
			'dayPlayed': currentDay
		}, {
			'programs.startTimeInHour': {
				$lt: tomTime.format('H')
			},
			'dayPlayed': tomDay
		}, {
			'programs.startTimeInHour': {
				$eq: tomTime.format('H')
			},
			'programs.startTimeInMinutes': {
				$lt: currentTime.format('m')
			},
			'dayPlayed': tomDay
		}]
	}).select({
		'programs.artistImg': 0
	}).sort({
		'dayPlayed': 1,
		'programs.startTimeInHour': 1,
		'programs.startTimeInMinutes': 1
	}).exec((err, docs) => {
		if (err) {
			return cb(err);
		}
		let schedules = this.processSchedules(docs);
		return cb(null, schedules);
	});
};

scheduleSchema.statics.getImgBufferForId = function (id, cb) {
	debug('schedule.js -> getImgBufferForId : ');
	if (!cb) {
		throw new Error('Callback is mandatory');
	}
	this.find({
		'programs.id': id
	}).select({
		'programs.artistImg': 1
	}).exec((err, img) => {
		if (err) {
			return cb(err);
		}
		return cb(null, img);
	});
};

scheduleSchema.methods.processSchedule = function () {
	let schedule = this.toObject({
		versionKey: false
			// delete schedule._id;
	});
	return schedule;
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
	return Schedule;
};
