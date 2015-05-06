/**
 * @author Gilles Coomans <gilles.coomans@gmail.com>
 *
 */
if (typeof require !== 'undefined')
	var chai = require("chai"),
		decompose = require("../index");

var expect = chai.expect;

describe(".after()", function() {

	describe("after with single argument chaining", function() {
		var func = decompose(function(arg) {
				return arg + 3;
			})
			.after(function(arg) {
				return arg / 3;
			});

		var res = func(12);

		it("should", function() {
			expect(res).equals(5);
		});
	});

	describe("after with single argument chaining and return ommition", function() {
		var func = decompose(function(arg) {
				return arg + 3;
			})
			.after(function(arg) {

			})
			.after(function(arg) {
				return arg / 3;
			});

		var res = func(12);

		it("should", function() {
			expect(res).equals(5);
		});
	});

	describe("after with single argument and no return", function() {
		var func = decompose(function(arg1) {
				arg1.a += 4;
			})
			.after(function(arg1) {
				arg1.a /= 3;
			});

		var arg1 = {
			a: 11
		};
		var res = func(arg1);

		it("should", function() {
			expect(res).equals(undefined);
			expect(arg1.a).equals(5);
		});
	});

	describe("after with multiple arguments and no return", function() {
		var func = decompose(function(arg1, arg2) {
				arg1.a += 4;
				arg2.b += 5;
			})
			.after(function(arg1, arg2) {
				arg1.a /= 3;
				arg2.b /= 3;
			});

		var arg1 = {
				a: 11
			},
			arg2 = {
				b: 16
			};
		var res = func(arg1, arg2);

		it("should", function() {
			expect(res).equals(undefined);
			expect(arg1.a).equals(5);
			expect(arg2.b).equals(7);
		});
	});

	describe("after with multiple arguments and argument forwarding", function() {
		var func = decompose(function(arg1, arg2) {
				return decompose.Arguments([arg1 + 3, arg2 + 8]);
			})
			.after(function(arg1, arg2) {
				return [arg1 / 7, arg2 / 7];
			});

		var res = func(18, 27);

		it("should", function() {
			expect(res[0]).equals(3);
			expect(res[1]).equals(5);
		});
	});
});
describe(".before()", function() {

	describe("before with single argument chaining", function() {
		var func = decompose(function(arg) {
				return arg + 3;
			})
			.before(function(arg) {
				return arg / 3;
			});

		var res = func(12);

		it("should", function() {
			expect(res).equals(7);
		});
	});

	describe("before with single argument and no return", function() {
		var func = decompose(function(arg1) {
				arg1.a += 4;
			})
			.before(function(arg1) {
				arg1.a /= 3;
			});

		var arg1 = {
			a: 15
		};
		var res = func(arg1);

		it("should", function() {
			expect(res).equals(undefined);
			expect(arg1.a).equals(9);
		});
	});

	describe("before with multiple arguments and no return", function() {
		var func = decompose(function(arg1, arg2) {
				arg1.a += 4;
				arg2.b += 5;
			})
			.before(function(arg1, arg2) {
				arg1.a /= 3;
				arg2.b /= 3;
			});

		var arg1 = {
				a: 33
			},
			arg2 = {
				b: 60
			};
		var res = func(arg1, arg2);

		it("should", function() {
			expect(res).equals(undefined);
			expect(arg1.a).equals(15);
			expect(arg2.b).equals(25);
		});
	});

	describe("before with multiple arguments and argument forwarding", function() {
		var func = decompose(function(arg1, arg2) {
				return [arg1 / 7, arg2 / 7];
			})
			.before(function(arg1, arg2) {
				return decompose.Arguments([arg1 + 3, arg2 + 8]);
			});

		var res = func(18, 27);

		it("should", function() {
			expect(res[0]).equals(3);
			expect(res[1]).equals(5);
		});
	});
});

describe(".around()", function() {

	describe("around with single argument chaining", function() {
		var func = decompose(function(arg) {
				return arg + 3;
			})
			.around(function(sup) {
				return function(arg) {
					arg += 10;
					arg = sup.call(this, arg);
					arg /= 5;
					return arg;
				};
			});

		var res = func(12);

		it("should", function() {
			expect(res).equals(5);
		});
	});


	describe("around with argument forwarding to after", function() {
		var func = decompose(function(arg) {
				return arg + 3;
			})
			.around(function(sup) {
				return function(arg) {
					arg += 10;
					arg = sup.call(this, arg);
					arg /= 5;
					return decompose.Arguments([arg + 3, arg + 8]);
				};
			})
			.after(function(arg1, arg2) {
				return [arg1, arg2];
			});

		var res = func(12);

		it("should", function() {
			expect(res[0]).equals(8);
			expect(res[1]).equals(13);
		});
	});
});

describe(".fail()", function() {

	describe("fail with error return (and recuperation)", function() {
		var func = decompose(function(arg) {
				return new Error("oups : " + arg);
			})
			.fail(function(error) {
				return error.message + " (recup from error)";
			});

		var res = func("bloups");

		it("should", function() {
			expect(res).equals("oups : bloups (recup from error)");
		});
	});
	describe("fail with error throw", function() {
		var func = decompose(function(arg) {
				throw new Error("oups : " + arg);
			})
			.fail(function(error) {
				return error.message;
			});

		var res = func("bloups");

		it("should", function() {
			expect(res).equals("oups : bloups");
		});
	});
	describe("fail with error return and output", function() {
		var func = decompose(function(arg) {
				return new Error("oups : " + arg);
			})
			.fail(function(error) {
				error.message += " bat";
			});

		var res = func("bloups");

		it("should", function() {
			expect(res).to.be.an.instanceof(Error);
			expect(res.message).equals("oups : bloups bat");
		});
	});
	describe("fail with error catch and output", function() {
		var func = decompose(function(arg) {
				throw new Error("oups : " + arg);
			})
			.fail(function(error) {
				error.message += " bat";
			});

		var res = func("bloups");

		it("should", function() {
			expect(res).to.be.an.instanceof(Error);
			expect(res.message).equals("oups : bloups bat");
		});
	});
	describe('fail with "after" familly ommition and error return', function() {
		var func = decompose(function(arg) {
				return new Error("oups : " + arg);
			})
			.after(function(arg) {
				return arg + " floups";
			})
			.fail(function(error) {
				error.message += " bar";
			})
			.after(function(arg) {
				return arg + " schloups";
			});

		var res = func("bloups");

		it("should", function() {
			expect(res).to.be.an.instanceof(Error);
			expect(res.message).equals("oups : bloups bar");
		});
	});

	describe('fail with error recuperation', function() {
		var func = decompose(function(arg) {
				return new Error("oups : " + arg);
			})
			.fail(function(error) {
				return error.message += " bar";
			})
			.after(function(arg) {
				return arg + " floups";
			})

		var res = func("bloups");

		it("should", function() {
			expect(res).equals("oups : bloups bar floups"); // and not : bloups floups or error
		});
	});
});

// utils for promise management tests
var FakePromise = function() {
	this.queue = [];
};

FakePromise.prototype = {
	resolveWithDelay: function(value, ms) {
		var self = this;
		setTimeout(function() {
			self.resolve(value);
		}, ms);
		return this;
	},
	then: function(successCallback, errorCallback) {
		this.queue.push({
			success: successCallback,
			error: errorCallback
		});
		if (this.resolved)
			this.resolve(this.value);
		return this;
	},
	resolve: function(value) {
		this.resolved = true;
		this.value = value;
		this.error = (value instanceof Error) ? value : null;
		while (this.queue.length) {
			var handler = this.queue.shift();
			if (this.error) {
				if (handler.error)
					value = handler.error(this.error) || this.error;
			} else if (handler.success)
				value = handler.success(this.value) || this.value;
			this.value = value;
			this.error = (value instanceof Error) ? value : null;
		}
		return this;
	}
};


describe("promise management", function() {

	describe("before with immediate promise", function() {
		var res = null;
		var func = decompose(function(arg) {
				return arg + " zoo";
			})
			.before(function(arg) {
				return new FakePromise().resolve(arg + "bar");
			});

		before(function(done) {
			func("foo ").then(function(result) {
				res = result;
				done();
			});
		});

		it("should", function() {
			expect(res).equals("foo bar zoo");
		});
	});

	describe("before with delayed promise", function() {
		var res = null;
		var func = decompose(function(arg) {
				return arg + " foo";
			})
			.before(function(arg) {
				return new FakePromise().resolveWithDelay(arg + "zoo", 1);
			});

		before(function(done) {
			func("bar ").then(function(result) {
				res = result;
				done();
			});
		});

		it("should", function() {
			expect(res).equals("bar zoo foo");
		});
	});

	describe("after with immediate promise", function() {
		var res = null;
		var func = decompose(function(arg) {
				return new FakePromise().resolve(arg + "bar");
			})
			.after(function(arg) {
				return arg + " zoo";
			});

		before(function(done) {
			func("foo ").then(function(result) {
				res = result;
				done();
			});
		});

		it("should", function() {
			expect(res).equals("foo bar zoo");
		});
	});

	describe("after with delayed promise", function() {
		var res = null;
		var func = decompose(function(arg) {
				return new FakePromise().resolveWithDelay(arg + "zoo", 1);
			})
			.after(function(arg) {
				return arg + " foo";
			});

		before(function(done) {
			func("bar ").then(function(result) {
				res = result;
				done();
			});
		});

		it("should", function() {
			expect(res).equals("bar zoo foo");
		});
	});

	describe("around with immediate promise", function() {
		var res = null;
		var func = decompose(function(arg) {
				return new FakePromise().resolve(arg + " bar");
			})
			.around(function(sup) {
				return function(arg) {
					return sup.call(this, arg + "zoo")
						.then(function(success) {
							return success + " around";
						});
				}
			});

		before(function(done) {
			func("foo ").then(function(result) {
				res = result;
				done();
			});
		});

		it("should", function() {
			expect(res).equals("foo zoo bar around");
		});
	});

	describe("around with delayed promise", function() {
		var res = null;
		var func = decompose(function(arg) {
				return new FakePromise().resolveWithDelay(arg + " bar", 1);
			})
			.around(function(sup) {
				return function(arg) {
					return sup.call(this, arg + "zoo")
						.then(function(success) {
							return success + " around";
						});
				};
			});

		before(function(done) {
			func("foo ").then(function(result) {
				res = result;
				done();
			});
		});

		it("should", function() {
			expect(res).equals("foo zoo bar around");
		});
	});

	describe("fail with immediate promise (and recup)", function() {
		var res = null;
		var func = decompose(function(arg) {
				return new FakePromise().resolve(new Error("oups : " + arg));
			})
			.fail(function(error) {
				return error.message + "bar";
			});

		before(function(done) {
			func("foo ").then(function(result) {
				res = result;
				done();
			});
		});

		it("should", function() {
			expect(res).equals("oups : foo bar");
		});
	});

	describe("fail with delayed promise (and recup)", function() {
		var res = null;
		var func = decompose(function(arg) {
				return new FakePromise().resolveWithDelay(new Error(arg + " bar"), 1);
			})
			.fail(function(error) {
				return error.message + " zoo";
			});

		before(function(done) {
			func("foo").then(function(result) {
				res = result;
				done();
			});
		});

		it("should", function() {
			expect(res).equals("foo bar zoo");
		});
	});
});
describe("compilation", function() {

	describe("no recompilation between call", function() {
		var func = decompose(function(arg) {
				return arg + 3;
			})
			.after(function(arg) {
				return arg / 3;
			});

		var fn = func._compile();

		func(12);

		it("should", function() {
			expect(fn).to.equal(func._compile());
		});
	});

	describe("recompilation when queue is modified (before)", function() {
		var func = decompose(function(arg) {
				return arg + 3;
			})
			.after(function(arg) {
				return arg / 3;
			});

		var fn = func._compile();

		func.before(function(arg) {
			return arg + 10;
		});

		it("should", function() {
			expect(fn).to.not.equal(func._compile());
		});
	});

	describe("recompilation when queue is modified (after)", function() {
		var func = decompose(function(arg) {
				return arg + 3;
			})
			.after(function(arg) {
				return arg / 3;
			});

		var fn = func._compile();
		func.after(function(arg) {
			return arg + 10;
		});

		it("should", function() {
			expect(fn).to.not.equal(func._compile());
		});
	});

	describe("recompilation when queue is modified (around)", function() {
		var func = decompose(function(arg) {
				return arg + 3;
			})
			.around(function(sup) {
				return function(arg) {
					return arg / 3;
				};
			});

		var fn = func._compile();
		func.before(function(arg) {
			return arg + 10;
		});

		it("should", function() {
			expect(fn).to.not.equal(func._compile());
		});
	});
});
describe("without direct composed function", function() {

	describe("after as model", function() {
		var func = decompose()
			.after(function(arg) {
				return arg / 3;
			});
		var res = func(12);
		it("should", function() {
			expect(res).to.equal(4);
		});
	});

	describe("before as model", function() {
		var func = decompose()
			.before(function(arg) {
				return arg / 3;
			});
		var res = func(12);
		it("should", function() {
			expect(res).to.equal(4);
		});
	});

	describe("around as model : throw error", function() {
		var func = decompose()
			.around(function(sup) {
				return function(arg) {
					return arg / 3;
				};
			});
		var res = null;
		try {
			res = func(12);
		} catch (error) {
			res = error;
		}

		it("should", function() {
			expect(res).to.be.an.instanceof(Error);
			expect(res.message).to.equal("composition starting with 'around' : could not be compiled. aborting.");
		});
	});

	describe("fail as model : do nothing", function() {
		var res = "floups";
		var func = decompose()
			.fail(function(error) {
				return res = error.message + " bloups";
			});
		func("floups");
		it("should", function() {
			expect(res).to.equal("floups");
		});
	});
});

describe("up", function() {

	describe("after and up", function() {
		var func = decompose()
			.after(function(arg) {
				return arg / 3;
			});

		var f = decompose.up(function(arg) {
			return arg + 5;
		}, func);


		var res = f(7);
		it("should", function() {
			expect(res).to.equal(4);
		});
	});

	describe("before and up", function() {
		var func = decompose()
			.before(function(arg) {
				return arg / 3;
			});

		var f = decompose.up(function(arg) {
			return arg + 5;
		}, func);


		var res = f(9);
		it("should", function() {
			expect(res).to.equal(8);
		});
	});

	describe("around and up", function() {
		var func = decompose()
			.around(function(sup) {
				return function(arg) {
					return sup.call(this, arg + 5) * 2;
				};
			})

		var f = decompose.up(function(arg) {
			return arg / 3;
		}, func);


		var res = f(7);
		it("should", function() {
			expect(res).to.equal(8);
		});
	});

	describe("fail and up", function() {
		var func = decompose()
			.fail(function(error) {
				return error.message + " - through fail";
			});
		var f = decompose.up(function(arg) {
			return new Error("bloups : " + arg);
		}, func);
		var res = f("zoo");
		it("should", function() {
			expect(res).to.equal("bloups : zoo - through fail");
		});
	});

	describe("up func on top ommit under", function() {
		var m = function(arg) {
			return arg + "-alone"
		};
		var f = decompose.up(decompose()
			.after(function(arg) {
				return arg + "-after";
			}), m);
		var res = f("zoo");
		it("should", function() {
			expect(res).to.equal("zoo-alone");
			expect(m).to.equal(f);
		});
	});
	describe("up more than 2 arguments", function() {
		var m = function(arg) {
			return arg + "-alone"
		};
		var f = decompose.up(m, decompose()
			.after(function(arg) {
				return arg + "-after";
			}), decompose().before(function(arg) {
				return arg + "-before"
			}));
		var res = f("zoo");
		it("should", function() {
			expect(res).to.equal("zoo-before-alone-after");
		});
	});
});

describe("bottom", function() {

	describe("after and bottom", function() {
		var func = decompose()
			.after(function(arg) {
				return arg / 3;
			});

		var f = decompose.bottom(function(arg) {
			return arg + 5;
		}, func);

		var res = f(7);
		it("should", function() {
			expect(res).to.equal(4);
		});
	});

	describe("before and bottom", function() {
		var func = decompose()
			.before(function(arg) {
				return arg / 3;
			});

		var f = decompose.bottom(function(arg) {
			return arg + 5;
		}, func);

		var res = f(9);
		it("should", function() {
			expect(res).to.equal(8);
		});
	});

	describe("around and bottom", function() {
		var func = decompose()
			.around(function(sup) {
				return function(arg) {
					return sup.call(this, arg + 5) * 2;
				};
			})

		var f = decompose.bottom(function(arg) {
			return arg / 3;
		}, func);

		var res = f(7);
		it("should", function() {
			expect(res).to.equal(8);
		});
	});

	describe("fail and bottom", function() {
		var func = decompose()
			.fail(function(error) {
				return error.message + " - through fail";
			});
		var f = decompose.bottom(function(arg) {
			return new Error("bloups : " + arg);
		}, func);
		var res = f("zoo");
		it("should", function() {
			expect(res).to.equal("bloups : zoo - through fail");
		});
	});
	describe("bottom func on top ommit under", function() {
		var m = function(arg) {
			return arg + "-alone"
		};
		var f = decompose.bottom(decompose()
			.after(function(arg) {
				return arg + "-after";
			}), m);
		var res = f("zoo");
		it("should", function() {
			expect(res).to.equal("zoo-alone");
			expect(m).to.equal(f);
		});
	});
	describe("bottom more than 2 arguments", function() {
		var m = function(arg) {
			return arg + "-alone"
		};
		var f = decompose.bottom(m, decompose()
			.after(function(arg) {
				return arg + "-after";
			}), decompose().before(function(arg) {
				return arg + "-before"
			}));
		var res = f("zoo");
		it("should", function() {
			expect(res).to.equal("zoo-before-alone-after");
		});
	});
});

describe("compile", function() {

	describe("after and compile", function() {
		var func = decompose()
			.after(function(arg) {
				return arg / 3;
			});

		var f = decompose.compile(function(arg) {
			return arg + 5;
		}, func);


		var res = f(7);
		it("should", function() {
			expect(res).to.equal(4);
		});
	});

	describe("before and compile", function() {
		var func = decompose()
			.before(function(arg) {
				return arg / 3;
			});

		var f = decompose.compile(function(arg) {
			return arg + 5;
		}, func);


		var res = f(9);
		it("should", function() {
			expect(res).to.equal(8);
		});
	});

	describe("around and compile", function() {
		var func = decompose()
			.around(function(sup) {
				return function(arg) {
					return sup.call(this, arg + 5) * 2;
				};
			})

		var f = decompose.compile(function(arg) {
			return arg / 3;
		}, func);


		var res = f(7);
		it("should", function() {
			expect(res).to.equal(8);
		});
	});

	describe("fail and compile", function() {
		var func = decompose()
			.fail(function(error) {
				return error.message + " - through fail";
			});
		var f = decompose.compile(function(arg) {
			return new Error("bloups : " + arg);
		}, func);
		var res = f("zoo");
		it("should", function() {
			expect(res).to.equal("bloups : zoo - through fail");
		});
	});

	describe("compile func on top ommit under", function() {
		var m = function(arg) {
			return arg + "-alone"
		};
		var f = decompose.compile(decompose()
			.after(function(arg) {
				return arg + "-after";
			}), m);
		var res = f("zoo");
		it("should", function() {
			expect(res).to.equal("zoo-alone");
			expect(m).to.equal(f);
		});
	});
	describe("compile more than 2 arguments", function() {
		var m = function(arg) {
			return arg + "-alone"
		};
		var f = decompose.compile(m, decompose()
			.after(function(arg) {
				return arg + "-after";
			}), decompose().before(function(arg) {
				return arg + "-before"
			}));
		var res = f("zoo");
		it("should", function() {
			expect(res).to.equal("zoo-before-alone-after");
		});
	});
	describe("extendsObjectWithObject 1", function() {

		var obj = {
			test: decompose().after(function(arg) {
				// do something
				return "hello " + arg;
			})
		};
		// obj.test is callable and work as a standard function

		var obj2 = {
			test: function(arg) {
				// do something else
				return arg + " world";
			}
		};

		// both obj and obj2 are workable instance. But as obj contains (de)composition, it could be used as model for other objects.
		function extendsObjectWithObject(object, model) {
			// (if you want tools that do that nicely for you (and manymore) you should try deep-compiler)
			for (var i in model)
				object[i] = decompose.up(object[i], model[i]);
		}

		extendsObjectWithObject(obj2, obj);

		var r1 = obj.test("composition"); // return "hello composition"
		var r2 = obj2.test("composition"); // return "hello composition world"
		it("should", function() {
			expect(r1).to.equal("hello composition");
			expect(r2).to.equal("hello composition world");
		});
	});
	describe("extendsObjectWithObject 2", function() {

		var obj = {
			test: decompose().after(function(arg) {
				// do something
				return "hello " + arg;
			}),
			bloupi: decompose().before(function(arg) {
				return arg + " rocks!"
			})
		};
		// obj.test is callable and work as a standard function

		var obj2 = {
			test: function(arg) {
				// do something else
				return arg + " world";
			}
		};

		// both obj and obj2 are workable instance. But as obj contains (de)composition, it could be used as model for other objects.
		function extendsObjectWithObject(object, model) {
			// (if you want tools that do that nicely for you (and manymore) you should try deep-compiler)
			for (var i in model)
				object[i] = decompose.up(object[i], model[i]);
		}

		extendsObjectWithObject(obj2, obj);

		var r1 = obj.test("composition"); // return "hello composition"
		var r2 = obj2.test("composition"); // return "hello composition world"
		var r3 = obj2.bloupi("composition"); // return "composition rocks!"
		it("should", function() {
			expect(r1).to.equal("hello composition");
			expect(r2).to.equal("hello composition world");
			expect(r3).to.equal("composition rocks!");
		});
	});
});



describe("wrap start", function() {
	describe("wrap decompose", function() {
		var m = function(arg) {
			return arg + "-alone"
		};
		var f = decompose(decompose(m).after(function(arg) {
				return arg + "-after";
			}))
			.before(function(arg) {
				return arg + "-before"
			});
		var res = f("zoo");
		it("should", function() {
			expect(res).to.equal("zoo-before-alone-after");
		});
	});
});



describe("custom Composer", function() {

	describe("composer api : after", function() {
		var composer = decompose.Composer({
			foo: function(decoration) {
				return this.after(function(arg) {
					return arg + " - foo" + decoration;
				});
			}
		});

		var func = composer(function(arg) {
				return arg + " - func";
			})
			.foo(" - zoo");
		var res = func("bar")
		it("should", function() {
			expect(res).to.equal("bar - func - foo - zoo");
		});
	});

	describe("composer api : before", function() {
		var composer = decompose.Composer({
			foo: function(decoration) {
				return this.before(function(arg) {
					return arg + " - foo" + decoration;
				});
			}
		});

		var func = composer(function(arg) {
				return arg + " - func";
			})
			.foo(" - zoo")
		var res = func("bar")
		it("should", function() {
			expect(res).to.equal("bar - foo - zoo - func");
		});
	});

	describe("composer api : around", function() {
		var composer = decompose.Composer({
			foo: function(decoration) {
				return this.around(function(sup) {
					return function(arg) {
						return sup.call(this, arg + " - foo") + decoration;
					};
				});
			}
		});
		var func = composer(function(arg) {
				return arg + " - func";
			})
			.foo(" - zoo")
		var res = func("bar")
		it("should", function() {
			expect(res).to.equal("bar - foo - func - zoo");
		});
	});

	describe("composer api : fail", function() {
		var composer = decompose.Composer({
			foo: function(decoration) {
				return this.fail(function(error) {
					return error.message + " - recup" + decoration;
				});
			}
		});

		var func = composer(function(arg) {
				return new Error(arg + " - func");
			})
			.foo(" - zoo")
		var res = func("bar")
		it("should", function() {
			expect(res).to.equal("bar - func - recup - zoo");
		});
	});
	describe("composer api : promise like delay with undefined resolved", function() {
		var composer = decompose.Composer({
			delay: function(ms) {
				return this.after(function() {
					return new FakePromise().resolveWithDelay(undefined, ms);
				});
			}
		});

		var res;
		before(function(done) {
			var func = composer(function(arg) {
					return arg + "-func";
				})
				.delay(2)
				.after(function(arg) {
					res = arg + "-zoo";
					done();
				});
			func("bar");
		});

		it("should", function() {
			expect(res).to.equal("bar-func-zoo");
		});
	});
	describe("composer api : promise like double delay with undefined resolved", function() {
		var composer = decompose.Composer({
			delay: function(ms) {
				return this.after(function() {
					return new FakePromise().resolveWithDelay(undefined, ms);
				});
			}
		});

		var res;
		before(function(done) {
			var func = composer(function(arg) {
					return arg + "-func";
				})
				.delay(2)
				.after(function(arg) {
					res = arg + "-zoo";
					done();
				});
			func("bar");
		});

		it("should", function() {
			expect(res).to.equal("bar-func-zoo");
		});
	});
	describe("composer api : promise like delay with value resolved", function() {
		var composer = decompose.Composer({
			delay: function(ms) {
				return this.after(function(arg) {
					return new FakePromise().resolveWithDelay(arg + "-resolved", ms);
				});
			}
		});

		var res;
		before(function(done) {
			var func = composer(function(arg) {
					return arg + "-func";
				})
				.delay(2)
				.after(function(arg) {
					res = arg + "-zoo";
					done();
				});
			func("bar");
		});

		it("should", function() {
			expect(res).to.equal("bar-func-resolved-zoo");
		});
	});

});