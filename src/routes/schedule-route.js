require('source-map-support').install();
let express = require('express');
let debug = require('debug')('ChennaiRadioNodeApp:server');
let multer = require('multer');
let Schedule = require('../models/schedule.js')();
var Utils = require('../utils.js');

let upload = multer();
let router = express.Router();

router.post('/:userId/schedule', upload.array('artistImgs'), function (req, res, next) {
	if (req.body === null || typeof req.body === 'undefined' ||
		req.body.programs === null || typeof req.body.programs === 'undefined') {
		let error = new Error('request body or programs array in the body is missing');
		error.status = 400;
		return next(error);
	}
	if (req.files === null || typeof req.files === 'undefined' || req.files.length !== req.body.programs.length) {
		let error = new Error('artistImgs is required');
		error.status = 400;
		return next(error);
	}
	for (let i = 0; i < req.files.length; i++) {
		req.body.programs[i].artistImg = req.files[i].buffer;
	}
	if (req.user.isAdmin()) {
		req.user.refreshUserSession();
		let temp = req.body;
		debug('schedule-route.js -> posted schedule : ' + JSON.stringify(temp));
		let schedule = new Schedule(temp);
		schedule.save(err => {
			if (err) {
				return next(err);
			}
			return res.status(201).json({
				message: 'Schedule created'
			});
		});
	} else {
		let error = new Error('Invalid user to access this resource');
		error.status = 401;
		next(error);
	}
});

router.get('/:userId/schedule', function (req, res, next) {
	req.user.refreshUserSession();
	Schedule.getSchedules((err, docs) => {
		if (err) {
			return next(err);
		}
		let response = Utils.formatScheduleResponse(docs);
		return res.status(200).json(response);
	});
});

router.get('/:userId/schedule/artistImg/:id', function (req, res, next) {
	req.user.refreshUserSession();
	Schedule.getImgBufferForId((err, img) => {
		if (err) {
			return next(err);
		}
		res.writeHead(200, {
			'Content-Type': 'image/jpeg'
		});
		res.end(img);
	});
});

module.exports = router;
