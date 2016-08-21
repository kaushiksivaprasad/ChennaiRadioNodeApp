require('source-map-support').install();
let express = require('express');
var debug = require('debug')('ChennaiRadioNodeApp:server');
let cache = require('../cache/ad-cache.js')

let router = express.Router();
router.get('/:userId/advertisement/:adId', function (req, res, next) {
	req.user.refreshUserSession();
	for (let ad of cache.ads) {
		debug('advertisement-route.js -> Ads loaded : _id : ' + ad._id + ' url : ' + ad.url);
	}
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
module.exports = router;
