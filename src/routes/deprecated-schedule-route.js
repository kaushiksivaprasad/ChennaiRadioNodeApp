require('source-map-support').install();
let express = require('express');
let debug = require('debug')('ChennaiRadioNodeApp:server');
let bodyParser = require('body-parser');
let Schedule = require('../models/schedule.js')();
let scheduleCache = require('../cache/schedules-cache.js')

let router = express.Router();

router.post('/:userId/schedule', bodyParser.json(), function (req, res, next) {
	if (req.user.isAdmin()) {
		req.user.refreshUserSession();
		// delete data in the table
		Schedule.insertMany(req.body, function (error, docs) {
			if (error) {
				return next(error);
			}
			return res.status(201).json({
				message: 'schedules created'
			});
			// Schedule.getSchedulesStartingFromCurrentTime((err, docs) => {
			// 	if (docs) {
			// 		debug('schedule-route.js -> docs available : ');
			// 		scheduleCache.setSchedules(docs);
			// 	}
			// 	return res.status(201).json({
			// 		message: 'schedules created'
			// 	});
			// });
		});
	} else {
		let error = new Error('Invalid user to access this resource');
		error.status = 401;
		next(error);
	}
});

router.get('/schedule', function (req, res, next) {
	req.user.refreshUserSession();
	// Schedule.getSchedulesStartingFromCurrentTime((err, docs) => {
	// 	if (err) {
	// 		return next(err);
	// 	}
	// 	return res.status(200).json(docs);
	// })
});

module.exports = router;
