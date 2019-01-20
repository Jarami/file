// полифилл для querySelectorAll и querySelector
// https://gist.github.com/chrisjlee/8960575
if (!document.querySelectorAll) {
  document.querySelectorAll = function (selectors) {
    var style = document.createElement('style'), elements = [], element;
    document.documentElement.firstChild.appendChild(style);
    document._qsa = [];

    style.styleSheet.cssText = selectors + '{x-qsa:expression(document._qsa && document._qsa.push(this))}';
    window.scrollBy(0, 0);
    style.parentNode.removeChild(style);

    while (document._qsa.length) {
      element = document._qsa.shift();
      element.style.removeAttribute('x-qsa');
      elements.push(element);
    }
    document._qsa = null;
    return elements;
  };
}
if (!document.querySelector) {
  document.querySelector = function (selectors) {
    var elements = document.querySelectorAll(selectors);
    return (elements.length) ? elements[0] : null;
  };
}


// Полифилл для ClassList
// Источник: https://gist.github.com/k-gun/c2ea7c49edf7b757fe9561ba37cb19ca
;(function() {
    // helpers
    var regExp = function(name) {
        return new RegExp('(^| )'+ name +'( |$)');
    };
    var forEach = function(list, fn, scope) {
        for (var i = 0; i < list.length; i++) {
            fn.call(scope, list[i]);
        }
    };

    // class list object with basic methods
    function ClassList(element) {
        this.element = element;
    }

    ClassList.prototype = {
        add: function() {
            forEach(arguments, function(name) {
                if (!this.contains(name)) {
                    this.element.className += ' '+ name;
                }
            }, this);
        },
        remove: function() {
            forEach(arguments, function(name) {
                this.element.className =
                    this.element.className.replace(regExp(name), '');
            }, this);
        },
        toggle: function(name) {
            return this.contains(name) 
                ? (this.remove(name), false) : (this.add(name), true);
        },
        contains: function(name) {
            return regExp(name).test(this.element.className);
        },
        // bonus..
        replace: function(oldName, newName) {
            this.remove(oldName), this.add(newName);
        }
    };

    // IE8/9, Safari
    if (window.Element && !('classList' in Element.prototype)) {
        Object.defineProperty(Element.prototype, 'classList', {
            get: function() {
                return new ClassList(this);
            }
        });
    }

    // replace() support for others
    if (window.DOMTokenList && DOMTokenList.prototype.replace == null) {
        DOMTokenList.prototype.replace = ClassList.prototype.replace;
    }
})();


// Полифилл для getElementsByClassName
// Limitation: only works with one class name
// Copyright: Eike Send http://eike.se/nd
if (!document.getElementsByClassName) {
  document.getElementsByClassName = function(search) {
    var d = document, elements, pattern, i, results = [];
    if (d.querySelectorAll) { // IE8
      return d.querySelectorAll("." + search);
    }
    if (d.evaluate) { // IE6, IE7
      pattern = ".//*[contains(concat(' ', @class, ' '), ' " + search + " ')]";
      elements = d.evaluate(pattern, d, null, 0, null);
      while ((i = elements.iterateNext())) {
        results.push(i);
      }
    } else {
      elements = d.getElementsByTagName("*");
      pattern = new RegExp("(^|\\s)" + search + "(\\s|$)");
      for (i = 0; i < elements.length; i++) {
        if ( pattern.test(elements[i].className) ) {
          results.push(elements[i]);
        }
      }
    }
    return results;
  }
}

// Полифилл для forEach
// Production steps of ECMA-262, Edition 5, 15.4.4.18
// Reference: http://es5.github.io/#x15.4.4.18
if (!Array.prototype.forEach) {
  Array.prototype.forEach = function(callback/*, thisArg*/) {
    var T, k;
    if (this == null) throw new TypeError('this is null or not defined');
    var O = Object(this);
    var len = O.length >>> 0;
    if (typeof callback !== 'function') throw new TypeError(callback + ' is not a function');
    if (arguments.length > 1) T = arguments[1];
    k = 0;
    while (k < len) {
      var kValue;
      if (k in O) {
        kValue = O[k];
        callback.call(T, kValue, k, O);
      }
      k++;
    }
  };
}

// Полифилл для matches
// https://developer.mozilla.org/en-US/docs/Web/API/Element/matches
if (window.Element && !Element.prototype.matches) {
    Element.prototype.matches = 
        Element.prototype.matchesSelector || 
        Element.prototype.mozMatchesSelector ||
        Element.prototype.msMatchesSelector || 
        Element.prototype.oMatchesSelector || 
        Element.prototype.webkitMatchesSelector ||
        function(s) {
            var matches = (this.document || this.ownerDocument).querySelectorAll(s),
                i = matches.length;
            while (--i >= 0 && matches.item(i) !== this) {}
            return i > -1;            
        };
}

// Полифилл для closest
// https://developer.mozilla.org/en-US/docs/Web/API/Element/closest
if (window.Element && !Element.prototype.closest) {
    Element.prototype.closest = 
    function(s) {
        var matches = (this.document || this.ownerDocument).querySelectorAll(s),
            i,
            el = this;
        do {
            i = matches.length;
            while (--i >= 0 && matches.item(i) !== el) {};
        } while ((i < 0) && (el = el.parentElement)); 
        return el;
    };
}

// Полифилл для indexOf
// Шаги алгоритма ECMA-262, 5-е издание, 15.4.4.14
// Ссылка (en): http://es5.github.io/#x15.4.4.14
// Ссылка (ru): http://es5.javascript.ru/x15.4.html#x15.4.4.14
if (!Array.prototype.indexOf) {
  Array.prototype.indexOf = function(searchElement, fromIndex) {
    var k;
    if (this == null) throw new TypeError('"this" is null or not defined');
    var O = Object(this);
    var len = O.length >>> 0;
    if (len === 0) return -1;
    var n = +fromIndex || 0;
    if (Math.abs(n) === Infinity) n = 0;
    if (n >= len) return -1;
    k = Math.max(n >= 0 ? n : len - Math.abs(n), 0);
    while (k < len) {
      if (k in O && O[k] === searchElement) return k; k++;
    }
    return -1;
  };
}


if (!String.prototype.repeat) {
  String.prototype.repeat = function(count) {
    'use strict';
    if (this == null) throw new TypeError('can\'t convert ' + this + ' to object');
    var str = '' + this;
    count = +count;
    if (count != count) count = 0;
    if (count < 0) throw new RangeError('repeat count must be non-negative');
    if (count == Infinity) throw new RangeError('repeat count must be less than infinity');
    count = Math.floor(count);
    if (str.length == 0 || count == 0) return '';
    // Обеспечение того, что count является 31-битным целым числом, позволяет нам значительно
    // соптимизировать главную часть функции. Впрочем, большинство современных (на август
    // 2014 года) браузеров не обрабатывают строки, длиннее 1 << 28 символов, так что:
    if (str.length * count >= 1 << 28) throw new RangeError('repeat count must not overflow maximum string size');
    var rpt = '';
    for (;;) {
      if ((count & 1) == 1) rpt += str;
      count >>>= 1;
      if (count == 0) break;
      str += str;
    }
    return rpt;
  }
}

// Шаги алгоритма ECMA-262, 5-е издание, 15.4.4.19
// Ссылка (en): http://es5.github.com/#x15.4.4.19
// Ссылка (ru): http://es5.javascript.ru/x15.4.html#x15.4.4.19
// https://developer.mozilla.org/ru/docs/Web/JavaScript/Reference/Global_Objects/Array/map
if (!Array.prototype.map) {

  Array.prototype.map = function(callback, thisArg) {
    
    var T, A, k;
    if (this == null) throw new TypeError(' this is null or not defined');

    var O = Object(this);
    var len = O.length >>> 0;
    if (typeof callback !== 'function') throw new TypeError(callback + ' is not a function');
    if (arguments.length > 1)  T = thisArg;
    A = new Array(len);
    k = 0;
    while (k < len) {
      var kValue, mappedValue;
      if (k in O) {
        kValue = O[k];
        mappedValue = callback.call(T, kValue, k, O);
        A[k] = mappedValue;
      }
      k++;
    }
    return A;
  };
}

// https://tc39.github.io/ecma262/#sec-array.prototype.findindex
if (!Array.prototype.findIndex) {
  Object.defineProperty(Array.prototype, 'findIndex', {
    value: function(predicate) {
     // 1. Let O be ? ToObject(this value).
      if (this == null) {
        throw new TypeError('"this" is null or not defined');
      }

      var o = Object(this);

      // 2. Let len be ? ToLength(? Get(O, "length")).
      var len = o.length >>> 0;

      // 3. If IsCallable(predicate) is false, throw a TypeError exception.
      if (typeof predicate !== 'function') {
        throw new TypeError('predicate must be a function');
      }

      // 4. If thisArg was supplied, let T be thisArg; else let T be undefined.
      var thisArg = arguments[1];

      // 5. Let k be 0.
      var k = 0;

      // 6. Repeat, while k < len
      while (k < len) {
        // a. Let Pk be ! ToString(k).
        // b. Let kValue be ? Get(O, Pk).
        // c. Let testResult be ToBoolean(? Call(predicate, T, « kValue, k, O »)).
        // d. If testResult is true, return k.
        var kValue = o[k];
        if (predicate.call(thisArg, kValue, k, o)) {
          return k;
        }
        // e. Increase k by 1.
        k++;
      }

      // 7. Return -1.
      return -1;
    },
    configurable: true,
    writable: true
  });
}