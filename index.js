var _ = _ || require('lodash'),
	Promise = require('./es6-promise').Promise;

(function() {
	var trimChars, trimleft, trimRight;

	var trimChars = function(str, charlist) {
	  return trimLeft.call(str, charlist).trimRight(charlist);
	};

	trimLeft = function(charlist) {
	  if (charlist === undefined)
		 charlist = "\s";

	  return this.replace(new RegExp("^[" + charlist + "]+"), "");
	};

	trimRight = function(charlist) {
	  if (charlist === undefined)
	    charlist = "\s";
	 
	  return this.replace(new RegExp("[" + charlist + "]+$"), "");
	};

	/**
	 * API to Tiny Mesh Cloud
	 *
	 * ## Usage:
	 *
	 *	```
	 *	var client = require('tinymesh-cloud-client);
	 *	client.$config.set('endpoint', *	'http://http.cloud.tiny-mesh.com/v1');
	 *	```
	 */
	function BaseAPI(baseopts) {
		var superagent = require('superagent');

		function ResourceAgent() {
			superagent.Request.apply(this, arguments);
		};

		var config = baseopts;
		config.decoration = config.decoration || {};
		config.decoration.after = config.decoration.after || [];
		config.decoration.before = config.decoration.before || [];
		config.endpoint = config.endpoint || "https://http.cloud.tiny-mesh.com/v1";

		// Simple config for dependency injection
		this.$config = {
			set: function(k, v) {
				return config[k] = v;
			},
			get: function(k) {
				return config[k];
			}
		};

		// Inherit form superagent.Request
		ResourceAgent.prototype = Object.create(superagent.Request.prototype)
		ResourceAgent.prototype.$config = this.$config

		// enable decoration
		ResourceAgent.prototype.decoration = {before: [], after: []};
		ResourceAgent.prototype.decorate = function(opts) {
			if (opts.before)
				this.decoration.before = opts.before;

			if (opts.after)
				this.decoration.after = opts.after;

			if (opts.auth)
				this.decoration.auth = opts.auth;

			return this;
		};

		// setup and execute the request
		// the immediate result will be a object with on single key
		// $promise.
		ResourceAgent.prototype.end = function(res, obj) {
			var _super = superagent.Request.prototype.end;

			var ctx = this;

			var oldpromise = res.$promise;
			res.$promise = new Promise(function(resolve, reject) {
				if (ctx.decoration.before.length > 0)
					for (var i in ctx.decoration.before)
						ctx.decoration.before[i].call(ctx, res);

				_super.call(ctx, function(err, value) {
					if (err)
						return reject.call(this, err);

					switch (value.statusType) {
						case 2:
							if (_.isArray(res)) {
								res.length = 0;
								for (var i = 0; i < value.body.length; i++) {
									res.$set(i, _.merge(new obj(), value.body[i]));
								}
							} else {
								_.merge(res, value.body).$add('');
							}

							if (oldpromise && oldpromise.$resolve)
								oldpromise.$resolve.call(value, res);

							return resolve.call(value, res);

						case 4:
						case 5:
						default:
							console.log("error: " + value.status, value.body)
							if (oldpromise && oldpromise.$reject)
								oldpromise.$reject.call(this, value);
							return reject.call(this, value);
					}
				});
			});

			if (this.decoration.after.length > 0)
				res.$promise.then(function(val) {
					for (var i in ctx.decoration.after) {
						ctx.decoration.after[i].call(ctx, val, res);
					}
				}, function(req, val) {
					for (var i in ctx.decoration.after) {
						ctx.decoration.after[i].call(ctx, req, val);
					}
				});



			return res;
		};

		var request = function(method, url) {
			return new ResourceAgent(method, url);
		};

		/**
		 * GET `url` with optional callback `fn(res)`.
		 *
		 * @param {String} url
		 * @param {Mixed|Function} data or fn
		 * @param {Function} fn
		 * @return {Request}
		 * @api public
		 */
		request.get = function(url, data, fn){
			var req = request('GET', url);
			if ('function' == typeof data) fn = data, data = null;
			if (data) req.query(data);
			if (fn) req.end(fn);
			return req;
		};

		/**
		 * HEAD `url` with optional callback `fn(res)`.
		 *
		 * @param {String} url
		 * @param {Mixed|Function} data or fn
		 * @param {Function} fn
		 * @return {Request}
		 * @api public
		 */
		request.head = function(url, data, fn){
			var req = request('HEAD', url);
			if ('function' == typeof data) fn = data, data = null;
			if (data) req.send(data);
			if (fn) req.end(fn);
			return req;
		};

		/**
		 * DELETE `url` with optional callback `fn(res)`.
		 *
		 * @param {String} url
		 * @param {Function} fn
		 * @return {Request}
		 * @api public
		 */
		request.delete = request.del = function(url, fn){
			var req = request('DELETE', url);
			if (fn) req.end(fn);
			return req;
		};

		/**
		 * PATCH `url` with optional `data` and callback `fn(res)`.
		 *
		 * @param {String} url
		 * @param {Mixed} data
		 * @param {Function} fn
		 * @return {Request}
		 * @api public
		 */
		request.patch = function(url, data, fn){
			var req = request('PATCH', url);
			if ('function' == typeof data) fn = data, data = null;
			if (data) req.send(data);
			if (fn) req.end(fn);
			return req;
		};

		/**
		 * POST `url` with optional `data` and callback `fn(res)`.
		 *
		 * @param {String} url
		 * @param {Mixed} data
		 * @param {Function} fn
		 * @return {Request}
		 * @api public
		 */
		request.post = function(url, data, fn){
			var req = request('POST', url);
			if ('function' == typeof data) fn = data, data = null;
			if (data) req.send(data);
			if (fn) req.end(fn);
			return req;
		};

		/**
		 * PUT `url` with optional `data` and callback `fn(res)`.
		 *
		 * @param {String} url
		 * @param {Mixed|Function} data or fn
		 * @param {Function} fn
		 * @return {Request}
		 * @api public
		 */
		request.put = function(url, data, fn){
			var req = request('PUT', url);
			if ('function' == typeof data) fn = data, data = null;
			if (data) req.send(data);
			if (fn) req.end(fn);
			return req;
		};

		this.data = function data() { };

		function WbResource() { };
		WbResource.prototype.$obj = WbResource;
		WbResource.prototype.$type = undefined;

		/**
		 * Create a new resource
		 *
		 * Takes a name and options to generate a resource.
		 * The object `opts` contains `(k,v)` pairs where the `k` is the
		 * function to be generated and `v` is an object specifying the
		 * action of the object.
		 *
		 * `v` can take the following options:
		 *
		 *  * `method` - HTTP method  to use, using custom methods have
		 *               undefined behaviour
		 *  * `endpoint` - either string or a mixed list of url segments
		 *                 containing strings and `{param: '<param>'}` items
		 *  * `stateful` - whetever the result is an instance, in which
		 *                 all the stateful methods will be appended
		 *  * `isArray` - if the result is an array, containing a
		 *                collection of T. Each item will be mapped and
		 *                all stateful methods will be addeed to them.
		 *  * `patch`   - Whetever the patch or the full body of the
		 *                instance should be sent with the request.
		 *                Defaults to `false`, meaning only patch
		 *
		 *  * `future` - creates a empty resource according to spec
		 *               and defers the execution to the developer
		 *
		 * Additional plugins may have additional options.
		 *
		 * @param {String} name the name of the resource
		 * @param {Object} opts options for the resource
		 * @param {Array} plugins list of plugins to inject
		 * @return {Resource}
		 * @api public
		 */
		this.resource = function(type, endpoints, plugins) {
			plugins = plugins || [];

			var resource = new WbResource();

			var genEndpoint = function(endpoint, vals, qopts) {
				qopts = qopts || {};
				if ('string' === typeof(endpoint)) {
					return trimChars(config.endpoint, '/') + "/" + trimChars(endpoint, '/');
				} else {
					var res = trimChars(config.endpoint, '/');
					for (var i in endpoint) {
						if ('string' === typeof(endpoint[i]))
							res += "/" + trimChars(endpoint[i], "/");
						else if (undefined === (qopts[endpoint[i].param] || vals[endpoint[i].param]))
							throw new Error("missing url part '" + endpoint[i].param + "'");
						else
							res += "/" + (qopts[endpoint[i].param] || vals[endpoint[i].param]);
					}

					return res;
				}
			};

			var objclass = 'WbData' + type;
			var obj = new Function("return function " + objclass + "() { }")();
			obj.prototype.$promise = undefined;
			obj.prototype.$type = objclass;
			resource.$obj = obj;

			// add $get, $sync, ... type methods
			_.each(endpoints, function(endpoint, k) {
				if (!endpoint.stateful)
					return;

				obj.prototype["$" + k] = function(opts, dataOrQopts, qopts) {
					if (3 === arguments.length)
						return resource[k](opts, dataOrQopts, qopts);
					else
						return resource[k](opts, this, dataOrQopts);
				};
			}, {});

			_.each(endpoints, function(orgopt, k) {
				var opt = _.merge({}, baseopts, orgopt);
				var method = (opt.method || "").toLowerCase(),
					endpoint = opt.endpoint;

				if (!endpoint)
					throw new Error("no endpoint specified: " + JSON.stringify(opt));

				var endpointArgs = _.map(_.filter(endpoint, _.isObject), function(val) {
					return val.param
				})
				var filterEndpointArgs = function(qopts) {
					return _.omit(qopts, endpointArgs)
				}

				switch (method) {
					case "get":
					case "delete":
					case "put":
					case "post":
						resource[k] = function(opts, vals, qopts) {
							var callopts = _.merge({}, opt, opts),
							    retvals = vals ? vals : (opt.isArray ? [] : new obj({}));


							var type = retvals.constructor.toString().match(/function ([^(]+)\(/)[1];
							if (!opt.isArray && type !== objclass) {
								console.log("warning: resource value expected to be of type: `" + objclass + "`, got: `" + type + "`");

								retvals = _.merge(new obj(), retvals)
							}

							var future = function(reqopts, vals) {
								var futureopts = _.merge({}, callopts, reqopts);
								var proto = request[method](genEndpoint(endpoint, vals, qopts));

								if ('post' === method || 'put' === method) {
									proto = proto.send(_.omit(vals, function(a,b) { return b.match(/^\$/); }));
								}

								proto = proto
									.set('Content-Type', 'application/json')
									.query(filterEndpointArgs(qopts))
									.decorate(_.merge(_.cloneDeep(config), opt).decoration || {});

								return _.foldl(plugins, function(res, plugin) {
										return plugin.call(res, futureopts);
									}, proto)
									.end(retvals, obj);
							};

							// create a externally resolvable future to allow
							// subscribing to promises that have not yet been
							// initiated (ie due to authentication not done yet).
							if (callopts.future) {
								retvals.$promise = new Promise(function(resolve, reject) {
									retvals.$reject = reject;
									retvals.$resolve = resolve;
								});
								retvals.$fulfil = function(opts) {
									return future(opts, retvals).$promise.then(
										function(vals) {
											return retvals.$resolve.call(this, vals);
										},
										function(err) {
											return retvals.$reject.call(this, err);
										});
								};

								return retvals;
							} else {
								return future(callopts, retvals);
							}
						};
						break;

					default:
						throw new Error("invalid method '" + opts.method + "'");
				}
			});

			return resource;
		};
	};

	var sse = require('./sse.js')
	var stream = function(opts) {
		if (!opts.stream)
			return this;

		this._query = _.map(this._query, function(val) {
			return window.decodeURIComponent(val)
		});

		this._query.push("authorization=" + window.encodeURI(this.header.Authorization))
		url = this.url + (this._query.length > 0 ? '?' + this._query.join('&') : '')

		this.end = function() {
			var
				_handlers = 0,
				evhandler = new sse(url)

			_.each(opts.evhandlers, function(v, k) {
				if (!v)
					v = _.noop

				evhandler.on(k, v)
			})

			this.evhandler = evhandler

			return this
		}
		return this;
	};

	var hmac = require("crypto-js/hmac-sha256");
	var base64 = require("crypto-js/enc-base64");
	var superagent = require('superagent');

	var _keystore = {fingerprint: null, key: null};
	var keystore = function(fprint, key) {
		_keystore.fingerprint = fprint;
		_keystore.key = key;
	};

	var sign = function(opts) {
		if (!opts.sign)
			return this;

		fingerprint = opts.auth.fingerprint;
		key = opts.auth.key;

		var serialize = superagent.serialize[this.getHeader('Content-Type')],
		    payload = "";

		if (serialize)
			payload = serialize(this._data);

		this._query = _.map(this._query, function(val) {
			return window.decodeURIComponent(val)
		});
		url = this.url + (this._query.length > 0 ? '?' + this._query.join('&') : '')

		buf = [this.method, url, payload].join("\n");
		sig = hmac(buf, key || "").toString(base64);

		this.set('X-Token', Math.random().toString(36).substring(2));
		this.set('Authorization', (fingerprint || "") + " " + sig);

		return this;
	};

	function API(opts) {
		opts.sign = true
		opts.stateful =  true
		opts.patch = true

		api = new BaseAPI(opts);
		api.auth = api.resource('Auth', {
			'info':   {method: 'GET',    stateful: true, endpoint: '/auth'},
			'login':  {method: 'POST',   stateful: true, endpoint: '/auth/session', sign: false},
			'logout': {method: 'DELETE', stateful: true, endpoint: '/auth/session'},
		}, [sign]);

		api.user = api.resource('User', {
			'get':      {method: 'GET',  stateful: true, endpoint: '/user'},
			'update':   {method: 'PUT',  stateful: true, endpoint: '/user'},
			'sync':     {method: 'PUT',  stateful: true, endpoint: '/user', patch: false},
			'register': {method: 'POST', stateful: true, endpoint: '/user/register', sign: false},
		}, [sign]);

		api.user.name = "";
		api.user.email = "";

		api.organization = api.resource('Organization', {
			'create': {method: 'POST', stateful: false, endpoint: '/organization', isArray: true},
			'list':   {method: 'GET', stateful: false, endpoint: '/organization'},
			'get':    {method: 'GET', stateful: true, endpoint: ['/organization', {param: 'key'}]},
			'update': {method: 'GET', stateful: true, endpoint: ['/organization', {param: 'key'}]},
			'sync':   {method: 'GET', stateful: true, endpoint: ['/organization', {param: 'key'}], patch: false},
			'add_user':   {method: 'PUT',    stateful: true, endpoint: ['/organization', {param: 'key'}, 'user', {param: 'user'}], patch: true},
			'revoke_user':{method: 'DELETE', stateful: true, endpoint: ['/organization', {param: 'key'}, 'user', {param: 'user'}]},
		}, [sign]);

		api.network = api.resource('Network', {
			'list':   {method: 'GET',    stateful: false, endpoint: '/network', isArray: true},
			'create': {method: 'POST',   stateful: false, endpoint: '/network'},
			'get':    {method: 'GET',    stateful: true,  endpoint: ['/network/', {param: 'key'}]},
			'delete': {method: 'DELETE', stateful: true,  endpoint: ['/network/', {param: 'key'}]},
			'sync':   {method: 'PUT',    stateful: true,  endpoint: ['/network/', {param: 'key'}], patch: false},
			'update': {method: 'PUT',    stateful: true,  endpoint: ['/network/', {param: 'key'}]},
		}, [sign]);

		api.network.key = "";
		api.network.name = "";

		api.network.$obj.prototype.hasChannels = function() {
			return Object.keys(this.channels || {}).length > 0;
		};

		api.network.$obj.prototype.haveConnected = function() {
			return this.hasChannels() && _.any(this.channels, function(chan) {
				return undefined !== chan.last;
			});
		};

		api.network.$obj.prototype.connected = function() {
			return this.hasChannels() && _.any(this.channels, function(chan) {
				return undefined !== chan.last;
			});
		};

		api.device = api.resource('Device', {
			'get':    {method: 'GET',    stateful: true, endpoint: ['/device', {param: 'network'}, {param: 'key'}]},
			'create': {method: 'POST',   stateful: true, endpoint: ['/device', {param: 'network'}]},
			'update': {method: 'PUT',   stateful: true, endpoint: ['/device', {param: 'network'}, {param: 'key'}]},
			'sync':   {method: 'PUT',    stateful: true, endpoint: ['/device', {param: 'network'}, {param: 'key'}], patch: false},
			'delete': {method: 'DELETE', stateful: true, endpoint: ['/device', {param: 'network'}, {param: 'key'}]},
		}, [sign]);

		api.message = api.resource('Message', {
			'create': {method: 'POST', stateful: false, endpoint: ['/message', {param: 'network'}, {param: 'device'}]},
			'query': {method: 'GET',  stateful: false, endpoint: ['/message-query', {param: 'network'}, {param: 'device'}]},
			'stream': {method: 'GET',  stateful: false, endpoint: ['/message-query', {param: 'network'}, {param: 'device'}], stream: true, evhandlers: {msg: undefined, ping: undefined, error: undefined}},
		}, [sign, stream]);

		return api;
	};

	module.exports = new API({
		decoration: {
			after: [
				function(req, val) {
					if (401 === this.xhr.status) {
						var callback = this.$config.get('onUnauthorized')
						if (callback)
							callback()
					}
				}
			]
		}

	});
})();
