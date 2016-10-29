require('source-map-support').install();
let mongoose = require('mongoose');
let debug = require('debug')('ChennaiRadioNodeApp:server');
let Config = require('../config');

// Constants:
const NO_OF_RECORDS = Config.NO_OF_ADS;

// Variables:
let Advertisement = null;

let advertismentSchema = mongoose.Schema({
	img: {
		type: Buffer,
		required: true
	},
	url: String,
	validTill: Date,
	validFrom: Date,
	dateCreated: {
		type: Date,
		required: true,
		default: Date.now()
	}
});
advertismentSchema.index({
	dateCreated: -1
});
advertismentSchema.methods.preProcessCreatedAd = function (doc) {
	let tempJson = {
		img: doc.img,
		url: doc.url,
		_id: doc.id
	};
	return tempJson;
	// return cache.addSingleAd(tempJson);
};

advertismentSchema.pre('save', function (next) {
	this.dateCreated = Date.now();
	next();
});
advertismentSchema.statics.loadAdsOnStartup = function (cb) {
	if (!cb) {
		throw new Error('Callback is mandatory');
	}
	if (Advertisement) {
		debug('advertisement.js -> loadAdsOnStartup : ');
		Advertisement.find({}).select({
			img: 1,
			url: 1,
			_id: 1
		}).sort({
			dateCreated: -1
		}).limit(NO_OF_RECORDS).exec((err, ads) => {
			if (err) {
				return cb(err);
			}
			let adsToBePushedToCache = [];
			for (let ad of ads) {
				adsToBePushedToCache.push({
					img: ad.img,
					url: ad.url,
					_id: ad.id
				});
			}
			return cb(null, adsToBePushedToCache);
			// cache.setAds(adsToBePushedToCache);
		});
	}
};

function createAdvertisementModelIfNotExist(connection) {
	if (!Advertisement && connection) {
		Advertisement = connection.model('advertisement', advertismentSchema);
		Advertisement.on('index', function (err) {
			if (err) {
				debug('advertisement.js -> Advertisement index error: %s', err);
				throw err;
			} else {
				debug('advertisement.js -> Advertisement indexing complete');
			}
		});
		Advertisement.ensureIndexes();
		// loadAdsOnStartup();
	}
}
module.exports = function (connection) {
	createAdvertisementModelIfNotExist(connection);
	if (!Advertisement) {
		throw new Error('Advertisement Model not created');
	}
	return Advertisement;
};
