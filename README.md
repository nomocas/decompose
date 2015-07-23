# decompose

Extracted from [deepjs](https://github.com/deepjs/deepjs) core lib.

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
- absolutly non-obstrusive
- incredibly powerful

It takes benefits from Promise pipelining pattern by :

- gathering function decorator aspects semantic (before, around, after) and Promise specific keywords (done, fail, always).
- managing transparently any promise/thenable returned from composed functions

Inspired from https://github.com/kriszyp/compose aspect's decorators.

## Content

- [install](#install)
- [usage](#usage)
- [examples](#examples)
- [API](#api)
	- [after](#after)
	- [before](#before)
	- [around](#around)
	- [fail](#fail)
	- [always](#always)
	- [done](#done)
- [arguments management](#arguments-management)
- [as aspects](#as-aspects)
- [custom composers](#custom-composer)
- [Promise compliance](#promise-compliance)
- [deep-ocm compliance](#deep-ocm-compliance)
- [advanced usage](#advanced-usage)
- [tests](#tests)


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

## Usage

You could either use it as an AMD module (requirejs, almond, ...) in your browser, or as a CommonJS module under nodejs, or by including the file directly in a script tag in your html page (decompose will be accessible in global window).

Requirejs : 
```javascript 
define(["require", "decompose"], function(require, decompose){
	// do something
});
```

Nodejs : 
```javascript 
var decompose = require("decompose");
// do something
```

Window global :
```html
<script src="/path/to/lib/decompose/dist/decompose.min.js"></script>
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

Just there to be compliant with Promise API. It helps to use directly Promise API in composer. (see [customisation](#custom-composer))

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

When you want to force multiple arguments, simply return `decompose.Arguments([arg1, arg2, ...])` :

```javascript 
var func = decompose(function(arg1, arg2){
	return arg1 + " x " + arg2;
})
.before(function(arg){
	return decompose.Arguments([arg + " & apples", 12]);
});

var result = func("bananas"); // bananas & apples x 12
```


### As Aspects

Until now, every previous example was wrapping a first function with others (with after, before, around or fail).
In that case, the returned composition is fulfilled and it could not be used anymore as relevant function model/aspects.
You could always add chained methods (after, before, ...) on it, but as it wraps a function at bottom of its stack, it could not be used as model anymore.

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
- fulfill it later (see further)
- use it as model/aspect for other functions/compositions

The idea is to allow inheritance and specialisation management by having functions in objects/prototypes that could be applied together.

```javascript
var obj = {
	foo: decompose().after(function(arg){
		// do something
		return "hello " + arg;
	}),
	bar: decompose().before(function(arg) {
		return arg + " rocks!"
	})
};
// obj.foo and obj.bar are callable and work as a standard functions

var obj2 = {
	foo: function(arg){
		// do something else
		return arg + " world";
	}
};

// both obj and obj2 are workable instance.
// But as obj contains (de)compositions, it could be used as model for other objects.
function extendsObjectWithObject(object, model){
	// (if you want tools that do that nicely for you (and manymore) you should try deep-compiler)
	for(var i in model)
		object[i] = decompose.up(object[i], model[i]);
}

extendsObjectWithObject(obj2, obj);  // of course you could do it with prototypes... ;)

obj.foo("composition");  // return "hello composition"
obj2.foo("composition"); // return "hello composition world"
obj2.bar("composition"); // return "composition rocks!"
```


#### decompose.compile(arg1, arg2[, ...])

Merge (wire), from left to right, bunch of functions/compositions together and return the result function __without modifying__ any of provided compositions.

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
// as first argument is a function : resultFunction is fulfilled.

var r = resultFunction("Johnny"); // return "<b>hello johnny be good.</b>"
```

Note : when you introduce a pure function (not a composition) higher in "compilation" arguments list (either by providing it as argument of 'decompose' or by merge), it will hide any other function/composition lower in list.

```javascript
var aFunc = function(arg){ return "Hey! " + arg; };
var bFunc = decompose().after(function(arg){ return "Ho! " + arg; });
var cFunc = function(arg){ return "Wow! " + arg; };

var func = decompose.compile(aFunc, bFunc, cFunc);
// return cFunc. As cFunc is higher in stack : it hides any lower compo/functions.

func("AOP"); // return "Wow! AOP"
// only cFunc is fired
```

```javascript
var compo = decompose(function(arg){
	return arg + " world";
}).after(function(arg){
	return arg + " rules!";
});

var aFunc = function(arg){ return "Hey! " + arg; };

var func = decompose.compile(aFunc, compo);

func("AOP"); // "AOP world rules!"
// aFunc has been ignored
```


#### decompose.up(arg1, arg2[, ...])

Same thing but modify the first argument if it's a (de)composition.
Or if first argument is simple function (i.e. not a (de)composition), return new fulfilled composition.

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

```javascript
var aFunc = function(arg){ return "Hey! " + arg; };
var bFunc = decompose().after(function(arg){ return "Ho! " + arg; });
var cFunc = function(arg){ return "Wow! " + arg; };

var func = decompose.up(aFunc, bFunc, cFunc);
// return cFunc. As cFunc is higher in stack : it hides any lower compo/functions.

func("AOP"); // return "Wow! AOP"
// only cFunc is fired
```

```javascript
var compo = decompose().after(function(arg){
	return arg + " rules!";
});

var aFunc = function(arg){ return "Hey! " + arg; };
var bFunc = function(arg){ return "Wow! " + arg; };

// return a clone of compo that is fulfilled with bFunc. aFunc is ignored.
var func = decompose.up(aFunc, bFunc, compo); 

func("AOP"); // "Wow! AOP rules!"
// aFunc has been ignored
```
Note as result is a 'fulfilled' composition, you could always add chained methods (after, before, ...), but it could not be used anymore as model.

```javascript
var compo = decompose().after(function(arg){
	return arg + " rules!";
});
var aFunc = function(arg){ return "Wow! " + arg; };

// return a clone of compo that is fulfilled with aFunc.
var func = decompose.up(aFunc, compo); 

func("AOP"); // "Wow! AOP rules!"

func.after(function(arg){
	return "{ " + arg + " }"; 
});

var bFunc = function(arg){ return arg + " anything."; };

var func2 = decompose.up(bFunc, func);

func2("AOP") // "{ Wow! AOP rules! }"
// => bFunc has been ignored

```


#### decompose.bottom(arg1, arg2[, ...])

Same thing but modify the ___last___ argument.

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

```javascript
var aFunc = function(arg){ return "Hey! " + arg; };
var bFunc = decompose().after(function(arg){ return "Ho! " + arg; });
var cFunc = function(arg){ return "Wow! " + arg; };

var func = decompose.bottom(aFunc, bFunc, cFunc);  
// return cFunc. As cFunc is higher in stack : it hides any lower compo/functions.

func("AOP"); // return "Wow! AOP"
// only cFunc is fired
```

```javascript
var compo = decompose().after(function(arg){
	return arg + " rules!";
});

var aFunc = function(arg){ return "Hey! " + arg; };
var bFunc = function(arg){ return "Wow! " + arg; };

// return compo (not a clone) that is fulfilled with bFunc. aFunc is ignored.
decompose.bottom(aFunc, bFunc, compo); 

compo("AOP"); // "Wow! AOP rules!"
// aFunc has been ignored
```
Note as result is a 'fulfilled' composition, you could always add chained methods (after, before, ...), but it could not be used anymore as model.

```javascript
var compo = decompose().after(function(arg){
	return arg + " rules!";
});
var aFunc = function(arg){ return "Wow! " + arg; };

// return a clone of compo that is fulfilled with aFunc.
decompose.bottom(aFunc, compo); 

compo("AOP"); // "Wow! AOP rules!"

compo.after(function(arg){
	return "{ " + arg + " }"; 
});

var bFunc = function(arg){ return arg + " anything."; };

var func2 = decompose.bottom(bFunc, compo);

func2("AOP") // "{ Wow! AOP rules! }"
// => bFunc has been ignored

```


### Custom Composer

You could define your own extension of decompose API by creating a `Composer` this way : 

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

Example with request-promise (a simple nodejs http client that return a promise) : 

```javascript
var request = require("request-promise"); // npm i request-promise

var func = decompose(function(path){
	return request.get(path);
})
.after(function(loadedValue){
	return "<b>" + loadedValue + "</b>";
});

func("/my/path/to/file.json");
```

Note : it's equivalent to this : 
```javascript
var request = require("request-promise");

var func = decompose(request.get)
.after(function(loadedValue){
	return "<b>" + loadedValue + "</b>";
});

func("/my/path/to/file.json");
```

or this :
```javascript
var request = require("request-promise");

var func = decompose(function(loadedValue){
	return "<b>" + loadedValue + "</b>";
})
.before(request.get);

func("/my/path/to/file.json");
```

### deep-ocm compliance

It check any _deep_ocm_ flag (deep-ocm boilerplate) on composed functions, and resolve it before each usage. if ocm return null : skip function.

```javascript

var deep = require("deepjs/deep");

var myOcm = deep.ocm({
	admin:function(arg){
		// do something when admin
		return arg / 2;
	},
	registred:function(arg){
		// do something when registred user
		return arg + 5;
	},
	"public":null
}, { sensibleTo:["roles"] });


var func = decompose(function(arg){
	return arg + 10;
})
.after(myOcm);

deep.Modes("roles", "admin");
func(4); // return 7

deep.Modes("roles", "registred");
func(4); // return 19

deep.Modes("roles", "public");
func(4); // return 14

```

### Advanced usage

You should know that any composition will forge the effective underlaying function lazzily on first call, and cache the result for further calls.
Each time you modify a composition stack, the cached (forged) function is cleared and will be re-forged on next call.

#### Hand Compilation

If you want to force compilation and obtain the forged function directly (which is not a (de)composition anymore - i.e. no more chaining are allowed), simply invoke myComposition._forge();

```javascript

var compo = decompose(function(){
	// do something
})
.after(function(){
	// do something else
});

var forgedFunction = compo._forge();

// allowed :
forgedFunction();

// not allowed anymore :
forgedFunction.after(/*...*/);

```

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

## Todo

Introduce join-point : 

```javascript
var compo = decompose().joinPoint("myJoinPoint").after(/* func */).before(/* func */);

compo = decompose.up(compo, decompose().after(/* func */, "myJointPoint"));

//...
```

## Licence

The [MIT](http://opensource.org/licenses/MIT) License

Copyright (c) 2015 Gilles Coomans <gilles.coomans@gmail.com>

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the 'Software'), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
