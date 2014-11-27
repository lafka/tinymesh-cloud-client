var endpoint = undefined;

var api = function(endpoint) {
	var request = require('superagent-promise');
	var hmac = require("crypto-js/hmac-sha256");
	var base64 = require("crypto-js/enc-base64");

	var sign = function(cachedfprint, cachedkey) {
		var superagent = require('superagent');


		superagent.Request.prototype.sign = function(fingerprint, key) {
			fingerprint = fingerprint || cachedfprint;
			key = key || cachedkey;

			payload = "";
			buf = [this.method, this.url, payload || ""].join("\n");
			sig = hmac(buf, key || "").toString(base64);

			this.set('X-Token', Math.random().toString(36).substring(2));
			this.set('Authorization', (fingerprint || "") + " " + sig);

			return this;
		};
	};

	sign();


	/**
	 * /auth related
	 */
	var auth = {};

	/**
	 * GET /auth
	 *
	 * Fetch information about the auth currently used
	 *
	 */
	auth.info = function(opts) {
		return request
			.get(endpoint + '/auth')
			.sign(opts.auth.fingerprint, opts.auth.key)
	};

	/**
	 * POST /auth/session
	 *
	 * Create a new session for username and password
	 *
	 * usage: auth.login('dev@tiny-mesh.com', '123456789').
	 */
	auth.login = function(user, password, opts) {
		return request
			.post(endpoint + '/auth/session')
			.send({email: user, password: password})
	};


	/**
	 * DELETE /auth/session
	 *
	 * Destroy the current session
	 */
	auth.logout = function(opts) {
		return request
			.del(endpoint + '/auth/session')
			.sign(opts.auth.fingerprint, opts.auth.key)
	};

	/**
	 * /user related
	 */
	var user = {};

	/**
	 * GET /user
	 *
	 * Fetch the authenticated user
	 */
	user.get = function(opts) {
		return request
			.get(endpoint + '/user')
			.sign(opts.auth.fingerprint, opts.auth.key)
	};


	/**
	 * PUT /user
	 *
	 * Updates the authenticated user
	 */
	user.update = function(payload, opts) {
		return request
			.put(endpoint + '/user')
			.send(payload)
			.sign(opts.auth.fingerprint, opts.auth.key)
	};

	return {
		auth: auth,
		user: user
	//	organization: require('api/organization'),
	//	network: require('api/network'),
	//	device: require('api/device'),
	//	message: require('api/message')
	};
};

module.exports = function(base) {
	if (!endpoint)
		endpoint = base;

	return api(endpoint || base);
};
