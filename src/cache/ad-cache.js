require('source-map-support').install();
let debug = require('debug')('ChennaiRadioNodeApp:server');
let Config = require('../config');
// Constants
const NO_OF_ADS = Config.NO_OF_ADS;
class AdCache {
	constructor() {
		this.ads = [];
		this.listeners = [];
	}
	addSingleAd(ad) {
		this.ads.unshift(ad);
		let length = (this.ads.length < NO_OF_ADS) ? this.ads.length : NO_OF_ADS;
		this.ads = this.ads.slice(0, length);
		debug('ad-cache.js -> Ads totl length' + this.ads.length);
		for (let ad of this.ads) {
			debug('ad-cache.js -> Ads loaded : _id : ' + ad._id + ' url : ' + ad.url);
		}
		this.triggerListeners();
	}

	setAds(ads) {
		this.ads = ads;
		this.triggerListeners();
	}

	triggerListeners() {
		if (this.listeners.length > 0) {
			for (let listener of this.listeners) {
				listener.sendToClient(this.getBodyForListeners());
			}
		}
	}

	getBodyForListeners() {
		let body = [];
		for (let ad of this.ads) {
			body.push({
				id: ad._id,
				url: ad.url
			});
		}
		let event = {
			type: Config.ADS_EVENT,
			mess: body
		}
		return event;
	}

	addListener(listener) {
		this.listeners.push(listener);
	}

	getImgBufferForId(id) {
		for (let ad of this.ads) {
			if (ad._id === id) {
				return ad.img;
			}
		}
	}
}
let cache = null;
if (!cache) {
	cache = new AdCache();
}
module.exports = cache;
