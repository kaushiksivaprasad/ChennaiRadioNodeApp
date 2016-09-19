require('source-map-support').install();
var mongoose = require('mongoose');
var debug = require('debug')('ChennaiRadioNodeApp:server');

module.exports = (function () {
	class Utils {
		constructor() {
			this.mongoose = null;
		}

		createDBConnection() {
			return new Promise((resolve, reject) => {
				mongoose.connect('mongodb://chennaiRadioUser:chennaiRadioNodeUser@localhost:27017/chennaiRadioDb', {
					config: {
						autoIndex: false
					}
				});
				let connection = mongoose.connection;
				connection.on('error', reject);
				connection.once('open', function () {
					debug('Db connection open');
					resolve(connection);
				});
			});
		}

		getBaseUrl(req) {
			if (!req) {
				throw new Error('Req is a mandatory argument');
			}
			return 'http://' + req.headers.host + '/';
		}
	}
	return new Utils();
})();
