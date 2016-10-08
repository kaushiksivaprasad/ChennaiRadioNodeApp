require('source-map-support').install();
let mongoose = require('mongoose');
var debug = require('debug')('ChennaiRadioNodeApp:server');
var moment = require('moment');

var programSchema = new mongoose.Schema({
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

/*
db.schedules.find({
		$or: [{
			'programs.endTimeInHour': {
				$gt: 13
			},
			'dayPlayed': 1
		}, {
			'programs.endTimeInHour': {
				$eq: 13
			},
			'programs.endTimeInMinutes': {
				$gt: 30
			},
			'dayPlayed': 1
		}, {
			'programs.startTimeInHour': {
				$lt: 2
			},
			'dayPlayed': 2
		}, {
			'programs.startTimeInHour': {
				$eq: 2
			},
			'programs.startTimeInMinutes': {
				$lt: 30
			},
			'dayPlayed': 2
		}]
	},{'programs.artistImg': 0}).sort({
		'dayPlayed': 1,
		'programs.startTimeInHour': 1,
		'programs.startTimeInMinutes': 1
	}).pretty()

	db.schedules.find({'programs' : {$elemMatch :{'hostedBy': {$eq: 'person1'}}},'dayPlayed': 1
	},{'programs.artistImg': 0}).pretty();
*/
scheduleSchema.statics.getSchedulesForTheNext24Hours = function (cb) {
	debug('schedule.js -> getSchedulesForTheNext24Hours : ');
	if (!cb) {
		throw new Error('Callback is mandatory');
	}
	let currentTime = moment.utc();
	let tomTime = moment.utc().add(1, 'd');
	let currentDay = currentTime.format('d');
	let tomDay = tomTime.format('d');
	this.find({
		$or: [{
			dayPlayed: currentDay
		}, {
			dayPlayed: tomDay
		}]
	}).select({
		'programs.artistImg': 0
	}).exec((err, docs) => {
		if (err) {
			return cb(err);
		}
		debug('schedule.js -> docs' + JSON.stringify(docs));
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
		'programs._id': id
	}).select({
		programs: 1
	}).exec((err, docs) => {
		if (err) {
			return cb(err);
		}
		for (let doc of docs) {
			debug('schedule.js -> doc.dayPlayed' + doc.dayPlayed);
			for (let program of doc.programs) {
				debug('schedule.js -> program._id' + program._id);
				if (program._id == id) {
					return cb(null, program.artistImg);
				}
			}
		}
		return cb(new Error('Invalid imgId'));
	});
};

scheduleSchema.statics.processSchedules = function (docs) {
	debug('schedule.js -> processSchedules : ');
	let schedules = [];
	let currentTime = moment.utc();
	let tomTime = moment.utc().add(1, 'd');
	let currentDay = currentTime.format('d');
	let tomDay = tomTime.format('d');
	let hour = currentTime.format('H');
	let minutes = currentTime.format('m');

	for (let doc of docs) {
		let schedule = doc.toObject({
			versionKey: false
		});
		if (schedule.dayPlayed == currentDay) {
			debug('schedule.js -> inside currentDay match ');
			for (let i = schedule.programs.length - 1; i >= 0; i--) {
				debug('schedule.js -> iterating through programs ');
				let program = schedule.programs[i];
				if (program.endTimeInHour < hour ||
					(program.endTimeInHour == hour && program.endTimeInMinutes <= minutes)) {
					debug('schedule.js -> removing program ' + program.programName);
					schedule.programs.splice(i, 1);
					debug('schedule.js -> schedule.programs.length ' + schedule.programs.length)
				}
			}
			schedules.unshift(schedule);
		} else {
			debug('schedule.js -> inside tomDay match ');
			for (let i = schedule.programs.length - 1; i >= 0; i--) {
				let program = schedule.programs[i];
				if (program.startTimeInHour > hour ||
					(program.startTimeInHour == hour && program.startTimeInMinutes >= minutes)) {
					debug('schedule.js -> removing program ' + program.programName)
					schedule.programs.splice(i, 1);
					debug('schedule.js -> schedule.programs.length ' + schedule.programs.length)
				}
			}
			schedules.push(schedule);
		}
	}
	return schedules;
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
