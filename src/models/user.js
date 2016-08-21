require('source-map-support').install();
let mongoose = require('mongoose');
let bcrypt = require('bcrypt-nodejs');
var debug = require('debug')('ChennaiRadioNodeApp:server');

let userSchema = mongoose.Schema({
	firstName: {
		type: String,
		required: true
	},
	lastName: String,
	phoneNo: Number,
	emailId: {
		type: String,
		required: true
	},
	userType: {
		type: String,
		enum: ['Admin', 'RJ', 'User'],
		default: 'User'
	},
	password: String
});
userSchema.index({
	emailId: 1
}, {
	unique: true
});
userSchema.methods.validatePassword = function (password, cb) {
	if (!password && !cb) {
		throw new Error('Password and Callback is mandatory');
	}
	bcrypt.compare(password, this.password, function (err, res) {
		if (err) {
			cb(err);
		}
		cb(null, res);
	});
};

userSchema.methods.isRJ = function () {
	return this.userType === 'RJ';
};

userSchema.pre('save', function (next) {
	bcrypt.hash(this.password, null, null, (err, hash) => {
		// Store hash in your password DB.
		if (err) {
			throw err;
		}
		this.password = hash;
		next();
	});
});
let User = null;

function createUserModelIfNotExist(connection) {
	if (!User && connection) {
		User = connection.model('user', userSchema);
		User.ensureIndexes();
	}
}
module.exports = function (connection) {
	createUserModelIfNotExist(connection);
	if (!User) {
		throw new Error('User Model not created');
	}
	return User;
};
