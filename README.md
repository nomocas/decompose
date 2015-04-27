# decompose

## Javascript Functions/Aspects Forge.

Functions/Aspects (de)composition tools which produce standard functions usable anywhere in your js.

It is :

- lightweight (3.6 Ko minified, 1.2 Ko minified/gzipped) 
- fast
- chainable
- lazzy (re)compiled with compilation cache
- easily customisable
- working browser and server side
- deep.ocm compliant

It takes benefits from Promise pipelining pattern by :

- gathering function decorator aspects semantic (before, around, after) and Promise specific keywords (done, fail, always).
- managing transparently any promise/thenable returned from composed functions

Inspired from https://github.com/kriszyp/compose aspect's decorators.
Extracted from [deepjs](https://github.com/deepjs/deepjs) core lib.

## Install

```
> git clone https://github.com/nomocas/decompose.git
```

or

```
> npm install decompose
```

or 

```
> bower install decompose
```

## Examples

###  before + base + after
```javascript
	var compose = require("decompose");
	
	var myFunc = compose(function(msg){
		return msg.toLowerCase();
	})
	.before(function(msg){
		return "YOU SAY : " + msg;
	})
	.after(function(msg){
		return "<b>" + msg + "</b>";
	});

	var result = myFunc("HELLO WORLD"); // return :<b>you say : hello world</b>
```

### around + before + promise + fail
```javascript
	var compose = require("decompose"),
		request = require("request-promise"); // promise based http.request (npm i request-promise)
	
	var myFunc = compose(function(info){
		return {
			title:"hello world",
			info: info
		};
	})
	.around(function(sup){
		return function(info){
			info.something = true;
			var result = sup.call(this, info); // return { title:"hello world", info:{ ... } }
			result.decorated = true;
			return result;
		};
	})
	.before(function(path){
		return request(path);   // return a promise that will be resolved with loaded object.
		// resolved object will be injected as argument in next composed function.
	})
	.fail(function(error){
		// error is : any error throwned or returned (or injected from a promise) by a previously composed function.
		// think about promise pattern.
	});
	
	myFunc("/path/to/info.json")
	.then(function(result){
		// result = { title:"hello world", info:{...}, decorated:true }
	});
```

## API

### .after(fn)

```javascript
var myFunc = decompose(function(arg){
	return arg + " should decompose";
})
.after(function(arg){
	return arg + " functions";
});

var result = myFunc("you"); // you should decompose functions
```

### .before(fn)

```javascript
var myFunc = decompose(function(arg){
	return arg + " should decompose";
})
.before(function(arg){
	return arg + " functions";
});

// Yoda style :
var result = myFunc("your"); // your functions should decompose
```

### .around(fn)

```javascript
var myFunc = decompose(function(arg){
	return arg + " should decompose";
})
.around(function(sup){
	return function(arg){
		arg = "Really, " + arg;
		return sup.call(this, arg) + " functions";
	};
});

var result = myFunc("you"); // Really, you should decompose functions
```

### .fail(fn)

```javascript
var myFunc = decompose(function(arg){
	return arg + " bitcoins";
})
.before(function(arg){
	if(arg < 10)
		return new Error("not enough!");
	return arg;
})
.fail(function(error){
	console.error("something is wrong : ", error);
});

myFunc(8); // print error : "something is wrong : not enough!" and return the error
myFunc(12); // return "12 bitcoins"
```

Thrown errors are catched :

```javascript
var myFunc = decompose(function(arg){
	return arg + " bitcoins";
})
.before(function(arg){
	if(arg < 10)
		throw new Error("not enough!");
	return arg;
})
.fail(function(error){
	console.error("something is wrong : ", error);
});

var result = myFunc(8); // print error
```

You could recover the error by returning something that is not an Error from fail handlers :

```javascript
var myFunc = decompose(function(arg){
	return arg + " bitcoins";
})
.before(function(arg){
	if(arg < 10)
		throw new Error("405");
	if(arg < 20)
		throw new Error("406");
	return arg;
})
.fail(function(error){
	if(error.message == "406")
		return "please give more.";
});

var result = myFunc(8); // return error ("405")
var result2 = myFunc(15); // return "please give more."
var result3 = myFunc(25); // return "25 bitcoins"
```

### .always(fn)

Sugar for `.after(fn).fail(fn)`

### .done(fn)

Alias for `.after(fn)`

Just there to be compliant with Promise API. It helps to use directly Promise API in composer. (see customisation)

### Arguments management

Aside from .around(), every composed functions are wired together.
It means that, in compiled order, the return of the previous function is injected as FIRST argument of the next one.

```javascript

var func = decompose(function(arg1, arg2){
	return arg1 + " - " + arg2;
})
.after(function(arg){
	return arg + " - after";
});

var result = func("hello", "world"); // hello - world - after

```

__Except in two cases :__

#### return undefined (or return omission)

When you omit to return something (or you return undefined which is the same result) in a composed function, the arguments are kept and reinjected into next function.

```javascript

var func = decompose(function(arg){
	arg.seenInBaseFunction = true;
})
.after(function(arg){
	arg.seenInAfterFunction = true;
});

var myObject = {};
func(myObject);

// myObject : { seenInBaseFunction: true, seenInAfterFunction: true }

```

It works even with multiple arguments :

```javascript

var func = decompose(function(arg1, arg2){
	arg1.foo = true;
	arg2.bar = true;
})
.after(function(arg1, arg2){
	arg1.zoo = true;
	arg2.lollipop = true;
});

var myObject1 = {};
var myObject2 = {};

func(myObject1, myObject2);

// myObject1 : { foo: true, zoo: true }
// myObject2 : { bar: true, lollipop: true }

```

It has the drawback that there is no way to force undefined return (for the moment) if any composed functions return something.

#### force multiple arguments

When you want to force multiple arguments, simply return a `decompose.Arguments([arg1, arg2, ...])` :

```javascript 
var func = decompose(function(arg1, arg2){
	return arg1 + " x " + arg2;
})
.before(function(arg){
	return decompose.Arguments([arg + " & apples", 12]);
});
```

var result = func("bananas"); // bananas & apples x 12

### As Aspects

Until now, every previous example was wrapping a first function with others (with after, before, around or fail).
In that case, the returned composition is fulfilled and it could not be used anymore as relevant function model/aspects.

So. First, when you start a (de)composition with no arguments, you also obtain an absolutly standard and callable js function :

```javascript
var func = decompose() // No base function
.after(function(arg){
	return "hello " + arg;
})
.before(function(arg){
	return arg[0].toUpperCase() + arg.substring(1);
});

var result = func("world"); // return "hello World"
```

It allow you to :

- use it as this (as above)
- fulfill it later
- or to use it as model/aspect for other functions/compositions

So, what does all this mean...

#### decompose.compile()

Merge, from left to right, bunch of functions together (and so compositions because compositions are standard functions) and return the result function without modifying any of provided compositions.

```javascript
var aFunctionAspect = decompose()
.around(function(sup){
	return function(arg){
		return sup.call(this, arg + " be Good.").toLowerCase();
	};
}); 

var anotherAspect = decompose()
.after(function(arg){ 
	return "<b>" + arg + "</b>";
});

var aFunction = function(arg){
	return "Hello " + arg; 
};

var resultFunction = decompose.compile(aFunction, aFunctionAspect, anotherAspect);

var r = resultFunction("Johnny"); // return "<b>hello johnny be good.</b>"
```

#### decompose.up()

Same thing but modify the first argument.

```javascript
var aFunctionAspect = decompose()
.around(function(sup){
	return function(arg){
		return sup.call(this, arg + " be Good.").toLowerCase();
	};
});

var anotherAspect = decompose()
.after(function(arg){ 
	return "<b>" + arg + "</b>";
});

// note the difference
decompose.up(aFunctionAspect, anotherAspect);

var r = aFunctionAspect("Johnny"); // return "<b>johnny be good.</b>"
```

#### decompose.bottom()

Same thing but modify the last argument.

```javascript
var aFunctionAspect = decompose()
.around(function(sup){
	return function(arg){
		return sup.call(this, arg + " be Good.").toLowerCase();
	};
});

var anotherAspect = decompose()
.after(function(arg){ 
	return "<b>" + arg + "</b>";
});

// note the difference
decompose.bottom(aFunctionAspect, anotherAspect);

var r = anotherAspect("Johnny"); // return "<b>johnny be good.</b>"
```

### Custom Composer

You could extend decompose API by creating a `decompose.Composer` this way : 

```javascript
var myComposer = decompose.Composer({
	// additional API to allow on compositions
	foo: function(arg){
		return this.before(function(arg){
			return arg[0].toUpperCase() + arg.substring(1);
		})
		.after(function(arg){
			return "hello " + arg;
		});
	}
});

var func = myComposer(function(arg){
	return arg + " Doe";
})
.foo()
.after(function(arg){
	return "<b>" + arg + "</b>";
});

var result = func("john"); // return "<b>hello John Doe</b>"
```

### Promise compliance

You could return any Promise/Thenable from within composed functions, decompose will wait resolution/rejection before injecting result in next handler (or error in first fail in stack).

### deep-ocm compliance

It check any _deep_ocm_ flag (deep-ocm boilerplate) on composed functions, and resolve it before each usage. if ocm return null : skip function.

### Advanced usage

#### Hand Compilation

## Tests

### Under nodejs

You need to have mocha installed globally before launching test. 
```
> npm install -g mocha
```
Do not forget to install dev-dependencies. i.e. : from 'decompose' folder, type :
```
> npm install
```

then, always in 'decompose' folder simply enter :
```
> mocha
```

### In the browser

Simply serve ./test folder in you favorite web server then open ./test/index.html.

You could use the provided "gulp web server" by entering :
```
> gulp serve-test
```

## Licence

The [MIT](http://opensource.org/licenses/MIT) License

Copyright (c) 2015 Gilles Coomans <gilles.coomans@gmail.com>

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the 'Software'), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
