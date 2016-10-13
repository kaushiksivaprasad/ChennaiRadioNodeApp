require('source-map-support').install();
let express = require('express');
var debug = require('debug')('ChennaiRadioNodeApp:server');
let multer = require('multer');
let cache = require('../cache/ad-cache.js');
var Advertisement = require('../models/advertisement.js')();

let upload = multer();

let router = express.Router();
router.get('/:userId/advertisement/:adId', function (req, res, next) {
	req.user.refreshUserSession();
	let imgBuffer = cache.getImgBufferForId(req.params.adId);
	if (imgBuffer) {
		res.writeHead(200, {
			'Content-Type': 'image/jpeg'
		});
		res.end(imgBuffer);
	} else {
		let err = new Error('AdvertisementId is invalid');
		err.status = 400;
		next(err);
	}
});

router.post('/:userId/advertisement', upload.single('img'), function (req, res, next) {
	if (req.file === null || typeof req.file === 'undefined') {
		let error = new Error('img is mandatory');
		error.status = 400;
		return next(error);
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
			// TODO: Uncomment the following after the IPC is ready
			// let json = ad.preProcessCreatedAd(ad);
			// cache.addSingleAd(json);
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
