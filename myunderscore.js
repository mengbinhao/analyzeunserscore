/**
 * similator underscore framework
 * 1 support function style invoke 
 *      eg : _.map(arr, callback)
 * 2 support object style incoke 
 *      eg : _([1,2,3]).map(callback)
 */
(function () {
  //'window' in the server, 'global' on the server
  var root = this;
  // Save the previous value of the `_` variable.
  var previousUnderscore = root._;

  var ArrayProto = Array.prototype, ObjProto = Object.prototype, FuncProto = Function.prototype;

  var
    push = ArrayProto.push,
    slice = ArrayProto.slice,
    toString = ObjProto.toString,
    hasOwnProperty = ObjProto.hasOwnProperty;

  var
    nativeIsArray = Array.isArray,
    nativeKeys = Object.keys,
    nativeBind = FuncProto.bind,
    nativeCreate = Object.create;

  var Ctor = function () { };

  //No new constructor
  //obj is used for object style invoke
  var _ = function (obj) {
    //in case called like _(new _())
    if (obj instanceof _) return obj;
    //avoid endless loop 
    if (!(this instanceof _)) return new _(obj);
    this._wrapped = obj;
  }

  _.VERSION = '0.0.1';

  _.map = function (arr, callback) {
    if (arr == undefined || callback == undefined) return;
    return Array.prototype.map.call(arr, callback);
  }

  //convert _'s attribute to array
  _.functions = function (obj) {
    var names = [];
    for (var key in obj) {
      if (_.isFunction(obj[key])) {
        names.push(key);
      }
    }
    return names.sort();
  }

  //return an array of key
  _.keys = function (obj) {
    if (!_.isObject(obj)) return [];
    if (nativeKeys) return nativeKeys(obj);
    var keys = [];
    for (var key in obj) if (_.has(obj, key)) keys.push(key);
    // IE < 9.
    if (hasEnumBug) collectNonEnumProps(obj, keys);
    return keys;
  };

  _.allKeys = function (obj) {
    if (!_.isObject(obj)) return [];
    var keys = [];
    for (var key in obj) keys.push(key);
    // IE < 9.
    if (hasEnumBug) collectNonEnumProps(obj, keys);
    return keys;
  };

  // An internal function for creating assigner functions.
  var createAssigner = function (keysFunc, undefinedOnly) {
    return function (obj) {
      //_.extend([1,2,3])
      var length = arguments.length;
      if (length < 2 || obj == null) return obj;
      for (var index = 1; index < length; index++) {
        var source = arguments[index],
          keys = keysFunc(source),
          l = keys.length;
        for (var i = 0; i < l; i++) {
          var key = keys[i];
          if (!undefinedOnly || obj[key] === void 0) obj[key] = source[key];
        }
      }
      return obj;
    };
  };
  // Extend a given object with all the properties in passed-in object(s).
  _.extend = createAssigner(_.allKeys);

  // Assigns a given object with all the own properties in the passed-in object(s)
  _.extendOwn = createAssigner(_.keys);

  _.defaults = createAssigner(_.allKeys, true);

  // Fill in a given object with default properties.
  _.each = function (keys, callback) {
    //tode ::  need check parameter type
    if (keys) {
      for (var i = 0; i < keys.length; i++) {
        callback.call(keys[i], keys[i]);
      }
    }
  }

  //get obj's property
  var property = function (key) {
    return function (obj) {
      return obj == null ? void 0 : obj[key];
    };
  };

  _.property = property;

  var MAX_ARRAY_INDEX = Math.pow(2, 53) - 1;
  var getLength = property('length');
  var isArrayLike = function (collection) {
    var length = getLength(collection);
    return typeof length == 'number' && length >= 0 && length <= MAX_ARRAY_INDEX;
  };

  var hasEnumBug = !{ toString: null }.propertyIsEnumerable('toString');
  var nonEnumerableProps = ['valueOf', 'isPrototypeOf', 'toString',
    'propertyIsEnumerable', 'hasOwnProperty', 'toLocaleString'];

  function collectNonEnumProps(obj, keys) {
    var nonEnumIdx = nonEnumerableProps.length;
    var constructor = obj.constructor;
    var proto = (_.isFunction(constructor) && constructor.prototype) || ObjProto;

    // Constructor is a special case.
    var prop = 'constructor';
    if (_.has(obj, prop) && !_.contains(keys, prop)) keys.push(prop);

    while (nonEnumIdx--) {
      prop = nonEnumerableProps[nonEnumIdx];
      if (prop in obj && obj[prop] !== proto[prop] && !_.contains(keys, prop)) {
        keys.push(prop);
      }
    }
  }

  // Determine if the array or object contains a given item (using `===`).
  _.contains = function (obj, item, fromIndex, guard) {
    if (!isArrayLike(obj)) obj = _.values(obj);
    if (typeof fromIndex != 'number' || guard) fromIndex = 0;
    return _.indexOf(obj, item, fromIndex) >= 0;
  };

  _.indexOf = createIndexFinder(1, _.findIndex, _.sortedIndex);

  // Generator function to create the indexOf and lastIndexOf functions
  function createIndexFinder(dir, predicateFind, sortedIndex) {
    return function (array, item, idx) {
      var i = 0, length = getLength(array);
      if (typeof idx == 'number') {
        if (dir > 0) {
          i = idx >= 0 ? idx : Math.max(idx + length, i);
        } else {
          length = idx >= 0 ? Math.min(idx + 1, length) : idx + length + 1;
        }
      } else if (sortedIndex && idx && length) {
        idx = sortedIndex(array, item);
        return array[idx] === item ? idx : -1;
      }
      if (item !== item) {
        idx = predicateFind(slice.call(array, i, length), _.isNaN);
        return idx >= 0 ? idx + i : -1;
      }
      for (idx = dir > 0 ? i : length - 1; idx >= 0 && idx < length; idx += dir) {
        if (array[idx] === item) return idx;
      }
      return -1;
    };
  }

  // Internal recursive comparison function for `isEqual`.
  var eq = function (a, b, aStack, bStack) {
    // Identical objects are equal. `0 === -0`, but they aren't identical.
    if (a === b) return a !== 0 || 1 / a === 1 / b;
    // A strict comparison is necessary because `null == undefined`.
    if (a == null || b == null) return a === b;
    // Unwrap any wrapped objects.
    if (a instanceof _) a = a._wrapped;
    if (b instanceof _) b = b._wrapped;
    // Compare `[[Class]]` names.
    var className = toString.call(a);
    if (className !== toString.call(b)) return false;
    switch (className) {
      // Strings, numbers, regular expressions, dates, and booleans are compared by value.
      case '[object RegExp]':
      // RegExps are coerced to strings for comparison (Note: '' + /a/i === '/a/i')
      case '[object String]':
        // Primitives and their corresponding object wrappers are equivalent; thus, `"5"` is
        // equivalent to `new String("5")`.
        return '' + a === '' + b;
      case '[object Number]':
        // for NaN
        if (+a !== +a) return +b !== +b;
        // An `egal` comparison is performed for other numeric values.
        return +a === 0 ? 1 / +a === 1 / b : +a === +b;
      case '[object Date]':
      case '[object Boolean]':
        // Coerce dates and booleans to numeric primitive values. Dates are compared by their
        // millisecond representations. Note that invalid dates with millisecond representations
        // of `NaN` are not equivalent.
        return +a === +b;
    }

    var areArrays = className === '[object Array]';
    if (!areArrays) {
      if (typeof a != 'object' || typeof b != 'object') return false;

      // Objects with different constructors are not equivalent, but `Object`s or `Array`s
      // from different frames are.
      var aCtor = a.constructor, bCtor = b.constructor;
      if (aCtor !== bCtor && !(_.isFunction(aCtor) && aCtor instanceof aCtor &&
        _.isFunction(bCtor) && bCtor instanceof bCtor)
        && ('constructor' in a && 'constructor' in b)) {
        return false;
      }
    }
    // Assume equality for cyclic structures. The algorithm for detecting cyclic
    // structures is adapted from ES 5.1 section 15.12.3, abstract operation `JO`.

    // Initializing stack of traversed objects.
    // It's done here since we only need them for objects and arrays comparison.
    aStack = aStack || [];
    bStack = bStack || [];
    var length = aStack.length;
    while (length--) {
      // Linear search. Performance is inversely proportional to the number of
      // unique nested structures.
      if (aStack[length] === a) return bStack[length] === b;
    }

    // Add the first object to the stack of traversed objects.
    aStack.push(a);
    bStack.push(b);

    // Recursively compare objects and arrays.
    if (areArrays) {
      // Compare array lengths to determine if a deep comparison is necessary.
      length = a.length;
      if (length !== b.length) return false;
      // Deep compare the contents, ignoring non-numeric properties.
      while (length--) {
        if (!eq(a[length], b[length], aStack, bStack)) return false;
      }
    } else {
      // Deep compare objects.
      var keys = _.keys(a), key;
      length = keys.length;
      // Ensure that both objects contain the same number of properties before comparing deep equality.
      if (_.keys(b).length !== length) return false;
      while (length--) {
        // Deep compare each member
        key = keys[length];
        if (!(_.has(b, key) && eq(a[key], b[key], aStack, bStack))) return false;
      }
    }
    // Remove the first object from the stack of traversed objects.
    aStack.pop();
    bStack.pop();
    return true;
  };

  // Perform a deep comparison to check if two objects are equal.
  _.isEqual = function (a, b) {
    return eq(a, b);
  };

  // An "empty" object has no enumerable own-properties.
  _.isEmpty = function (obj) {
    if (obj == null) return true;
    if (isArrayLike(obj) && (_.isArray(obj) || _.isString(obj) || _.isArguments(obj))) return obj.length === 0;
    return _.keys(obj).length === 0;
  };

  _.isElement = function (obj) {
    //force convert to boolean
    return !!(obj && obj.nodeType === 1);
  };

  // Delegates to ECMA5's native Array.isArray
  _.isArray = nativeIsArray || function (obj) {
    return toString.call(obj) === '[object Array]';
  };

  //use typeof operation exclude null.
  _.isObject = function (obj) {
    var type = typeof obj;
    return type === 'function' || type === 'object' && !!obj;
  };

  // Add some isType methods: isArguments, isFunction, isString, isNumber, isDate, isRegExp, isError.
  _.each(['Arguments', 'Function', 'String', 'Number', 'Date', 'RegExp', 'Error'], function (name) {
    _['is' + name] = function (obj) {
      return toString.call(obj) === '[object ' + name + ']';
    };
  });

  // hack IE < 9
  if (!_.isArguments(arguments)) {
    _.isArguments = function (obj) {
      return _.has(obj, 'callee');
    };
  }

  // Optimize `isFunction` if appropriate. Work around some typeof bugs in old v8,
  // IE 11 (#1621), and in Safari 8 (#1929).
  if (typeof /./ != 'function' && typeof Int8Array != 'object') {
    _.isFunction = function (obj) {
      return typeof obj == 'function' || false;
    };
  }

  _.isFinite = function (obj) {
    return isFinite(obj) && !isNaN(parseFloat(obj));
  };

  //NaN === NaN is false
  _.isNaN = function (obj) {
    return _.isNumber(obj) && obj !== +obj;
  };

  _.isBoolean = function (obj) {
    return obj === true || obj === false || toString.call(obj) === '[object Boolean]';
  };

  _.isNull = function (obj) {
    return obj === null;
  };

  _.isUndefined = function (obj) {
    return obj === void 0;
  };

  // check if obj has key property, not on its prototype
  _.has = function (obj, key) {
    return obj != null && hasOwnProperty.call(obj, key);
  };

  _.unique = function (array, isSorted, callback) {
    var res = [];
    var seen;

    if (typeof isSorted !== "boolean") {
      callback = isSorted;
      isSorted = false;
    }

    for (var i = 0; i < array.length; i++) {
      var computed = callback ? callback(array[i]) : array[i];
      if (isSorted) {
        if (!i || seen !== computed) {
          res.push(computed);
        }
        seen = computed;
      } else if (res.indexOf(computed) === -1) {
        res.push(computed);
      }
    }
    return res;
  };

  //chain function
  _.chain = function (obj) {
    //get a _ with _wrapped
    var instance = _(obj);
    instance._chain = true;
    return instance;
  };

  //delegates ES5's Object.keys
  _.values = function (obj) {
    var keys = _.keys(obj);
    var length = keys.length;
    var values = Array(length);
    for (var i = 0; i < length; i++) {
      values[i] = obj[keys[i]];
    }
    return values;
  };

  //use by array original method
  //return an instance with _wrapped or not
  var result = function (instance, obj) {
    return instance._chain ? _(obj).chain() : obj;
  };

  //core thoughts!!!!!!!!!!!!!!
  //add _'s method to _'s prototype, so instance object of _ has _'s method
  _.mixin = function (obj) {
    _.each(_.functions(obj), function (key) {
      var func = obj[key];
      //add _'s method to _'s prototype
      _.prototype[key] = function () {
        //arg is _'s wrapper
        var args = [this._wrapped];
        //combine args 
        Array.prototype.push.apply(args, arguments);
        //this is _ with its wrapper
        return result(this, func.apply(_, args));
      }
    });
  }

  //core thoughts!!!!!!!!!!!!!!
  _.mixin(_);

  _.each(['pop', 'push', 'reverse', 'shift', 'sort', 'splice', 'unshift'], function (name) {
    var method = ArrayProto[name];
    _.prototype[name] = function () {
      var obj = this._wrapped;
      method.apply(obj, arguments);
      // why add an if condition?????
      if ((name === 'shift' || name === 'splice') && obj.length === 0) delete obj[0];
      return result(this, obj);
    };
  });

  // Add all accessor Array functions to the wrapper.
  _.each(['concat', 'join', 'slice'], function (name) {
    var method = ArrayProto[name];
    _.prototype[name] = function () {
      return result(this, method.apply(this._wrapped, arguments));
    };
  });

  // Extracts the result from a wrapped and chained object.
  _.prototype.value = function () {
    return this._wrapped;
  };

  //export _ object for Node.js
  //add _ to browser or server
  if (typeof exports !== 'undefined') {
    if (typeof module !== "undefined" && module.exports) {
      exports = module.exports = _;
    }
    exports._ = _;
  } else {
    root._ = _;
  }

  //AMD
  if (typeof define === "function" && define.amd) {
    define("underscore", [], function () {
      return _;
    });
  }
  //Note : in some cases, this == undefind  like use strict
}.call(this));


//console.log(_(new _()));
// console.log(_.map([1, 2, 3], function (item) {
//   return item + 1;
// }));
// console.log(_([1, 2, 3]).map(function (item) {
//   return item + 1;
// }));


// console.log(_.unique([1, 2, 3, 3, 3, 4, 4, 5, "a", "A"], function (item) {
//   return typeof item === "string" ? item.toLowerCase() : item;
// }));
// console.log(_([1, 2, 3, 3, 3, 4, 4, 5, "a", "A"]).unique(function (item) {
//   return typeof item === "string" ? item.toLowerCase() : item;
// }));