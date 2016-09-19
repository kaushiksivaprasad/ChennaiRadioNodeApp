require('source-map-support').install();
let mongoose = require('mongoose');
let debug = require('debug')('ChennaiRadioNodeApp:server');
let cache = require('../cache/ad-cache.js')
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
advertismentSchema.post('save', function (doc) {
	let tempJson = {
		img: doc.img,
		url: doc.url,
		_id: doc.id
	};
	cache.addSingleAd(tempJson);
});

advertismentSchema.pre('save', function (next) {
	this.dateCreated = Date.now();
	next();
});

function loadAdsOnStartup() {
	if (Advertisement) {
		Advertisement.find({}).select({
			img: 1,
			url: 1,
			_id: 1
		}).sort({
			dateCreated: -1
		}).limit(NO_OF_RECORDS).exec((err, ads) => {
			if (err) {
				throw err;
			}
			let adsToBePushedToCache = [];
			for (let ad of ads) {
				adsToBePushedToCache.push({
					img: ad.img,
					url: ad.url,
					_id: ad.id
				});
				debug('advertisement.js -> Ads loaded : _id : ' + ad._id + ' url : ' + ad.url);
			}
			cache.setAds(adsToBePushedToCache);
		});
	}
}

function createAdvertisementModelIfNotExist(connection) {
	if (!Advertisement && connection) {
		Advertisement = connection.model('advertisement', advertismentSchema);
		Advertisement.ensureIndexes();
		loadAdsOnStartup();
	}
}
module.exports = function (connection) {
	createAdvertisementModelIfNotExist(connection);
	if (!Advertisement) {
		throw new Error('Advertisement Model not created');
	}
	return Advertisement;
};
