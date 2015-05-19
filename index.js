/**
 * Ultra lightweight and fast chainable functions composition tools.
 * Working server side or browser side.
 * Inspired from https://github.com/kriszyp/compose aspect's decorators.
 * @author Gilles Coomans <gilles.coomans@gmail.com>
 * @licence MIT
 */
(function(define) {
	"use strict";
	define([], function() {
		var decompose = function(fn, type) {
			var closure = {
				queue: [],
				compiled: false
			};
			if (fn) {
				if (fn.__composition__)
					closure.queue = fn._queue().slice();
				else if (!fn.forEach)
					closure.queue = [{
						fn: fn,
						type: (type || 'fn')
					}];
				else
					closure.queue = fn.slice(); // copy array
			}
			var composition = function() {
				if (!closure.forged)
					closure.forged = forge(closure);
				return closure.forged.apply(this, arguments);
			};

			composition._deep_compiler_ = true;
			composition.__composition__ = true;

			//______________________________  protected API (usable if you know what you're doing ;)
			composition._clone = function() {
				return decompose(closure.queue);
			};
			composition._forge = function() {
				if (closure.forged)
					return closure.forged;
				return forge(closure);
			};
			composition._queue = function(fn, type) {
				if (!fn)
					return closure.queue;
				closure.forged = null;
				closure.queue.push({
					fn: fn,
					type: type || 'after'
				});
				return this;
			};
			composition._up = function(fn) {
				if (!fn) {
					if (fn === null)
						return null;
					return this;
				}
				closure.forged = null;
				if (!fn.__composition__) {
					closure.queue = [{
						fn: fn,
						type: 'fn'
					}];
					return this;
				}
				closure.queue = closure.queue.concat(fn._queue());
				return this;
			};
			composition._bottom = function(fn) {
				if (closure.queue[0].type == 'fn')
					return this;
				if (!fn)
					return this;
				closure.forged = null;
				if (fn.__composition__)
					closure.queue = fn._queue().concat(closure.queue);
				else if (typeof fn === 'function')
					closure.queue.unshift({
						fn: fn,
						type: 'fn'
					});
				return this;
			};
			//___________________________ End protected API

			//___________________________ "Public" API
			composition.after = function(fn) {
				return this._queue(fn, 'after');
			};
			composition.before = function(fn) {
				return this._queue(fn, 'before');
			};
			composition.around = function(fn) {
				return this._queue(fn, 'around');
			};
			composition.fail = function(fn) {
				return this._queue(fn, 'fail');
			};
			composition.done = function(fn) {
				return this._queue(fn, 'after');
			};
			composition.always = function(fn) {
				return this._queue(fn, 'after')._queue(fn, 'fail');
			};
			return composition;
		};

		decompose.Arguments = function(arr) {
			if (!arr.forEach)
				arr = [arr];
			arr._compo_arguments_ = true;
			return arr;
		};

		/**
		 * Composer factory
		 * @param {[type]} api       [description]
		 */
		decompose.Composer = function(api) {
			var composer = function(fn, type) {
				var cmp = decompose(fn, type);
				for (var i in api)
					cmp[i] = api[i];
				cmp._clone = function() {
					return composer(this._queue());
				};
				return cmp;
			};
			composer.add = function(name, method) {
				api[name] = method;
				return this;
			};
			return composer;
		};

		//_________________________________________________ Local functions

		var manageAfter = function(r, after, self, args) {
			if (after._deep_ocm_)
				after = after();
			if (!after) // ocm could return null or undefined
				return r;
			if (typeof r !== 'undefined')
				args = (r && r._compo_arguments_) ? r : [r];
			var r2 = after.apply(self, args);
			if (r2 && typeof r2.then === 'function')
				return r2.then(function(r2) {
					return (typeof r2 === 'undefined') ? r : r2;
				});
			return (typeof r2 === 'undefined') ? r : r2;
		};

		var chain = function(bef, aft) {
			return function() {
				var self = this,
					r,
					before = bef, // need to keep bef and aft reference between call for ocm management
					after = aft,
					args = arguments;
				if (before._deep_ocm_)
					before = before();
				if (before) // ocm could return null or undefined. if so : skip.
					r = before.apply(this, args);
				if (r instanceof Error)
					return r;
				if (r && typeof r.then === 'function') // promise/thenable signature
					return r.then(function(r2) {
						return manageAfter(r2, after, self, args);
					});
				return manageAfter(r, after, self, args);
			};
		};

		function fail(oldOne, self, args, fn) {
			var res = null;
			if (fn._deep_ocm_)
				fn = fn();
			try {
				res = oldOne.apply(self, args); // oldOne could return an error or not
			} catch (error) { // or oldOne coud throw something
				res = error;
			} finally {
				if (!res)
					return res;
				if (typeof res.then === 'function') // promise/thenable signature
				{
					return res.then(function(s) {
						return s;
					}, function(error) {
						var res = fn.call(self, error);
						return (typeof res === 'undefined' ? error : res);
					});
				}
				if (res instanceof Error) {
					var res2 = fn.call(self, res);
					return (typeof res2 === 'undefined' ? res : res2);
				}
				return res;
			}
		}

		var forge = function(closure) {
			var queue = closure.queue;
			if (!queue.length)
				return function() {};
			if (queue[0].type === 'around')
				throw new Error("composition starting with 'around' : could not be compiled. aborting.");
			var func = null,
				len = queue.length;
			queue.forEach(function(descriptor) {
				var oldOne = null;
				switch (descriptor.type) {
					case 'fn':
						func = descriptor.fn;
						break;
					case 'after':
						if (func)
							func = chain(func, descriptor.fn, closure);
						else
							func = descriptor.fn;
						break;
					case 'before':
						if (func)
							func = chain(descriptor.fn, func, closure);
						else
							func = descriptor.fn;
						break;
					case 'around':
						oldOne = func;
						func = function() {
							var wrapper = descriptor.fn(oldOne);
							if (!wrapper)
								throw new Error(".around() composition is used without returning a function. aborting.");
							return wrapper.apply(this, arguments);
						};
						break;
					case 'fail':
						oldOne = func;
						func = function() {
							if (!oldOne)
								return;
							return fail(oldOne, this, arguments, descriptor.fn);
						};
						break;
					default:
						throw new Error("composition unrecognised : " + descriptor.type);
				}
			});
			closure.forged = func;
			return func;
		};

		//_______________________________________________________ MERGER

		decompose.up = function() {
			var args = Array.prototype.slice.call(arguments),
				lastArg = args[args.length - 1];
			if (!lastArg.__composition__)
				return lastArg;
			var bck = args.shift();
			while (!bck)
				bck = args.shift();
			if (bck.__composition__) {
				for (var i = 0, len = args.length; i < len; ++i)
					bck._up(args[i]);
				return bck;
			}
			var frg = args.pop()._clone();
			for (var len2 = args.length - 1; len2 >= 0; --len2)
				frg._bottom(args[len2]);
			frg._bottom(bck);
			return frg;
		};

		decompose.bottom = function() {
			var args = Array.prototype.slice.call(arguments),
				frg = args.pop();
			if (frg.__composition__)
				for (var len = args.length - 1; len >= 0; --len)
					frg._bottom(args[len]);
			return frg;
		};

		decompose.compile = function() {
			var args = Array.prototype.slice.call(arguments),
				frg = args.pop();
			if (frg.__composition__) {
				frg = frg._clone();
				for (var len = args.length - 1; len >= 0; --len)
					frg._bottom(args[len]);
			}
			return frg;
		};

		return decompose;
	});
})(typeof define !== 'undefined' ? define : function(deps, factory) { // AMD/RequireJS format if available
	if (typeof module !== 'undefined')
		module.exports = factory(); // CommonJS environment
	else
		decompose = factory(); // raw script, assign to decompose global
});