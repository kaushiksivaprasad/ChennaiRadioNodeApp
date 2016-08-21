require('source-map-support').install();
let express = require('express');
let multer = require('multer');
var debug = require('debug')('ChennaiRadioNodeApp:server');
var Advertisement = require('../models/advertisement.js')();

let upload = multer();
let router = express.Router();

router.post('/:userId/advertisement', upload.single('img'), function (req, res, next) {
	if (req.file === null || typeof req.file === 'undefined') {
		let error = new Error('img is mandatory');
		error.status = 400;
		next(error);
	}
	if (req.user.isRJ()) {
		req.user.refreshUserSession();
		let temp = req.body;
		temp.img = req.file.buffer;
		let ad = new Advertisement(temp);
		ad.save((err, ad) => {
			if (err) {
				return next(err);
			}
			return res.status(201).json({
				message: 'Advertisement created'
			});
		});
	} else {
		let error = new Error('Invalid user to access this resource');
		error.status = 401;
		next(error);
	}
});

router.get('/:userId/advertisements', function (req, res, next) {
	req.user.refreshUserSession();
	Advertisement.find({}, function (err, ads) {
		if (err) {
			return next(err);
		}
		return res.json(ads);
	});
});
module.exports = router;
