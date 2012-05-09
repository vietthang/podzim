/*! Socket.IO.js build:0.9.6, development. Copyright(c) 2011 LearnBoost <dev@learnboost.com> MIT Licensed */

/**
 * socket.io
 * Copyright(c) 2011 LearnBoost <dev@learnboost.com>
 * MIT Licensed
 */

(function (exports, global) {

  /**
   * IO namespace.
   *
   * @namespace
   */

  var io = exports;

  /**
   * Socket.IO version
   *
   * @api public
   */

  io.version = '0.9.6';

  /**
   * Protocol implemented.
   *
   * @api public
   */

  io.protocol = 1;

  /**
   * Available transports, these will be populated with the available transports
   *
   * @api public
   */

  io.transports = [];

  /**
   * Keep track of jsonp callbacks.
   *
   * @api private
   */

  io.j = [];

  /**
   * Keep track of our io.Sockets
   *
   * @api private
   */
  io.sockets = {};


  /**
   * Manages connections to hosts.
   *
   * @param {String} uri
   * @Param {Boolean} force creation of new socket (defaults to false)
   * @api public
   */

  io.connect = function (host, details) {
    var uri = io.util.parseUri(host)
      , uuri
      , socket;

    if (global && global.location) {
      uri.protocol = uri.protocol || global.location.protocol.slice(0, -1);
      uri.host = uri.host || (global.document
        ? global.document.domain : global.location.hostname);
      uri.port = uri.port || global.location.port;
    }

    uuri = io.util.uniqueUri(uri);

    var options = {
        host: uri.host
      , secure: 'https' == uri.protocol
      , port: uri.port || ('https' == uri.protocol ? 443 : 80)
      , query: uri.query || ''
    };

    io.util.merge(options, details);

    if (options['force new connection'] || !io.sockets[uuri]) {
      socket = new io.Socket(options);
    }

    if (!options['force new connection'] && socket) {
      io.sockets[uuri] = socket;
    }

    socket = socket || io.sockets[uuri];

    // if path is different from '' or /
    return socket.of(uri.path.length > 1 ? uri.path : '');
  };

})('object' === typeof module ? module.exports : (this.io = {}), this);
/**
 * socket.io
 * Copyright(c) 2011 LearnBoost <dev@learnboost.com>
 * MIT Licensed
 */

(function (exports, global) {

  /**
   * Utilities namespace.
   *
   * @namespace
   */

  var util = exports.util = {};

  /**
   * Parses an URI
   *
   * @author Steven Levithan <stevenlevithan.com> (MIT license)
   * @api public
   */

  var re = /^(?:(?![^:@]+:[^:@\/]*@)([^:\/?#.]+):)?(?:\/\/)?((?:(([^:@]*)(?::([^:@]*))?)?@)?([^:\/?#]*)(?::(\d*))?)(((\/(?:[^?#](?![^?#\/]*\.[^?#\/.]+(?:[?#]|$)))*\/?)?([^?#\/]*))(?:\?([^#]*))?(?:#(.*))?)/;

  var parts = ['source', 'protocol', 'authority', 'userInfo', 'user', 'password',
               'host', 'port', 'relative', 'path', 'directory', 'file', 'query',
               'anchor'];

  util.parseUri = function (str) {
    var m = re.exec(str || '')
      , uri = {}
      , i = 14;

    while (i--) {
      uri[parts[i]] = m[i] || '';
    }

    return uri;
  };

  /**
   * Produces a unique url that identifies a Socket.IO connection.
   *
   * @param {Object} uri
   * @api public
   */

  util.uniqueUri = function (uri) {
    var protocol = uri.protocol
      , host = uri.host
      , port = uri.port;

    if ('document' in global) {
      host = host || document.domain;
      port = port || (protocol == 'https'
        && document.location.protocol !== 'https:' ? 443 : document.location.port);
    } else {
      host = host || 'localhost';

      if (!port && protocol == 'https') {
        port = 443;
      }
    }

    return (protocol || 'http') + '://' + host + ':' + (port || 80);
  };

  /**
   * Mergest 2 query strings in to once unique query string
   *
   * @param {String} base
   * @param {String} addition
   * @api public
   */

  util.query = function (base, addition) {
    var query = util.chunkQuery(base || '')
      , components = [];

    util.merge(query, util.chunkQuery(addition || ''));
    for (var part in query) {
      if (query.hasOwnProperty(part)) {
        components.push(part + '=' + query[part]);
      }
    }

    return components.length ? '?' + components.join('&') : '';
  };

  /**
   * Transforms a querystring in to an object
   *
   * @param {String} qs
   * @api public
   */

  util.chunkQuery = function (qs) {
    var query = {}
      , params = qs.split('&')
      , i = 0
      , l = params.length
      , kv;

    for (; i < l; ++i) {
      kv = params[i].split('=');
      if (kv[0]) {
        query[kv[0]] = kv[1];
      }
    }

    return query;
  };

  /**
   * Executes the given function when the page is loaded.
   *
   *     io.util.load(function () { console.log('page loaded'); });
   *
   * @param {Function} fn
   * @api public
   */

  var pageLoaded = false;

  util.load = function (fn) {
    if ('document' in global && document.readyState === 'complete' || pageLoaded) {
      return fn();
    }

    util.on(global, 'load', fn, false);
  };

  /**
   * Adds an event.
   *
   * @api private
   */

  util.on = function (element, event, fn, capture) {
    if (element.attachEvent) {
      element.attachEvent('on' + event, fn);
    } else if (element.addEventListener) {
      element.addEventListener(event, fn, capture);
    }
  };

  /**
   * Generates the correct `XMLHttpRequest` for regular and cross domain requests.
   *
   * @param {Boolean} [xdomain] Create a request that can be used cross domain.
   * @returns {XMLHttpRequest|false} If we can create a XMLHttpRequest.
   * @api private
   */

  util.request = function (xdomain) {

    if (xdomain && 'undefined' != typeof XDomainRequest) {
      return new XDomainRequest();
    }

    if ('undefined' != typeof XMLHttpRequest && (!xdomain || util.ua.hasCORS)) {
      return new XMLHttpRequest();
    }

    if (!xdomain) {
      try {
        return new window[(['Active'].concat('Object').join('X'))]('Microsoft.XMLHTTP');
      } catch(e) { }
    }

    return null;
  };

  /**
   * XHR based transport constructor.
   *
   * @constructor
   * @api public
   */

  /**
   * Change the internal pageLoaded value.
   */

  if ('undefined' != typeof window) {
    util.load(function () {
      pageLoaded = true;
    });
  }

  /**
   * Defers a function to ensure a spinner is not displayed by the browser
   *
   * @param {Function} fn
   * @api public
   */

  util.defer = function (fn) {
    if (!util.ua.webkit || 'undefined' != typeof importScripts) {
      return fn();
    }

    util.load(function () {
      setTimeout(fn, 100);
    });
  };

  /**
   * Merges two objects.
   *
   * @api public
   */
  
  util.merge = function merge (target, additional, deep, lastseen) {
    var seen = lastseen || []
      , depth = typeof deep == 'undefined' ? 2 : deep
      , prop;

    for (prop in additional) {
      if (additional.hasOwnProperty(prop) && util.indexOf(seen, prop) < 0) {
        if (typeof target[prop] !== 'object' || !depth) {
          target[prop] = additional[prop];
          seen.push(additional[prop]);
        } else {
          util.merge(target[prop], additional[prop], depth - 1, seen);
        }
      }
    }

    return target;
  };

  /**
   * Merges prototypes from objects
   *
   * @api public
   */
  
  util.mixin = function (ctor, ctor2) {
    util.merge(ctor.prototype, ctor2.prototype);
  };

  /**
   * Shortcut for prototypical and static inheritance.
   *
   * @api private
   */

  util.inherit = function (ctor, ctor2) {
    function f() {};
    f.prototype = ctor2.prototype;
    ctor.prototype = new f;
  };

  /**
   * Checks if the given object is an Array.
   *
   *     io.util.isArray([]); // true
   *     io.util.isArray({}); // false
   *
   * @param Object obj
   * @api public
   */

  util.isArray = Array.isArray || function (obj) {
    return Object.prototype.toString.call(obj) === '[object Array]';
  };

  /**
   * Intersects values of two arrays into a third
   *
   * @api public
   */

  util.intersect = function (arr, arr2) {
    var ret = []
      , longest = arr.length > arr2.length ? arr : arr2
      , shortest = arr.length > arr2.length ? arr2 : arr;

    for (var i = 0, l = shortest.length; i < l; i++) {
      if (~util.indexOf(longest, shortest[i]))
        ret.push(shortest[i]);
    }

    return ret;
  }

  /**
   * Array indexOf compatibility.
   *
   * @see bit.ly/a5Dxa2
   * @api public
   */

  util.indexOf = function (arr, o, i) {
    
    for (var j = arr.length, i = i < 0 ? i + j < 0 ? 0 : i + j : i || 0; 
         i < j && arr[i] !== o; i++) {}

    return j <= i ? -1 : i;
  };

  /**
   * Converts enumerables to array.
   *
   * @api public
   */

  util.toArray = function (enu) {
    var arr = [];

    for (var i = 0, l = enu.length; i < l; i++)
      arr.push(enu[i]);

    return arr;
  };

  /**
   * UA / engines detection namespace.
   *
   * @namespace
   */

  util.ua = {};

  /**
   * Whether the UA supports CORS for XHR.
   *
   * @api public
   */

  util.ua.hasCORS = 'undefined' != typeof XMLHttpRequest && (function () {
    try {
      var a = new XMLHttpRequest();
    } catch (e) {
      return false;
    }

    return a.withCredentials != undefined;
  })();

  /**
   * Detect webkit.
   *
   * @api public
   */

  util.ua.webkit = 'undefined' != typeof navigator
    && /webkit/i.test(navigator.userAgent);

})('undefined' != typeof io ? io : module.exports, this);

/**
 * socket.io
 * Copyright(c) 2011 LearnBoost <dev@learnboost.com>
 * MIT Licensed
 */

(function (exports, io) {

  /**
   * Expose constructor.
   */

  exports.EventEmitter = EventEmitter;

  /**
   * Event emitter constructor.
   *
   * @api public.
   */

  function EventEmitter () {};

  /**
   * Adds a listener
   *
   * @api public
   */

  EventEmitter.prototype.on = function (name, fn) {
    if (!this.$events) {
      this.$events = {};
    }

    if (!this.$events[name]) {
      this.$events[name] = fn;
    } else if (io.util.isArray(this.$events[name])) {
      this.$events[name].push(fn);
    } else {
      this.$events[name] = [this.$events[name], fn];
    }

    return this;
  };

  EventEmitter.prototype.addListener = EventEmitter.prototype.on;

  /**
   * Adds a volatile listener.
   *
   * @api public
   */

  EventEmitter.prototype.once = function (name, fn) {
    var self = this;

    function on () {
      self.removeListener(name, on);
      fn.apply(this, arguments);
    };

    on.listener = fn;
    this.on(name, on);

    return this;
  };

  /**
   * Removes a listener.
   *
   * @api public
   */

  EventEmitter.prototype.removeListener = function (name, fn) {
    if (this.$events && this.$events[name]) {
      var list = this.$events[name];

      if (io.util.isArray(list)) {
        var pos = -1;

        for (var i = 0, l = list.length; i < l; i++) {
          if (list[i] === fn || (list[i].listener && list[i].listener === fn)) {
            pos = i;
            break;
          }
        }

        if (pos < 0) {
          return this;
        }

        list.splice(pos, 1);

        if (!list.length) {
          delete this.$events[name];
        }
      } else if (list === fn || (list.listener && list.listener === fn)) {
        delete this.$events[name];
      }
    }

    return this;
  };

  /**
   * Removes all listeners for an event.
   *
   * @api public
   */

  EventEmitter.prototype.removeAllListeners = function (name) {
    // TODO: enable this when node 0.5 is stable
    //if (name === undefined) {
      //this.$events = {};
      //return this;
    //}

    if (this.$events && this.$events[name]) {
      this.$events[name] = null;
    }

    return this;
  };

  /**
   * Gets all listeners for a certain event.
   *
   * @api publci
   */

  EventEmitter.prototype.listeners = function (name) {
    if (!this.$events) {
      this.$events = {};
    }

    if (!this.$events[name]) {
      this.$events[name] = [];
    }

    if (!io.util.isArray(this.$events[name])) {
      this.$events[name] = [this.$events[name]];
    }

    return this.$events[name];
  };

  /**
   * Emits an event.
   *
   * @api public
   */

  EventEmitter.prototype.emit = function (name) {
    if (!this.$events) {
      return false;
    }

    var handler = this.$events[name];

    if (!handler) {
      return false;
    }

    var args = Array.prototype.slice.call(arguments, 1);

    if ('function' == typeof handler) {
      handler.apply(this, args);
    } else if (io.util.isArray(handler)) {
      var listeners = handler.slice();

      for (var i = 0, l = listeners.length; i < l; i++) {
        listeners[i].apply(this, args);
      }
    } else {
      return false;
    }

    return true;
  };

})(
    'undefined' != typeof io ? io : module.exports
  , 'undefined' != typeof io ? io : module.parent.exports
);

/**
 * socket.io
 * Copyright(c) 2011 LearnBoost <dev@learnboost.com>
 * MIT Licensed
 */

/**
 * Based on JSON2 (http://www.JSON.org/js.html).
 */

(function (exports, nativeJSON) {
  "use strict";

  // use native JSON if it's available
  if (nativeJSON && nativeJSON.parse){
    return exports.JSON = {
      parse: nativeJSON.parse
    , stringify: nativeJSON.stringify
    }
  }

  var JSON = exports.JSON = {};

  function f(n) {
      // Format integers to have at least two digits.
      return n < 10 ? '0' + n : n;
  }

  function date(d, key) {
    return isFinite(d.valueOf()) ?
        d.getUTCFullYear()     + '-' +
        f(d.getUTCMonth() + 1) + '-' +
        f(d.getUTCDate())      + 'T' +
        f(d.getUTCHours())     + ':' +
        f(d.getUTCMinutes())   + ':' +
        f(d.getUTCSeconds())   + 'Z' : null;
  };

  var cx = /[\u0000\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
      escapable = /[\\\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
      gap,
      indent,
      meta = {    // table of character substitutions
          '\b': '\\b',
          '\t': '\\t',
          '\n': '\\n',
          '\f': '\\f',
          '\r': '\\r',
          '"' : '\\"',
          '\\': '\\\\'
      },
      rep;


  function quote(string) {

// If the string contains no control characters, no quote characters, and no
// backslash characters, then we can safely slap some quotes around it.
// Otherwise we must also replace the offending characters with safe escape
// sequences.

      escapable.lastIndex = 0;
      return escapable.test(string) ? '"' + string.replace(escapable, function (a) {
          var c = meta[a];
          return typeof c === 'string' ? c :
              '\\u' + ('0000' + a.charCodeAt(0).toString(16)).slice(-4);
      }) + '"' : '"' + string + '"';
  }


  function str(key, holder) {

// Produce a string from holder[key].

      var i,          // The loop counter.
          k,          // The member key.
          v,          // The member value.
          length,
          mind = gap,
          partial,
          value = holder[key];

// If the value has a toJSON method, call it to obtain a replacement value.

      if (value instanceof Date) {
          value = date(key);
      }

// If we were called with a replacer function, then call the replacer to
// obtain a replacement value.

      if (typeof rep === 'function') {
          value = rep.call(holder, key, value);
      }

// What happens next depends on the value's type.

      switch (typeof value) {
      case 'string':
          return quote(value);

      case 'number':

// JSON numbers must be finite. Encode non-finite numbers as null.

          return isFinite(value) ? String(value) : 'null';

      case 'boolean':
      case 'null':

// If the value is a boolean or null, convert it to a string. Note:
// typeof null does not produce 'null'. The case is included here in
// the remote chance that this gets fixed someday.

          return String(value);

// If the type is 'object', we might be dealing with an object or an array or
// null.

      case 'object':

// Due to a specification blunder in ECMAScript, typeof null is 'object',
// so watch out for that case.

          if (!value) {
              return 'null';
          }

// Make an array to hold the partial results of stringifying this object value.

          gap += indent;
          partial = [];

// Is the value an array?

          if (Object.prototype.toString.apply(value) === '[object Array]') {

// The value is an array. Stringify every element. Use null as a placeholder
// for non-JSON values.

              length = value.length;
              for (i = 0; i < length; i += 1) {
                  partial[i] = str(i, value) || 'null';
              }

// Join all of the elements together, separated with commas, and wrap them in
// brackets.

              v = partial.length === 0 ? '[]' : gap ?
                  '[\n' + gap + partial.join(',\n' + gap) + '\n' + mind + ']' :
                  '[' + partial.join(',') + ']';
              gap = mind;
              return v;
          }

// If the replacer is an array, use it to select the members to be stringified.

          if (rep && typeof rep === 'object') {
              length = rep.length;
              for (i = 0; i < length; i += 1) {
                  if (typeof rep[i] === 'string') {
                      k = rep[i];
                      v = str(k, value);
                      if (v) {
                          partial.push(quote(k) + (gap ? ': ' : ':') + v);
                      }
                  }
              }
          } else {

// Otherwise, iterate through all of the keys in the object.

              for (k in value) {
                  if (Object.prototype.hasOwnProperty.call(value, k)) {
                      v = str(k, value);
                      if (v) {
                          partial.push(quote(k) + (gap ? ': ' : ':') + v);
                      }
                  }
              }
          }

// Join all of the member texts together, separated with commas,
// and wrap them in braces.

          v = partial.length === 0 ? '{}' : gap ?
              '{\n' + gap + partial.join(',\n' + gap) + '\n' + mind + '}' :
              '{' + partial.join(',') + '}';
          gap = mind;
          return v;
      }
  }

// If the JSON object does not yet have a stringify method, give it one.

  JSON.stringify = function (value, replacer, space) {

// The stringify method takes a value and an optional replacer, and an optional
// space parameter, and returns a JSON text. The replacer can be a function
// that can replace values, or an array of strings that will select the keys.
// A default replacer method can be provided. Use of the space parameter can
// produce text that is more easily readable.

      var i;
      gap = '';
      indent = '';

// If the space parameter is a number, make an indent string containing that
// many spaces.

      if (typeof space === 'number') {
          for (i = 0; i < space; i += 1) {
              indent += ' ';
          }

// If the space parameter is a string, it will be used as the indent string.

      } else if (typeof space === 'string') {
          indent = space;
      }

// If there is a replacer, it must be a function or an array.
// Otherwise, throw an error.

      rep = replacer;
      if (replacer && typeof replacer !== 'function' &&
              (typeof replacer !== 'object' ||
              typeof replacer.length !== 'number')) {
          throw new Error('JSON.stringify');
      }

// Make a fake root object containing our value under the key of ''.
// Return the result of stringifying the value.

      return str('', {'': value});
  };

// If the JSON object does not yet have a parse method, give it one.

  JSON.parse = function (text, reviver) {
  // The parse method takes a text and an optional reviver function, and returns
  // a JavaScript value if the text is a valid JSON text.

      var j;

      function walk(holder, key) {

  // The walk method is used to recursively walk the resulting structure so
  // that modifications can be made.

          var k, v, value = holder[key];
          if (value && typeof value === 'object') {
              for (k in value) {
                  if (Object.prototype.hasOwnProperty.call(value, k)) {
                      v = walk(value, k);
                      if (v !== undefined) {
                          value[k] = v;
                      } else {
                          delete value[k];
                      }
                  }
              }
          }
          return reviver.call(holder, key, value);
      }


  // Parsing happens in four stages. In the first stage, we replace certain
  // Unicode characters with escape sequences. JavaScript handles many characters
  // incorrectly, either silently deleting them, or treating them as line endings.

      text = String(text);
      cx.lastIndex = 0;
      if (cx.test(text)) {
          text = text.replace(cx, function (a) {
              return '\\u' +
                  ('0000' + a.charCodeAt(0).toString(16)).slice(-4);
          });
      }

  // In the second stage, we run the text against regular expressions that look
  // for non-JSON patterns. We are especially concerned with '()' and 'new'
  // because they can cause invocation, and '=' because it can cause mutation.
  // But just to be safe, we want to reject all unexpected forms.

  // We split the second stage into 4 regexp operations in order to work around
  // crippling inefficiencies in IE's and Safari's regexp engines. First we
  // replace the JSON backslash pairs with '@' (a non-JSON character). Second, we
  // replace all simple value tokens with ']' characters. Third, we delete all
  // open brackets that follow a colon or comma or that begin the text. Finally,
  // we look to see that the remaining characters are only whitespace or ']' or
  // ',' or ':' or '{' or '}'. If that is so, then the text is safe for eval.

      if (/^[\],:{}\s]*$/
              .test(text.replace(/\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g, '@')
                  .replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, ']')
                  .replace(/(?:^|:|,)(?:\s*\[)+/g, ''))) {

  // In the third stage we use the eval function to compile the text into a
  // JavaScript structure. The '{' operator is subject to a syntactic ambiguity
  // in JavaScript: it can begin a block or an object literal. We wrap the text
  // in parens to eliminate the ambiguity.

          j = eval('(' + text + ')');

  // In the optional fourth stage, we recursively walk the new structure, passing
  // each name/value pair to a reviver function for possible transformation.

          return typeof reviver === 'function' ?
              walk({'': j}, '') : j;
      }

  // If the text is not JSON parseable, then a SyntaxError is thrown.

      throw new SyntaxError('JSON.parse');
  };

})(
    'undefined' != typeof io ? io : module.exports
  , typeof JSON !== 'undefined' ? JSON : undefined
);

/**
 * socket.io
 * Copyright(c) 2011 LearnBoost <dev@learnboost.com>
 * MIT Licensed
 */

(function (exports, io) {

  /**
   * Parser namespace.
   *
   * @namespace
   */

  var parser = exports.parser = {};

  /**
   * Packet types.
   */

  var packets = parser.packets = [
      'disconnect'
    , 'connect'
    , 'heartbeat'
    , 'message'
    , 'json'
    , 'event'
    , 'ack'
    , 'error'
    , 'noop'
  ];

  /**
   * Errors reasons.
   */

  var reasons = parser.reasons = [
      'transport not supported'
    , 'client not handshaken'
    , 'unauthorized'
  ];

  /**
   * Errors advice.
   */

  var advice = parser.advice = [
      'reconnect'
  ];

  /**
   * Shortcuts.
   */

  var JSON = io.JSON
    , indexOf = io.util.indexOf;

  /**
   * Encodes a packet.
   *
   * @api private
   */

  parser.encodePacket = function (packet) {
    var type = indexOf(packets, packet.type)
      , id = packet.id || ''
      , endpoint = packet.endpoint || ''
      , ack = packet.ack
      , data = null;

    switch (packet.type) {
      case 'error':
        var reason = packet.reason ? indexOf(reasons, packet.reason) : ''
          , adv = packet.advice ? indexOf(advice, packet.advice) : '';

        if (reason !== '' || adv !== '')
          data = reason + (adv !== '' ? ('+' + adv) : '');

        break;

      case 'message':
        if (packet.data !== '')
          data = packet.data;
        break;

      case 'event':
        var ev = { name: packet.name };

        if (packet.args && packet.args.length) {
          ev.args = packet.args;
        }

        data = JSON.stringify(ev);
        break;

      case 'json':
        data = JSON.stringify(packet.data);
        break;

      case 'connect':
        if (packet.qs)
          data = packet.qs;
        break;

      case 'ack':
        data = packet.ackId
          + (packet.args && packet.args.length
              ? '+' + JSON.stringify(packet.args) : '');
        break;
    }

    // construct packet with required fragments
    var encoded = [
        type
      , id + (ack == 'data' ? '+' : '')
      , endpoint
    ];

    // data fragment is optional
    if (data !== null && data !== undefined)
      encoded.push(data);

    return encoded.join(':');
  };

  /**
   * Encodes multiple messages (payload).
   *
   * @param {Array} messages
   * @api private
   */

  parser.encodePayload = function (packets) {
    var decoded = '';

    if (packets.length == 1)
      return packets[0];

    for (var i = 0, l = packets.length; i < l; i++) {
      var packet = packets[i];
      decoded += '\ufffd' + packet.length + '\ufffd' + packets[i];
    }

    return decoded;
  };

  /**
   * Decodes a packet
   *
   * @api private
   */

  var regexp = /([^:]+):([0-9]+)?(\+)?:([^:]+)?:?([\s\S]*)?/;

  parser.decodePacket = function (data) {
    var pieces = data.match(regexp);

    if (!pieces) return {};

    var id = pieces[2] || ''
      , data = pieces[5] || ''
      , packet = {
            type: packets[pieces[1]]
          , endpoint: pieces[4] || ''
        };

    // whether we need to acknowledge the packet
    if (id) {
      packet.id = id;
      if (pieces[3])
        packet.ack = 'data';
      else
        packet.ack = true;
    }

    // handle different packet types
    switch (packet.type) {
      case 'error':
        var pieces = data.split('+');
        packet.reason = reasons[pieces[0]] || '';
        packet.advice = advice[pieces[1]] || '';
        break;

      case 'message':
        packet.data = data || '';
        break;

      case 'event':
        try {
          var opts = JSON.parse(data);
          packet.name = opts.name;
          packet.args = opts.args;
        } catch (e) { }

        packet.args = packet.args || [];
        break;

      case 'json':
        try {
          packet.data = JSON.parse(data);
        } catch (e) { }
        break;

      case 'connect':
        packet.qs = data || '';
        break;

      case 'ack':
        var pieces = data.match(/^([0-9]+)(\+)?(.*)/);
        if (pieces) {
          packet.ackId = pieces[1];
          packet.args = [];

          if (pieces[3]) {
            try {
              packet.args = pieces[3] ? JSON.parse(pieces[3]) : [];
            } catch (e) { }
          }
        }
        break;

      case 'disconnect':
      case 'heartbeat':
        break;
    };

    return packet;
  };

  /**
   * Decodes data payload. Detects multiple messages
   *
   * @return {Array} messages
   * @api public
   */

  parser.decodePayload = function (data) {
    // IE doesn't like data[i] for unicode chars, charAt works fine
    if (data.charAt(0) == '\ufffd') {
      var ret = [];

      for (var i = 1, length = ''; i < data.length; i++) {
        if (data.charAt(i) == '\ufffd') {
          ret.push(parser.decodePacket(data.substr(i + 1).substr(0, length)));
          i += Number(length) + 1;
          length = '';
        } else {
          length += data.charAt(i);
        }
      }

      return ret;
    } else {
      return [parser.decodePacket(data)];
    }
  };

})(
    'undefined' != typeof io ? io : module.exports
  , 'undefined' != typeof io ? io : module.parent.exports
);
/**
 * socket.io
 * Copyright(c) 2011 LearnBoost <dev@learnboost.com>
 * MIT Licensed
 */

(function (exports, io) {

  /**
   * Expose constructor.
   */

  exports.Transport = Transport;

  /**
   * This is the transport template for all supported transport methods.
   *
   * @constructor
   * @api public
   */

  function Transport (socket, sessid) {
    this.socket = socket;
    this.sessid = sessid;
  };

  /**
   * Apply EventEmitter mixin.
   */

  io.util.mixin(Transport, io.EventEmitter);

  /**
   * Handles the response from the server. When a new response is received
   * it will automatically update the timeout, decode the message and
   * forwards the response to the onMessage function for further processing.
   *
   * @param {String} data Response from the server.
   * @api private
   */

  Transport.prototype.onData = function (data) {
    this.clearCloseTimeout();
    
    // If the connection in currently open (or in a reopening state) reset the close 
    // timeout since we have just received data. This check is necessary so
    // that we don't reset the timeout on an explicitly disconnected connection.
    if (this.socket.connected || this.socket.connecting || this.socket.reconnecting) {
      this.setCloseTimeout();
    }

    if (data !== '') {
      // todo: we should only do decodePayload for xhr transports
      var msgs = io.parser.decodePayload(data);

      if (msgs && msgs.length) {
        for (var i = 0, l = msgs.length; i < l; i++) {
          this.onPacket(msgs[i]);
        }
      }
    }

    return this;
  };

  /**
   * Handles packets.
   *
   * @api private
   */

  Transport.prototype.onPacket = function (packet) {
    this.socket.setHeartbeatTimeout();

    if (packet.type == 'heartbeat') {
      return this.onHeartbeat();
    }

    if (packet.type == 'connect' && packet.endpoint == '') {
      this.onConnect();
    }

    if (packet.type == 'error' && packet.advice == 'reconnect') {
      this.open = false;
    }

    this.socket.onPacket(packet);

    return this;
  };

  /**
   * Sets close timeout
   *
   * @api private
   */
  
  Transport.prototype.setCloseTimeout = function () {
    if (!this.closeTimeout) {
      var self = this;

      this.closeTimeout = setTimeout(function () {
        self.onDisconnect();
      }, this.socket.closeTimeout);
    }
  };

  /**
   * Called when transport disconnects.
   *
   * @api private
   */

  Transport.prototype.onDisconnect = function () {
    if (this.close && this.open) this.close();
    this.clearTimeouts();
    this.socket.onDisconnect();
    return this;
  };

  /**
   * Called when transport connects
   *
   * @api private
   */

  Transport.prototype.onConnect = function () {
    this.socket.onConnect();
    return this;
  }

  /**
   * Clears close timeout
   *
   * @api private
   */

  Transport.prototype.clearCloseTimeout = function () {
    if (this.closeTimeout) {
      clearTimeout(this.closeTimeout);
      this.closeTimeout = null;
    }
  };

  /**
   * Clear timeouts
   *
   * @api private
   */

  Transport.prototype.clearTimeouts = function () {
    this.clearCloseTimeout();

    if (this.reopenTimeout) {
      clearTimeout(this.reopenTimeout);
    }
  };

  /**
   * Sends a packet
   *
   * @param {Object} packet object.
   * @api private
   */

  Transport.prototype.packet = function (packet) {
    this.send(io.parser.encodePacket(packet));
  };

  /**
   * Send the received heartbeat message back to server. So the server
   * knows we are still connected.
   *
   * @param {String} heartbeat Heartbeat response from the server.
   * @api private
   */

  Transport.prototype.onHeartbeat = function (heartbeat) {
    this.packet({ type: 'heartbeat' });
  };
 
  /**
   * Called when the transport opens.
   *
   * @api private
   */

  Transport.prototype.onOpen = function () {
    this.open = true;
    this.clearCloseTimeout();
    this.socket.onOpen();
  };

  /**
   * Notifies the base when the connection with the Socket.IO server
   * has been disconnected.
   *
   * @api private
   */

  Transport.prototype.onClose = function () {
    var self = this;

    /* FIXME: reopen delay causing a infinit loop
    this.reopenTimeout = setTimeout(function () {
      self.open();
    }, this.socket.options['reopen delay']);*/

    this.open = false;
    this.socket.onClose();
    this.onDisconnect();
  };

  /**
   * Generates a connection url based on the Socket.IO URL Protocol.
   * See <https://github.com/learnboost/socket.io-node/> for more details.
   *
   * @returns {String} Connection url
   * @api private
   */

  Transport.prototype.prepareUrl = function () {
    var options = this.socket.options;

    return this.scheme() + '://'
      + options.host + ':' + options.port + '/'
      + options.resource + '/' + io.protocol
      + '/' + this.name + '/' + this.sessid;
  };

  /**
   * Checks if the transport is ready to start a connection.
   *
   * @param {Socket} socket The socket instance that needs a transport
   * @param {Function} fn The callback
   * @api private
   */

  Transport.prototype.ready = function (socket, fn) {
    fn.call(this);
  };
})(
    'undefined' != typeof io ? io : module.exports
  , 'undefined' != typeof io ? io : module.parent.exports
);
/**
 * socket.io
 * Copyright(c) 2011 LearnBoost <dev@learnboost.com>
 * MIT Licensed
 */

(function (exports, io, global) {

  /**
   * Expose constructor.
   */

  exports.Socket = Socket;

  /**
   * Create a new `Socket.IO client` which can establish a persistent
   * connection with a Socket.IO enabled server.
   *
   * @api public
   */

  function Socket (options) {
    this.options = {
        port: 80
      , secure: false
      , document: 'document' in global ? document : false
      , resource: 'socket.io'
      , transports: io.transports
      , 'connect timeout': 10000
      , 'try multiple transports': true
      , 'reconnect': true
      , 'reconnection delay': 500
      , 'reconnection limit': Infinity
      , 'reopen delay': 3000
      , 'max reconnection attempts': 10
      , 'sync disconnect on unload': true
      , 'auto connect': true
      , 'flash policy port': 10843
    };

    io.util.merge(this.options, options);

    this.connected = false;
    this.open = false;
    this.connecting = false;
    this.reconnecting = false;
    this.namespaces = {};
    this.buffer = [];
    this.doBuffer = false;

    if (this.options['sync disconnect on unload'] &&
        (!this.isXDomain() || io.util.ua.hasCORS)) {
      var self = this;

      io.util.on(global, 'unload', function () {
        self.disconnectSync();
      }, false);
    }

    if (this.options['auto connect']) {
      this.connect();
    }
};

  /**
   * Apply EventEmitter mixin.
   */

  io.util.mixin(Socket, io.EventEmitter);

  /**
   * Returns a namespace listener/emitter for this socket
   *
   * @api public
   */

  Socket.prototype.of = function (name) {
    if (!this.namespaces[name]) {
      this.namespaces[name] = new io.SocketNamespace(this, name);

      if (name !== '') {
        this.namespaces[name].packet({ type: 'connect' });
      }
    }

    return this.namespaces[name];
  };

  /**
   * Emits the given event to the Socket and all namespaces
   *
   * @api private
   */

  Socket.prototype.publish = function () {
    this.emit.apply(this, arguments);

    var nsp;

    for (var i in this.namespaces) {
      if (this.namespaces.hasOwnProperty(i)) {
        nsp = this.of(i);
        nsp.$emit.apply(nsp, arguments);
      }
    }
  };

  /**
   * Performs the handshake
   *
   * @api private
   */

  function empty () { };

  Socket.prototype.handshake = function (fn) {
    var self = this
      , options = this.options;

    function complete (data) {
      if (data instanceof Error) {
        self.onError(data.message);
      } else {
        fn.apply(null, data.split(':'));
      }
    };

    var url = [
          'http' + (options.secure ? 's' : '') + ':/'
        , options.host + ':' + options.port
        , options.resource
        , io.protocol
        , io.util.query(this.options.query, 't=' + +new Date)
      ].join('/');

    if (this.isXDomain() && !io.util.ua.hasCORS) {
      var insertAt = document.getElementsByTagName('script')[0]
        , script = document.createElement('script');

      script.src = url + '&jsonp=' + io.j.length;
      insertAt.parentNode.insertBefore(script, insertAt);

      io.j.push(function (data) {
        complete(data);
        script.parentNode.removeChild(script);
      });
    } else {
      var xhr = io.util.request();

      xhr.open('GET', url, true);
      xhr.withCredentials = true;
      xhr.onreadystatechange = function () {
        if (xhr.readyState == 4) {
          xhr.onreadystatechange = empty;

          if (xhr.status == 200) {
            complete(xhr.responseText);
          } else {
            !self.reconnecting && self.onError(xhr.responseText);
          }
        }
      };
      xhr.send(null);
    }
  };

  /**
   * Find an available transport based on the options supplied in the constructor.
   *
   * @api private
   */

  Socket.prototype.getTransport = function (override) {
    var transports = override || this.transports, match;

    for (var i = 0, transport; transport = transports[i]; i++) {
      if (io.Transport[transport]
        && io.Transport[transport].check(this)
        && (!this.isXDomain() || io.Transport[transport].xdomainCheck())) {
        return new io.Transport[transport](this, this.sessionid);
      }
    }

    return null;
  };

  /**
   * Connects to the server.
   *
   * @param {Function} [fn] Callback.
   * @returns {io.Socket}
   * @api public
   */

  Socket.prototype.connect = function (fn) {
    if (this.connecting) {
      return this;
    }

    var self = this;

    this.handshake(function (sid, heartbeat, close, transports) {
      self.sessionid = sid;
      self.closeTimeout = close * 1000;
      self.heartbeatTimeout = heartbeat * 1000;
      self.transports = transports ? io.util.intersect(
          transports.split(',')
        , self.options.transports
      ) : self.options.transports;

      self.setHeartbeatTimeout();

      function connect (transports){
        if (self.transport) self.transport.clearTimeouts();

        self.transport = self.getTransport(transports);
        if (!self.transport) return self.publish('connect_failed');

        // once the transport is ready
        self.transport.ready(self, function () {
          self.connecting = true;
          self.publish('connecting', self.transport.name);
          self.transport.open();

          if (self.options['connect timeout']) {
            self.connectTimeoutTimer = setTimeout(function () {
              if (!self.connected) {
                self.connecting = false;

                if (self.options['try multiple transports']) {
                  if (!self.remainingTransports) {
                    self.remainingTransports = self.transports.slice(0);
                  }

                  var remaining = self.remainingTransports;

                  while (remaining.length > 0 && remaining.splice(0,1)[0] !=
                         self.transport.name) {}

                    if (remaining.length){
                      connect(remaining);
                    } else {
                      self.publish('connect_failed');
                    }
                }
              }
            }, self.options['connect timeout']);
          }
        });
      }

      connect(self.transports);

      self.once('connect', function (){
        clearTimeout(self.connectTimeoutTimer);

        fn && typeof fn == 'function' && fn();
      });
    });

    return this;
  };

  /**
   * Clears and sets a new heartbeat timeout using the value given by the
   * server during the handshake.
   *
   * @api private
   */

  Socket.prototype.setHeartbeatTimeout = function () {
    clearTimeout(this.heartbeatTimeoutTimer);

    var self = this;
    this.heartbeatTimeoutTimer = setTimeout(function () {
      self.transport.onClose();
    }, this.heartbeatTimeout);
  };

  /**
   * Sends a message.
   *
   * @param {Object} data packet.
   * @returns {io.Socket}
   * @api public
   */

  Socket.prototype.packet = function (data) {
    if (this.connected && !this.doBuffer) {
      this.transport.packet(data);
    } else {
      this.buffer.push(data);
    }

    return this;
  };

  /**
   * Sets buffer state
   *
   * @api private
   */

  Socket.prototype.setBuffer = function (v) {
    this.doBuffer = v;

    if (!v && this.connected && this.buffer.length) {
      this.transport.payload(this.buffer);
      this.buffer = [];
    }
  };

  /**
   * Disconnect the established connect.
   *
   * @returns {io.Socket}
   * @api public
   */

  Socket.prototype.disconnect = function () {
    if (this.connected || this.connecting) {
      if (this.open) {
        this.of('').packet({ type: 'disconnect' });
      }

      // handle disconnection immediately
      this.onDisconnect('booted');
    }

    return this;
  };

  /**
   * Disconnects the socket with a sync XHR.
   *
   * @api private
   */

  Socket.prototype.disconnectSync = function () {
    // ensure disconnection
    var xhr = io.util.request()
      , uri = this.resource + '/' + io.protocol + '/' + this.sessionid;

    xhr.open('GET', uri, true);

    // handle disconnection immediately
    this.onDisconnect('booted');
  };

  /**
   * Check if we need to use cross domain enabled transports. Cross domain would
   * be a different port or different domain name.
   *
   * @returns {Boolean}
   * @api private
   */

  Socket.prototype.isXDomain = function () {

    var port = global.location.port ||
      ('https:' == global.location.protocol ? 443 : 80);

    return this.options.host !== global.location.hostname 
      || this.options.port != port;
  };

  /**
   * Called upon handshake.
   *
   * @api private
   */

  Socket.prototype.onConnect = function () {
    if (!this.connected) {
      this.connected = true;
      this.connecting = false;
      if (!this.doBuffer) {
        // make sure to flush the buffer
        this.setBuffer(false);
      }
      this.emit('connect');
    }
  };

  /**
   * Called when the transport opens
   *
   * @api private
   */

  Socket.prototype.onOpen = function () {
    this.open = true;
  };

  /**
   * Called when the transport closes.
   *
   * @api private
   */

  Socket.prototype.onClose = function () {
    this.open = false;
    clearTimeout(this.heartbeatTimeoutTimer);
  };

  /**
   * Called when the transport first opens a connection
   *
   * @param text
   */

  Socket.prototype.onPacket = function (packet) {
    this.of(packet.endpoint).onPacket(packet);
  };

  /**
   * Handles an error.
   *
   * @api private
   */

  Socket.prototype.onError = function (err) {
    if (err && err.advice) {
      if (err.advice === 'reconnect' && (this.connected || this.connecting)) {
        this.disconnect();
        if (this.options.reconnect) {
          this.reconnect();
        }
      }
    }

    this.publish('error', err && err.reason ? err.reason : err);
  };

  /**
   * Called when the transport disconnects.
   *
   * @api private
   */

  Socket.prototype.onDisconnect = function (reason) {
    var wasConnected = this.connected
      , wasConnecting = this.connecting;

    this.connected = false;
    this.connecting = false;
    this.open = false;

    if (wasConnected || wasConnecting) {
      this.transport.close();
      this.transport.clearTimeouts();
      if (wasConnected) {
        this.publish('disconnect', reason);

        if ('booted' != reason && this.options.reconnect && !this.reconnecting) {
          this.reconnect();
        }
      }
    }
  };

  /**
   * Called upon reconnection.
   *
   * @api private
   */

  Socket.prototype.reconnect = function () {
    this.reconnecting = true;
    this.reconnectionAttempts = 0;
    this.reconnectionDelay = this.options['reconnection delay'];

    var self = this
      , maxAttempts = this.options['max reconnection attempts']
      , tryMultiple = this.options['try multiple transports']
      , limit = this.options['reconnection limit'];

    function reset () {
      if (self.connected) {
        for (var i in self.namespaces) {
          if (self.namespaces.hasOwnProperty(i) && '' !== i) {
              self.namespaces[i].packet({ type: 'connect' });
          }
        }
        self.publish('reconnect', self.transport.name, self.reconnectionAttempts);
      }

      clearTimeout(self.reconnectionTimer);

      self.removeListener('connect_failed', maybeReconnect);
      self.removeListener('connect', maybeReconnect);

      self.reconnecting = false;

      delete self.reconnectionAttempts;
      delete self.reconnectionDelay;
      delete self.reconnectionTimer;
      delete self.redoTransports;

      self.options['try multiple transports'] = tryMultiple;
    };

    function maybeReconnect () {
      if (!self.reconnecting) {
        return;
      }

      if (self.connected) {
        return reset();
      };

      if (self.connecting && self.reconnecting) {
        return self.reconnectionTimer = setTimeout(maybeReconnect, 1000);
      }

      if (self.reconnectionAttempts++ >= maxAttempts) {
        if (!self.redoTransports) {
          self.on('connect_failed', maybeReconnect);
          self.options['try multiple transports'] = true;
          self.transport = self.getTransport();
          self.redoTransports = true;
          self.connect();
        } else {
          self.publish('reconnect_failed');
          reset();
        }
      } else {
        if (self.reconnectionDelay < limit) {
          self.reconnectionDelay *= 2; // exponential back off
        }

        self.connect();
        self.publish('reconnecting', self.reconnectionDelay, self.reconnectionAttempts);
        self.reconnectionTimer = setTimeout(maybeReconnect, self.reconnectionDelay);
      }
    };

    this.options['try multiple transports'] = false;
    this.reconnectionTimer = setTimeout(maybeReconnect, this.reconnectionDelay);

    this.on('connect', maybeReconnect);
  };

})(
    'undefined' != typeof io ? io : module.exports
  , 'undefined' != typeof io ? io : module.parent.exports
  , this
);
/**
 * socket.io
 * Copyright(c) 2011 LearnBoost <dev@learnboost.com>
 * MIT Licensed
 */

(function (exports, io) {

  /**
   * Expose constructor.
   */

  exports.SocketNamespace = SocketNamespace;

  /**
   * Socket namespace constructor.
   *
   * @constructor
   * @api public
   */

  function SocketNamespace (socket, name) {
    this.socket = socket;
    this.name = name || '';
    this.flags = {};
    this.json = new Flag(this, 'json');
    this.ackPackets = 0;
    this.acks = {};
  };

  /**
   * Apply EventEmitter mixin.
   */

  io.util.mixin(SocketNamespace, io.EventEmitter);

  /**
   * Copies emit since we override it
   *
   * @api private
   */

  SocketNamespace.prototype.$emit = io.EventEmitter.prototype.emit;

  /**
   * Creates a new namespace, by proxying the request to the socket. This
   * allows us to use the synax as we do on the server.
   *
   * @api public
   */

  SocketNamespace.prototype.of = function () {
    return this.socket.of.apply(this.socket, arguments);
  };

  /**
   * Sends a packet.
   *
   * @api private
   */

  SocketNamespace.prototype.packet = function (packet) {
    packet.endpoint = this.name;
    this.socket.packet(packet);
    this.flags = {};
    return this;
  };

  /**
   * Sends a message
   *
   * @api public
   */

  SocketNamespace.prototype.send = function (data, fn) {
    var packet = {
        type: this.flags.json ? 'json' : 'message'
      , data: data
    };

    if ('function' == typeof fn) {
      packet.id = ++this.ackPackets;
      packet.ack = true;
      this.acks[packet.id] = fn;
    }

    return this.packet(packet);
  };

  /**
   * Emits an event
   *
   * @api public
   */
  
  SocketNamespace.prototype.emit = function (name) {
    var args = Array.prototype.slice.call(arguments, 1)
      , lastArg = args[args.length - 1]
      , packet = {
            type: 'event'
          , name: name
        };

    if ('function' == typeof lastArg) {
      packet.id = ++this.ackPackets;
      packet.ack = 'data';
      this.acks[packet.id] = lastArg;
      args = args.slice(0, args.length - 1);
    }

    packet.args = args;

    return this.packet(packet);
  };

  /**
   * Disconnects the namespace
   *
   * @api private
   */

  SocketNamespace.prototype.disconnect = function () {
    if (this.name === '') {
      this.socket.disconnect();
    } else {
      this.packet({ type: 'disconnect' });
      this.$emit('disconnect');
    }

    return this;
  };

  /**
   * Handles a packet
   *
   * @api private
   */

  SocketNamespace.prototype.onPacket = function (packet) {
    var self = this;

    function ack () {
      self.packet({
          type: 'ack'
        , args: io.util.toArray(arguments)
        , ackId: packet.id
      });
    };

    switch (packet.type) {
      case 'connect':
        this.$emit('connect');
        break;

      case 'disconnect':
        if (this.name === '') {
          this.socket.onDisconnect(packet.reason || 'booted');
        } else {
          this.$emit('disconnect', packet.reason);
        }
        break;

      case 'message':
      case 'json':
        var params = ['message', packet.data];

        if (packet.ack == 'data') {
          params.push(ack);
        } else if (packet.ack) {
          this.packet({ type: 'ack', ackId: packet.id });
        }

        this.$emit.apply(this, params);
        break;

      case 'event':
        var params = [packet.name].concat(packet.args);

        if (packet.ack == 'data')
          params.push(ack);

        this.$emit.apply(this, params);
        break;

      case 'ack':
        if (this.acks[packet.ackId]) {
          this.acks[packet.ackId].apply(this, packet.args);
          delete this.acks[packet.ackId];
        }
        break;

      case 'error':
        if (packet.advice){
          this.socket.onError(packet);
        } else {
          if (packet.reason == 'unauthorized') {
            this.$emit('connect_failed', packet.reason);
          } else {
            this.$emit('error', packet.reason);
          }
        }
        break;
    }
  };

  /**
   * Flag interface.
   *
   * @api private
   */

  function Flag (nsp, name) {
    this.namespace = nsp;
    this.name = name;
  };

  /**
   * Send a message
   *
   * @api public
   */

  Flag.prototype.send = function () {
    this.namespace.flags[this.name] = true;
    this.namespace.send.apply(this.namespace, arguments);
  };

  /**
   * Emit an event
   *
   * @api public
   */

  Flag.prototype.emit = function () {
    this.namespace.flags[this.name] = true;
    this.namespace.emit.apply(this.namespace, arguments);
  };

})(
    'undefined' != typeof io ? io : module.exports
  , 'undefined' != typeof io ? io : module.parent.exports
);

/**
 * socket.io
 * Copyright(c) 2011 LearnBoost <dev@learnboost.com>
 * MIT Licensed
 */

(function (exports, io, global) {

  /**
   * Expose constructor.
   */

  exports.websocket = WS;

  /**
   * The WebSocket transport uses the HTML5 WebSocket API to establish an
   * persistent connection with the Socket.IO server. This transport will also
   * be inherited by the FlashSocket fallback as it provides a API compatible
   * polyfill for the WebSockets.
   *
   * @constructor
   * @extends {io.Transport}
   * @api public
   */

  function WS (socket) {
    io.Transport.apply(this, arguments);
  };

  /**
   * Inherits from Transport.
   */

  io.util.inherit(WS, io.Transport);

  /**
   * Transport name
   *
   * @api public
   */

  WS.prototype.name = 'websocket';

  /**
   * Initializes a new `WebSocket` connection with the Socket.IO server. We attach
   * all the appropriate listeners to handle the responses from the server.
   *
   * @returns {Transport}
   * @api public
   */

  WS.prototype.open = function () {
    var query = io.util.query(this.socket.options.query)
      , self = this
      , Socket


    if (!Socket) {
      Socket = global.MozWebSocket || global.WebSocket;
    }

    this.websocket = new Socket(this.prepareUrl() + query);

    this.websocket.onopen = function () {
      self.onOpen();
      self.socket.setBuffer(false);
    };
    this.websocket.onmessage = function (ev) {
      self.onData(ev.data);
    };
    this.websocket.onclose = function () {
      self.onClose();
      self.socket.setBuffer(true);
    };
    this.websocket.onerror = function (e) {
      self.onError(e);
    };

    return this;
  };

  /**
   * Send a message to the Socket.IO server. The message will automatically be
   * encoded in the correct message format.
   *
   * @returns {Transport}
   * @api public
   */

  WS.prototype.send = function (data) {
    this.websocket.send(data);
    return this;
  };

  /**
   * Payload
   *
   * @api private
   */

  WS.prototype.payload = function (arr) {
    for (var i = 0, l = arr.length; i < l; i++) {
      this.packet(arr[i]);
    }
    return this;
  };

  /**
   * Disconnect the established `WebSocket` connection.
   *
   * @returns {Transport}
   * @api public
   */

  WS.prototype.close = function () {
    this.websocket.close();
    return this;
  };

  /**
   * Handle the errors that `WebSocket` might be giving when we
   * are attempting to connect or send messages.
   *
   * @param {Error} e The error.
   * @api private
   */

  WS.prototype.onError = function (e) {
    this.socket.onError(e);
  };

  /**
   * Returns the appropriate scheme for the URI generation.
   *
   * @api private
   */
  WS.prototype.scheme = function () {
    return this.socket.options.secure ? 'wss' : 'ws';
  };

  /**
   * Checks if the browser has support for native `WebSockets` and that
   * it's not the polyfill created for the FlashSocket transport.
   *
   * @return {Boolean}
   * @api public
   */

  WS.check = function () {
    return ('WebSocket' in global && !('__addTask' in WebSocket))
          || 'MozWebSocket' in global;
  };

  /**
   * Check if the `WebSocket` transport support cross domain communications.
   *
   * @returns {Boolean}
   * @api public
   */

  WS.xdomainCheck = function () {
    return true;
  };

  /**
   * Add the transport to your public io.transports array.
   *
   * @api private
   */

  io.transports.push('websocket');

})(
    'undefined' != typeof io ? io.Transport : module.exports
  , 'undefined' != typeof io ? io : module.parent.exports
  , this
);

/**
 * socket.io
 * Copyright(c) 2011 LearnBoost <dev@learnboost.com>
 * MIT Licensed
 */

(function (exports, io, global) {

  /**
   * Expose constructor.
   *
   * @api public
   */

  exports.XHR = XHR;

  /**
   * XHR constructor
   *
   * @costructor
   * @api public
   */

  function XHR (socket) {
    if (!socket) return;

    io.Transport.apply(this, arguments);
    this.sendBuffer = [];
  };

  /**
   * Inherits from Transport.
   */

  io.util.inherit(XHR, io.Transport);

  /**
   * Establish a connection
   *
   * @returns {Transport}
   * @api public
   */

  XHR.prototype.open = function () {
    this.socket.setBuffer(false);
    this.onOpen();
    this.get();

    // we need to make sure the request succeeds since we have no indication
    // whether the request opened or not until it succeeded.
    this.setCloseTimeout();

    return this;
  };

  /**
   * Check if we need to send data to the Socket.IO server, if we have data in our
   * buffer we encode it and forward it to the `post` method.
   *
   * @api private
   */

  XHR.prototype.payload = function (payload) {
    var msgs = [];

    for (var i = 0, l = payload.length; i < l; i++) {
      msgs.push(io.parser.encodePacket(payload[i]));
    }

    this.send(io.parser.encodePayload(msgs));
  };

  /**
   * Send data to the Socket.IO server.
   *
   * @param data The message
   * @returns {Transport}
   * @api public
   */

  XHR.prototype.send = function (data) {
    this.post(data);
    return this;
  };

  /**
   * Posts a encoded message to the Socket.IO server.
   *
   * @param {String} data A encoded message.
   * @api private
   */

  function empty () { };

  XHR.prototype.post = function (data) {
    var self = this;
    this.socket.setBuffer(true);

    function stateChange () {
      if (this.readyState == 4) {
        this.onreadystatechange = empty;
        self.posting = false;

        if (this.status == 200){
          self.socket.setBuffer(false);
        } else {
          self.onClose();
        }
      }
    }

    function onload () {
      this.onload = empty;
      self.socket.setBuffer(false);
    };

    this.sendXHR = this.request('POST');

    if (global.XDomainRequest && this.sendXHR instanceof XDomainRequest) {
      this.sendXHR.onload = this.sendXHR.onerror = onload;
    } else {
      this.sendXHR.onreadystatechange = stateChange;
    }

    this.sendXHR.send(data);
  };

  /**
   * Disconnects the established `XHR` connection.
   *
   * @returns {Transport}
   * @api public
   */

  XHR.prototype.close = function () {
    this.onClose();
    return this;
  };

  /**
   * Generates a configured XHR request
   *
   * @param {String} url The url that needs to be requested.
   * @param {String} method The method the request should use.
   * @returns {XMLHttpRequest}
   * @api private
   */

  XHR.prototype.request = function (method) {
    var req = io.util.request(this.socket.isXDomain())
      , query = io.util.query(this.socket.options.query, 't=' + +new Date);

    req.open(method || 'GET', this.prepareUrl() + query, true);

    if (method == 'POST') {
      try {
        if (req.setRequestHeader) {
          req.setRequestHeader('Content-type', 'text/plain;charset=UTF-8');
        } else {
          // XDomainRequest
          req.contentType = 'text/plain';
        }
      } catch (e) {}
    }

    return req;
  };

  /**
   * Returns the scheme to use for the transport URLs.
   *
   * @api private
   */

  XHR.prototype.scheme = function () {
    return this.socket.options.secure ? 'https' : 'http';
  };

  /**
   * Check if the XHR transports are supported
   *
   * @param {Boolean} xdomain Check if we support cross domain requests.
   * @returns {Boolean}
   * @api public
   */

  XHR.check = function (socket, xdomain) {
    try {
      var request = io.util.request(xdomain),
          usesXDomReq = (global.XDomainRequest && request instanceof XDomainRequest),
          socketProtocol = (socket && socket.options && socket.options.secure ? 'https:' : 'http:'),
          isXProtocol = (socketProtocol != global.location.protocol);
      if (request && !(usesXDomReq && isXProtocol)) {
        return true;
      }
    } catch(e) {}

    return false;
  };

  /**
   * Check if the XHR transport supports cross domain requests.
   *
   * @returns {Boolean}
   * @api public
   */

  XHR.xdomainCheck = function () {
    return XHR.check(null, true);
  };

})(
    'undefined' != typeof io ? io.Transport : module.exports
  , 'undefined' != typeof io ? io : module.parent.exports
  , this
);

/**
 * socket.io
 * Copyright(c) 2011 LearnBoost <dev@learnboost.com>
 * MIT Licensed
 */

(function (exports, io, global) {

  /**
   * Expose constructor.
   */

  exports['xhr-polling'] = XHRPolling;

  /**
   * The XHR-polling transport uses long polling XHR requests to create a
   * "persistent" connection with the server.
   *
   * @constructor
   * @api public
   */

  function XHRPolling () {
    io.Transport.XHR.apply(this, arguments);
  };

  /**
   * Inherits from XHR transport.
   */

  io.util.inherit(XHRPolling, io.Transport.XHR);

  /**
   * Merge the properties from XHR transport
   */

  io.util.merge(XHRPolling, io.Transport.XHR);

  /**
   * Transport name
   *
   * @api public
   */

  XHRPolling.prototype.name = 'xhr-polling';

  /** 
   * Establish a connection, for iPhone and Android this will be done once the page
   * is loaded.
   *
   * @returns {Transport} Chaining.
   * @api public
   */

  XHRPolling.prototype.open = function () {
    var self = this;

    io.Transport.XHR.prototype.open.call(self);
    return false;
  };

  /**
   * Starts a XHR request to wait for incoming messages.
   *
   * @api private
   */

  function empty () {};

  XHRPolling.prototype.get = function () {
    if (!this.open) return;

    var self = this;

    function stateChange () {
      if (this.readyState == 4) {
        this.onreadystatechange = empty;

        if (this.status == 200) {
          self.onData(this.responseText);
          self.get();
        } else {
          self.onClose();
        }
      }
    };

    function onload () {
      this.onload = empty;
      this.onerror = empty;
      self.onData(this.responseText);
      self.get();
    };

    function onerror () {
      self.onClose();
    };

    this.xhr = this.request();

    if (global.XDomainRequest && this.xhr instanceof XDomainRequest) {
      this.xhr.onload = onload;
      this.xhr.onerror = onerror;
    } else {
      this.xhr.onreadystatechange = stateChange;
    }

    this.xhr.send(null);
  };

  /**
   * Handle the unclean close behavior.
   *
   * @api private
   */

  XHRPolling.prototype.onClose = function () {
    io.Transport.XHR.prototype.onClose.call(this);

    if (this.xhr) {
      this.xhr.onreadystatechange = this.xhr.onload = this.xhr.onerror = empty;
      try {
        this.xhr.abort();
      } catch(e){}
      this.xhr = null;
    }
  };

  /**
   * Webkit based browsers show a infinit spinner when you start a XHR request
   * before the browsers onload event is called so we need to defer opening of
   * the transport until the onload event is called. Wrapping the cb in our
   * defer method solve this.
   *
   * @param {Socket} socket The socket instance that needs a transport
   * @param {Function} fn The callback
   * @api private
   */

  XHRPolling.prototype.ready = function (socket, fn) {
    var self = this;

    io.util.defer(function () {
      fn.call(self);
    });
  };

  /**
   * Add the transport to your public io.transports array.
   *
   * @api private
   */

  io.transports.push('xhr-polling');

})(
    'undefined' != typeof io ? io.Transport : module.exports
  , 'undefined' != typeof io ? io : module.parent.exports
  , this
);
;var require = function (file, cwd) {
    var resolved = require.resolve(file, cwd || '/');
    var mod = require.modules[resolved];
    if (!mod) throw new Error(
        'Failed to resolve module ' + file + ', tried ' + resolved
    );
    var res = mod._cached ? mod._cached : mod();
    return res;
}

require.paths = [];
require.modules = {};
require.extensions = [".js",".coffee"];

require._core = {
    'assert': true,
    'events': true,
    'fs': true,
    'path': true,
    'vm': true
};

require.resolve = (function () {
    return function (x, cwd) {
        if (!cwd) cwd = '/';
        
        if (require._core[x]) return x;
        var path = require.modules.path();
        cwd = path.resolve('/', cwd);
        var y = cwd || '/';
        
        if (x.match(/^(?:\.\.?\/|\/)/)) {
            var m = loadAsFileSync(path.resolve(y, x))
                || loadAsDirectorySync(path.resolve(y, x));
            if (m) return m;
        }
        
        var n = loadNodeModulesSync(x, y);
        if (n) return n;
        
        throw new Error("Cannot find module '" + x + "'");
        
        function loadAsFileSync (x) {
            if (require.modules[x]) {
                return x;
            }
            
            for (var i = 0; i < require.extensions.length; i++) {
                var ext = require.extensions[i];
                if (require.modules[x + ext]) return x + ext;
            }
        }
        
        function loadAsDirectorySync (x) {
            x = x.replace(/\/+$/, '');
            var pkgfile = x + '/package.json';
            if (require.modules[pkgfile]) {
                var pkg = require.modules[pkgfile]();
                var b = pkg.browserify;
                if (typeof b === 'object' && b.main) {
                    var m = loadAsFileSync(path.resolve(x, b.main));
                    if (m) return m;
                }
                else if (typeof b === 'string') {
                    var m = loadAsFileSync(path.resolve(x, b));
                    if (m) return m;
                }
                else if (pkg.main) {
                    var m = loadAsFileSync(path.resolve(x, pkg.main));
                    if (m) return m;
                }
            }
            
            return loadAsFileSync(x + '/index');
        }
        
        function loadNodeModulesSync (x, start) {
            var dirs = nodeModulesPathsSync(start);
            for (var i = 0; i < dirs.length; i++) {
                var dir = dirs[i];
                var m = loadAsFileSync(dir + '/' + x);
                if (m) return m;
                var n = loadAsDirectorySync(dir + '/' + x);
                if (n) return n;
            }
            
            var m = loadAsFileSync(x);
            if (m) return m;
        }
        
        function nodeModulesPathsSync (start) {
            var parts;
            if (start === '/') parts = [ '' ];
            else parts = path.normalize(start).split('/');
            
            var dirs = [];
            for (var i = parts.length - 1; i >= 0; i--) {
                if (parts[i] === 'node_modules') continue;
                var dir = parts.slice(0, i + 1).join('/') + '/node_modules';
                dirs.push(dir);
            }
            
            return dirs;
        }
    };
})();

require.alias = function (from, to) {
    var path = require.modules.path();
    var res = null;
    try {
        res = require.resolve(from + '/package.json', '/');
    }
    catch (err) {
        res = require.resolve(from, '/');
    }
    var basedir = path.dirname(res);
    
    var keys = (Object.keys || function (obj) {
        var res = [];
        for (var key in obj) res.push(key)
        return res;
    })(require.modules);
    
    for (var i = 0; i < keys.length; i++) {
        var key = keys[i];
        if (key.slice(0, basedir.length + 1) === basedir + '/') {
            var f = key.slice(basedir.length);
            require.modules[to + f] = require.modules[basedir + f];
        }
        else if (key === basedir) {
            require.modules[to] = require.modules[basedir];
        }
    }
};

require.define = function (filename, fn) {
    var dirname = require._core[filename]
        ? ''
        : require.modules.path().dirname(filename)
    ;
    
    var require_ = function (file) {
        return require(file, dirname)
    };
    require_.resolve = function (name) {
        return require.resolve(name, dirname);
    };
    require_.modules = require.modules;
    require_.define = require.define;
    var module_ = { exports : {} };
    
    require.modules[filename] = function () {
        require.modules[filename]._cached = module_.exports;
        fn.call(
            module_.exports,
            require_,
            module_,
            module_.exports,
            dirname,
            filename
        );
        require.modules[filename]._cached = module_.exports;
        return module_.exports;
    };
};

if (typeof process === 'undefined') process = {};

if (!process.nextTick) process.nextTick = (function () {
    var queue = [];
    var canPost = typeof window !== 'undefined'
        && window.postMessage && window.addEventListener
    ;
    
    if (canPost) {
        window.addEventListener('message', function (ev) {
            if (ev.source === window && ev.data === 'browserify-tick') {
                ev.stopPropagation();
                if (queue.length > 0) {
                    var fn = queue.shift();
                    fn();
                }
            }
        }, true);
    }
    
    return function (fn) {
        if (canPost) {
            queue.push(fn);
            window.postMessage('browserify-tick', '*');
        }
        else setTimeout(fn, 0);
    };
})();

if (!process.title) process.title = 'browser';

if (!process.binding) process.binding = function (name) {
    if (name === 'evals') return require('vm')
    else throw new Error('No such module')
};

if (!process.cwd) process.cwd = function () { return '.' };

if (!process.env) process.env = {};
if (!process.argv) process.argv = [];

require.define("path", Function(
    [ 'require', 'module', 'exports', '__dirname', '__filename' ],
    "function filter (xs, fn) {\n    var res = [];\n    for (var i = 0; i < xs.length; i++) {\n        if (fn(xs[i], i, xs)) res.push(xs[i]);\n    }\n    return res;\n}\n\n// resolves . and .. elements in a path array with directory names there\n// must be no slashes, empty elements, or device names (c:\\) in the array\n// (so also no leading and trailing slashes - it does not distinguish\n// relative and absolute paths)\nfunction normalizeArray(parts, allowAboveRoot) {\n  // if the path tries to go above the root, `up` ends up > 0\n  var up = 0;\n  for (var i = parts.length; i >= 0; i--) {\n    var last = parts[i];\n    if (last == '.') {\n      parts.splice(i, 1);\n    } else if (last === '..') {\n      parts.splice(i, 1);\n      up++;\n    } else if (up) {\n      parts.splice(i, 1);\n      up--;\n    }\n  }\n\n  // if the path is allowed to go above the root, restore leading ..s\n  if (allowAboveRoot) {\n    for (; up--; up) {\n      parts.unshift('..');\n    }\n  }\n\n  return parts;\n}\n\n// Regex to split a filename into [*, dir, basename, ext]\n// posix version\nvar splitPathRe = /^(.+\\/(?!$)|\\/)?((?:.+?)?(\\.[^.]*)?)$/;\n\n// path.resolve([from ...], to)\n// posix version\nexports.resolve = function() {\nvar resolvedPath = '',\n    resolvedAbsolute = false;\n\nfor (var i = arguments.length; i >= -1 && !resolvedAbsolute; i--) {\n  var path = (i >= 0)\n      ? arguments[i]\n      : process.cwd();\n\n  // Skip empty and invalid entries\n  if (typeof path !== 'string' || !path) {\n    continue;\n  }\n\n  resolvedPath = path + '/' + resolvedPath;\n  resolvedAbsolute = path.charAt(0) === '/';\n}\n\n// At this point the path should be resolved to a full absolute path, but\n// handle relative paths to be safe (might happen when process.cwd() fails)\n\n// Normalize the path\nresolvedPath = normalizeArray(filter(resolvedPath.split('/'), function(p) {\n    return !!p;\n  }), !resolvedAbsolute).join('/');\n\n  return ((resolvedAbsolute ? '/' : '') + resolvedPath) || '.';\n};\n\n// path.normalize(path)\n// posix version\nexports.normalize = function(path) {\nvar isAbsolute = path.charAt(0) === '/',\n    trailingSlash = path.slice(-1) === '/';\n\n// Normalize the path\npath = normalizeArray(filter(path.split('/'), function(p) {\n    return !!p;\n  }), !isAbsolute).join('/');\n\n  if (!path && !isAbsolute) {\n    path = '.';\n  }\n  if (path && trailingSlash) {\n    path += '/';\n  }\n  \n  return (isAbsolute ? '/' : '') + path;\n};\n\n\n// posix version\nexports.join = function() {\n  var paths = Array.prototype.slice.call(arguments, 0);\n  return exports.normalize(filter(paths, function(p, index) {\n    return p && typeof p === 'string';\n  }).join('/'));\n};\n\n\nexports.dirname = function(path) {\n  var dir = splitPathRe.exec(path)[1] || '';\n  var isWindows = false;\n  if (!dir) {\n    // No dirname\n    return '.';\n  } else if (dir.length === 1 ||\n      (isWindows && dir.length <= 3 && dir.charAt(1) === ':')) {\n    // It is just a slash or a drive letter with a slash\n    return dir;\n  } else {\n    // It is a full dirname, strip trailing slash\n    return dir.substring(0, dir.length - 1);\n  }\n};\n\n\nexports.basename = function(path, ext) {\n  var f = splitPathRe.exec(path)[2] || '';\n  // TODO: make this comparison case-insensitive on windows?\n  if (ext && f.substr(-1 * ext.length) === ext) {\n    f = f.substr(0, f.length - ext.length);\n  }\n  return f;\n};\n\n\nexports.extname = function(path) {\n  return splitPathRe.exec(path)[3] || '';\n};\n\n//@ sourceURL=path"
));

require.define("/index.js", Function(
    [ 'require', 'module', 'exports', '__dirname', '__filename' ],
    "var podzim = require('derby').createApp(module)\n  , get = podzim.get\n  , view = podzim.view\n  , ready = podzim.ready\n  , start\n\n// ROUTES //\n\nstart = +new Date()\n\n// Derby routes can be rendered on the client and the server\n/*get('/:roomName?', function(page, model, params) {\n  var roomName = params.roomName || 'home'\n\n  // Subscribes the model to any updates on this room's object. Calls back\n  // with a scoped model equivalent to:\n  //   room = model.at('rooms.' + roomName)\n  model.subscribe('rooms.' + roomName, function(err, room) {\n    model.ref('_room', room)\n\n    // setNull will set a value if the object is currently null or undefined\n    room.setNull('welcome', 'Welcome to ' + roomName + '!')\n\n    room.incr('visits')\n\n    // This value is set for when the page initially renders\n    model.set('_timer', '0.0')\n    // Reset the counter when visiting a new route client-side\n    start = +new Date()\n\n    // Render will use the model data as well as an optional context object\n    page.render({\n      roomName: roomName\n    , randomUrl: parseInt(Math.random() * 1e9).toString(36)\n    })\n  })\n})*/\n\npodzim.get('/videos/:id', function(page, model, params){\n  var id = params.id;\n  if(!id) page.render('404', {url : 'a'});\n\n  model.unsubscribe();\n\n  model.subscribe('videos.' + id, function(err, video){\n    model.ref('_video', video);\n\n    video.at('visitors').push(model.get('user'));\n\n    function onDisconnect(){\n      var visitors = model.get('videos.' + id + '.visitors');\n      for(var i=0, len=visitors.length; i<len; i++){\n        if(visitors.email === model.get('user.email')){\n          visitors.splice(i, 1);\n        }\n      }\n\n      model.set('videos.' + id + '.visitors', visitors);\n\n      model.socket.removeListener('disconnect', onDisconnect);\n    }\n\n    model.socket.on('disconnect', onDisconnect);\n\n    page.render('videos/view', {});\n  });\n});\n\npodzim.get('/videos/:q?', function(page, model, params){\n  var q = params.q;\n\n  if(q){\n    // request to youtube api to get back videos (old podzim.search) TODO\n    Helper.search(q, function(err, videos){\n      model.ref('_search', videos);\n    });\n  }else{\n    // render default search page\n  }\n});\n\n// CONTROLLER FUNCTIONS //\n\nready(function(model) {\n  var timer\n\n  // Expose the model as a global variable in the browser. This is fun in\n  // development, but it should be removed when writing an app\n  window.model = model\n\n  // Exported functions are exposed as a global in the browser with the same\n  // name as the module that includes Derby. They can also be bound to DOM\n  // events using the \"x-bind\" attribute in a template.\n  exports.stop = function() {\n\n    // Any path name that starts with an underscore is private to the current\n    // client. Nothing set under a private path is synced back to the server.\n    model.set('_stopped', true)\n    clearInterval(timer)\n  }\n\n  exports.start = function() {\n    model.set('_stopped', false)\n    timer = setInterval(function() {\n      model.set('_timer', (((+new Date()) - start) / 1000).toFixed(1))\n    }, 100)\n  }\n  exports.start()\n\n\n  model.set('_showReconnect', true)\n  exports.connect = function() {\n    // Hide the reconnect link for a second after clicking it\n    model.set('_showReconnect', false)\n    setTimeout(function() {\n      model.set('_showReconnect', true)\n    }, 1000)\n    model.socket.socket.connect()\n  }\n\n  exports.reload = function() {\n    window.location.reload()\n  }\n\n})\n\n//@ sourceURL=/index.js"
));

require.define("/node_modules/derby/package.json", Function(
    [ 'require', 'module', 'exports', '__dirname', '__filename' ],
    "module.exports = {\"main\":\"./lib/derby.js\",\"browserify\":{\"main\":\"./lib/derby.browser.js\"}}\n//@ sourceURL=/node_modules/derby/package.json"
));

require.define("/node_modules/derby/lib/derby.browser.js", Function(
    [ 'require', 'module', 'exports', '__dirname', '__filename' ],
    "var racer = require('racer')\n  , tracks = require('tracks')\n  , derbyModel = require('./derby.Model')\n  , Dom = require('./Dom')\n  , View = require('./View')\n  , autoRefresh = require('./refresh').autoRefresh;\n\nexports.createApp = createApp;\n\nfunction createApp(appModule) {\n  var appExports = appModule.exports\n    , view, model;\n\n  appModule.exports = function(modelBundle, appHash, debug, ns, ctx) {\n    tracks.set('debug', debug);\n\n    // The init event is fired after the model data is initialized but\n    // before the socket object is set\n    racer.on('init', function(_model) {\n      model = view.model = _model;\n      var dom = view.dom = new Dom(model, appExports);\n      derbyModel.init(model, dom, view);\n      // Ignore errors thrown when rendering; these will also be thrown\n      // on the server, and throwing here causes the app not to connect\n      try {\n        // Render immediately upon initialization so that the page is in\n        // the same state it was when rendered on the server\n        view.render(model, ns, ctx, true);\n      } catch (err) {}\n    });\n\n    // The ready event is fired after the model data is initialized and\n    // the socket object is set\n    if (debug) {\n      racer.on('ready', function(model) {\n        autoRefresh(view, model, appHash);\n      });\n    }\n    racer.init(modelBundle);\n    return appExports;\n  };\n\n  // Expose methods on the application module. Note that view must added\n  // to both appModule.exports and appExports, since it is used before\n  // the initialization function to make templates\n  appModule.exports.view = appExports.view = view = new View;\n\n  function createPage() {\n    return {\n      render: function(ns, ctx) {\n        view.render(model, ns, ctx);\n      }\n    };\n  }\n  function onRoute(callback, page, params, next, isTransitional) {\n    if (isTransitional) {\n      callback(model, params, next);\n    } else {\n      callback(page, model, params, next);\n    }\n  }\n  tracks.setup(appExports, createPage, onRoute);\n  view.history = appExports.history;\n\n  appExports.ready = function(fn) {\n    racer.on('ready', fn);\n  };\n  return appExports;\n};\n\n//@ sourceURL=/node_modules/derby/lib/derby.browser.js"
));

require.define("/node_modules/racer/package.json", Function(
    [ 'require', 'module', 'exports', '__dirname', '__filename' ],
    "module.exports = {\"main\":\"./lib/racer.js\"}\n//@ sourceURL=/node_modules/racer/package.json"
));

require.define("/node_modules/racer/lib/racer.js", Function(
    [ 'require', 'module', 'exports', '__dirname', '__filename' ],
    "// Generated by CoffeeScript 1.3.1\nvar EventEmitter, isServer, mergeAll, plugin, racer, util, _ref;\n\n_ref = util = require('./util'), mergeAll = _ref.mergeAll, isServer = _ref.isServer;\n\nif (!isServer) {\n  require('es5-shim');\n}\n\nEventEmitter = require('events').EventEmitter;\n\nplugin = require('./plugin');\n\nracer = module.exports = new EventEmitter;\n\nmergeAll(racer, plugin, {\n  \"protected\": {\n    Model: require('./Model')\n  },\n  util: util\n});\n\nif (isServer) {\n  racer.use(__dirname + '/racer.server');\n}\n\nracer.use(require('./mutators')).use(require('./refs')).use(require('./pubSub')).use(require('./txns'));\n\nif (isServer) {\n  racer.use(__dirname + '/adapters/pubsub-memory');\n}\n\nif (!isServer) {\n  racer.use(require('./racer.browser'));\n}\n\n//@ sourceURL=/node_modules/racer/lib/racer.js"
));

require.define("/node_modules/racer/lib/util/index.js", Function(
    [ 'require', 'module', 'exports', '__dirname', '__filename' ],
    "// Generated by CoffeeScript 1.3.1\nvar deepCopy, deepEqual, equalsNaN, indexOf, isArguments, isServer, objEquiv, toString,\n  __slice = [].slice;\n\ntoString = Object.prototype.toString;\n\nmodule.exports = {\n  isServer: isServer = typeof window === 'undefined',\n  isProduction: isServer && process.env.NODE_ENV === 'production',\n  isArguments: isArguments = function(obj) {\n    return toString.call(obj) === '[object Arguments]';\n  },\n  mergeAll: function() {\n    var from, froms, key, to, _i, _len;\n    to = arguments[0], froms = 2 <= arguments.length ? __slice.call(arguments, 1) : [];\n    for (_i = 0, _len = froms.length; _i < _len; _i++) {\n      from = froms[_i];\n      if (from) {\n        for (key in from) {\n          to[key] = from[key];\n        }\n      }\n    }\n    return to;\n  },\n  merge: function(to, from) {\n    var key;\n    for (key in from) {\n      to[key] = from[key];\n    }\n    return to;\n  },\n  hasKeys: function(obj, ignore) {\n    var key;\n    for (key in obj) {\n      if (key === ignore) {\n        continue;\n      }\n      return true;\n    }\n    return false;\n  },\n  deepEqual: deepEqual = function(actual, expected) {\n    if (actual === expected) {\n      return true;\n    }\n    if (actual instanceof Date && expected instanceof Date) {\n      return actual.getTime() === expected.getTime();\n    }\n    if (typeof actual !== 'object' && typeof expected !== 'object') {\n      return actual === expected;\n    }\n    return objEquiv(actual, expected);\n  },\n  objEquiv: objEquiv = function(a, b) {\n    var i, ka, kb, key;\n    if (a == null || b == null) {\n      return false;\n    }\n    if (a.prototype !== b.prototype) {\n      return false;\n    }\n    if (isArguments(a)) {\n      if (!isArguments(b)) {\n        return false;\n      }\n      a = pSlice.call(a);\n      b = pSlice.call(b);\n      return deepEqual(a, b);\n    }\n    try {\n      ka = Object.keys(a);\n      kb = Object.keys(b);\n    } catch (e) {\n      return false;\n    }\n    if (ka.length !== kb.length) {\n      return false;\n    }\n    ka.sort();\n    kb.sort();\n    i = ka.length;\n    while (i--) {\n      if (ka[i] !== kb[i]) {\n        return false;\n      }\n    }\n    i = ka.length;\n    while (i--) {\n      key = ka[i];\n      if (!deepEqual(a[key], b[key])) {\n        return false;\n      }\n    }\n    return true;\n  },\n  deepCopy: deepCopy = function(obj) {\n    var k, ret, v, _i, _len;\n    if (typeof obj === 'object') {\n      if (Array.isArray(obj)) {\n        ret = [];\n        for (_i = 0, _len = obj.length; _i < _len; _i++) {\n          v = obj[_i];\n          ret.push(deepCopy(v));\n        }\n        return ret;\n      }\n      ret = {};\n      for (k in obj) {\n        v = obj[k];\n        ret[k] = deepCopy(v);\n      }\n      return ret;\n    }\n    return obj;\n  },\n  indexOf: indexOf = function(list, obj, isEqual) {\n    var i, v, _i, _len;\n    for (i = _i = 0, _len = list.length; _i < _len; i = ++_i) {\n      v = list[i];\n      if (isEqual(obj, v)) {\n        return i;\n      }\n    }\n    return -1;\n  },\n  deepIndexOf: function(list, obj) {\n    return indexOf(list, obj, deepEqual);\n  },\n  equalsNaN: equalsNaN = function(x) {\n    return x !== x;\n  },\n  equal: function(a, b) {\n    return a === b || (equalsNaN(a) && equalsNaN(b));\n  },\n  Promise: require('./Promise'),\n  async: require('./async')\n};\n\n//@ sourceURL=/node_modules/racer/lib/util/index.js"
));

require.define("/node_modules/racer/lib/util/Promise.js", Function(
    [ 'require', 'module', 'exports', '__dirname', '__filename' ],
    "// Generated by CoffeeScript 1.3.1\nvar Promise, finishAfter, util;\n\nutil = require('./index');\n\nfinishAfter = require('./async').finishAfter;\n\nPromise = module.exports = function() {\n  this.callbacks = [];\n  this.resolved = false;\n};\n\nPromise.prototype = {\n  resolve: function(err, value) {\n    var callback, _i, _len, _ref;\n    this.err = err;\n    this.value = value;\n    if (this.resolved) {\n      throw new Error('Promise has already been resolved');\n    }\n    this.resolved = true;\n    _ref = this.callbacks;\n    for (_i = 0, _len = _ref.length; _i < _len; _i++) {\n      callback = _ref[_i];\n      callback(err, value);\n    }\n    this.callbacks = [];\n    return this;\n  },\n  on: function(callback) {\n    if (this.resolved) {\n      callback(this.err, this.value);\n      return this;\n    }\n    this.callbacks.push(callback);\n    return this;\n  },\n  clear: function() {\n    this.resolved = false;\n    delete this.value;\n    delete this.err;\n    return this;\n  }\n};\n\nPromise.parallel = function(promises) {\n  var composite, finish, i;\n  composite = new Promise;\n  i = promises.length;\n  finish = finishAfter(i, function(err) {\n    return composite.resolve(err);\n  });\n  while (i--) {\n    promises[i].on(finish);\n  }\n  return composite;\n};\n\n//@ sourceURL=/node_modules/racer/lib/util/Promise.js"
));

require.define("/node_modules/racer/lib/util/async.js", Function(
    [ 'require', 'module', 'exports', '__dirname', '__filename' ],
    "// Generated by CoffeeScript 1.3.1\nvar finishAfter;\n\nmodule.exports = {\n  finishAfter: finishAfter = function(count, callback) {\n    var err;\n    callback || (callback = function(err) {\n      if (err) {\n        throw err;\n      }\n    });\n    if (!count) {\n      return callback;\n    }\n    err = null;\n    return function(_err) {\n      err || (err = _err);\n      return --count || callback(err);\n    };\n  },\n  forEach: function(items, fn, done) {\n    var finish, item, _i, _len;\n    finish = finishAfter(items.length, done);\n    for (_i = 0, _len = items.length; _i < _len; _i++) {\n      item = items[_i];\n      fn(item, finish);\n    }\n  },\n  bufferifyMethods: function(Klass, methodNames, _arg) {\n    var await, buffer, fns;\n    await = _arg.await;\n    fns = {};\n    buffer = null;\n    methodNames.forEach(function(methodName) {\n      fns[methodName] = Klass.prototype[methodName];\n      return Klass.prototype[methodName] = function() {\n        var didFlush, flush, _arguments,\n          _this = this;\n        _arguments = arguments;\n        didFlush = false;\n        flush = function() {\n          var args, _i, _len;\n          didFlush = true;\n          methodNames.forEach(function(methodName) {\n            return _this[methodName] = fns[methodName];\n          });\n          delete await.alredyCalled;\n          if (!buffer) {\n            return;\n          }\n          for (_i = 0, _len = buffer.length; _i < _len; _i++) {\n            args = buffer[_i];\n            fns[methodName].apply(_this, args);\n          }\n          buffer = null;\n        };\n        if (await.alredyCalled) {\n          return;\n        }\n        await.alredyCalled = true;\n        await.call(this, flush);\n        if (didFlush) {\n          return this[methodName].apply(this, _arguments);\n        }\n        this[methodName] = function() {\n          buffer || (buffer = []);\n          return buffer.push(arguments);\n        };\n        this[methodName].apply(this, arguments);\n      };\n    });\n    return {\n      bufferify: function(methodName, _arg1) {\n        var await, fn;\n        fn = _arg1.fn, await = _arg1.await;\n        buffer = null;\n        return function() {\n          var didFlush, flush, _arguments,\n            _this = this;\n          _arguments = arguments;\n          didFlush = false;\n          flush = function() {\n            var args, _i, _len;\n            didFlush = true;\n            _this[methodName] = fn;\n            if (!buffer) {\n              return;\n            }\n            for (_i = 0, _len = buffer.length; _i < _len; _i++) {\n              args = buffer[_i];\n              fn.apply(_this, args);\n            }\n            buffer = null;\n          };\n          await.call(this, flush);\n          if (didFlush) {\n            return this[methodName].apply(this, _arguments);\n          }\n          this[methodName] = function() {\n            buffer || (buffer = []);\n            return buffer.push(arguments);\n          };\n          this[methodName].apply(this, arguments);\n        };\n      }\n    };\n  }\n};\n\n//@ sourceURL=/node_modules/racer/lib/util/async.js"
));

require.define("/node_modules/es5-shim/package.json", Function(
    [ 'require', 'module', 'exports', '__dirname', '__filename' ],
    "module.exports = {\"main\":\"es5-shim.js\"}\n//@ sourceURL=/node_modules/es5-shim/package.json"
));

require.define("/node_modules/es5-shim/es5-shim.js", Function(
    [ 'require', 'module', 'exports', '__dirname', '__filename' ],
    "// vim: ts=4 sts=4 sw=4 expandtab\n// -- kriskowal Kris Kowal Copyright (C) 2009-2011 MIT License\n// -- tlrobinson Tom Robinson Copyright (C) 2009-2010 MIT License (Narwhal Project)\n// -- dantman Daniel Friesen Copyright (C) 2010 XXX TODO License or CLA\n// -- fschaefer Florian Schäfer Copyright (C) 2010 MIT License\n// -- Gozala Irakli Gozalishvili Copyright (C) 2010 MIT License\n// -- kitcambridge Kit Cambridge Copyright (C) 2011 MIT License\n// -- kossnocorp Sasha Koss XXX TODO License or CLA\n// -- bryanforbes Bryan Forbes XXX TODO License or CLA\n// -- killdream Quildreen Motta XXX TODO License or CLA\n// -- michaelficarra Michael Ficarra Copyright (C) 2011 3-clause BSD License\n// -- sharkbrainguy Gerard Paapu Copyright (C) 2011 MIT License\n// -- bbqsrc Brendan Molloy XXX TODO License or CLA\n// -- iwyg XXX TODO License or CLA\n// -- DomenicDenicola Domenic Denicola XXX TODO License or CLA\n// -- xavierm02 Montillet Xavier XXX TODO License or CLA\n// -- Raynos Raynos XXX TODO License or CLA\n// -- samsonjs Sami Samhuri XXX TODO License or CLA\n// -- rwldrn Rick Waldron XXX TODO License or CLA\n// -- lexer Alexey Zakharov XXX TODO License or CLA\n\n/*!\n    Copyright (c) 2009, 280 North Inc. http://280north.com/\n    MIT License. http://github.com/280north/narwhal/blob/master/README.md\n*/\n\n// Module systems magic dance\n(function (definition) {\n    // RequireJS\n    if (typeof define == \"function\") {\n        define(definition);\n    // CommonJS and <script>\n    } else {\n        definition();\n    }\n})(function () {\n\n/**\n * Brings an environment as close to ECMAScript 5 compliance\n * as is possible with the facilities of erstwhile engines.\n *\n * ES5 Draft\n * http://www.ecma-international.org/publications/files/drafts/tc39-2009-050.pdf\n *\n * NOTE: this is a draft, and as such, the URL is subject to change.  If the\n * link is broken, check in the parent directory for the latest TC39 PDF.\n * http://www.ecma-international.org/publications/files/drafts/\n *\n * Previous ES5 Draft\n * http://www.ecma-international.org/publications/files/drafts/tc39-2009-025.pdf\n * This is a broken link to the previous draft of ES5 on which most of the\n * numbered specification references and quotes herein were taken.  Updating\n * these references and quotes to reflect the new document would be a welcome\n * volunteer project.\n *\n * @module\n */\n\n/*whatsupdoc*/\n\n//\n// Function\n// ========\n//\n\n// ES-5 15.3.4.5\n// http://www.ecma-international.org/publications/files/drafts/tc39-2009-025.pdf\n\nif (!Function.prototype.bind) {\n    Function.prototype.bind = function bind(that) { // .length is 1\n        // 1. Let Target be the this value.\n        var target = this;\n        // 2. If IsCallable(Target) is false, throw a TypeError exception.\n        if (typeof target != \"function\")\n            throw new TypeError(); // TODO message\n        // 3. Let A be a new (possibly empty) internal list of all of the\n        //   argument values provided after thisArg (arg1, arg2 etc), in order.\n        // XXX slicedArgs will stand in for \"A\" if used\n        var args = slice.call(arguments, 1); // for normal call\n        // 4. Let F be a new native ECMAScript object.\n        // 9. Set the [[Prototype]] internal property of F to the standard\n        //   built-in Function prototype object as specified in 15.3.3.1.\n        // 10. Set the [[Call]] internal property of F as described in\n        //   15.3.4.5.1.\n        // 11. Set the [[Construct]] internal property of F as described in\n        //   15.3.4.5.2.\n        // 12. Set the [[HasInstance]] internal property of F as described in\n        //   15.3.4.5.3.\n        // 13. The [[Scope]] internal property of F is unused and need not\n        //   exist.\n        var bound = function () {\n\n            if (this instanceof bound) {\n                // 15.3.4.5.2 [[Construct]]\n                // When the [[Construct]] internal method of a function object,\n                // F that was created using the bind function is called with a\n                // list of arguments ExtraArgs the following steps are taken:\n                // 1. Let target be the value of F's [[TargetFunction]]\n                //   internal property.\n                // 2. If target has no [[Construct]] internal method, a\n                //   TypeError exception is thrown.\n                // 3. Let boundArgs be the value of F's [[BoundArgs]] internal\n                //   property.\n                // 4. Let args be a new list containing the same values as the\n                //   list boundArgs in the same order followed by the same\n                //   values as the list ExtraArgs in the same order.\n\n                var F = function(){};\n                F.prototype = target.prototype;\n                var self = new F;\n\n                var result = target.apply(\n                    self,\n                    args.concat(slice.call(arguments))\n                );\n                if (result !== null && Object(result) === result)\n                    return result;\n                return self;\n\n            } else {\n                // 15.3.4.5.1 [[Call]]\n                // When the [[Call]] internal method of a function object, F,\n                // which was created using the bind function is called with a\n                // this value and a list of arguments ExtraArgs the following\n                // steps are taken:\n                // 1. Let boundArgs be the value of F's [[BoundArgs]] internal\n                //   property.\n                // 2. Let boundThis be the value of F's [[BoundThis]] internal\n                //   property.\n                // 3. Let target be the value of F's [[TargetFunction]] internal\n                //   property.\n                // 4. Let args be a new list containing the same values as the list\n                //   boundArgs in the same order followed by the same values as\n                //   the list ExtraArgs in the same order. 5.  Return the\n                //   result of calling the [[Call]] internal method of target\n                //   providing boundThis as the this value and providing args\n                //   as the arguments.\n\n                // equiv: target.call(this, ...boundArgs, ...args)\n                return target.apply(\n                    that,\n                    args.concat(slice.call(arguments))\n                );\n\n            }\n\n        };\n        // XXX bound.length is never writable, so don't even try\n        //\n        // 16. The length own property of F is given attributes as specified in\n        //   15.3.5.1.\n        // TODO\n        // 17. Set the [[Extensible]] internal property of F to true.\n        // TODO\n        // 18. Call the [[DefineOwnProperty]] internal method of F with\n        //   arguments \"caller\", PropertyDescriptor {[[Value]]: null,\n        //   [[Writable]]: false, [[Enumerable]]: false, [[Configurable]]:\n        //   false}, and false.\n        // TODO\n        // 19. Call the [[DefineOwnProperty]] internal method of F with\n        //   arguments \"arguments\", PropertyDescriptor {[[Value]]: null,\n        //   [[Writable]]: false, [[Enumerable]]: false, [[Configurable]]:\n        //   false}, and false.\n        // TODO\n        // NOTE Function objects created using Function.prototype.bind do not\n        // have a prototype property.\n        // XXX can't delete it in pure-js.\n        return bound;\n    };\n}\n\n// Shortcut to an often accessed properties, in order to avoid multiple\n// dereference that costs universally.\n// _Please note: Shortcuts are defined after `Function.prototype.bind` as we\n// us it in defining shortcuts.\nvar call = Function.prototype.call;\nvar prototypeOfArray = Array.prototype;\nvar prototypeOfObject = Object.prototype;\nvar slice = prototypeOfArray.slice;\nvar toString = call.bind(prototypeOfObject.toString);\nvar owns = call.bind(prototypeOfObject.hasOwnProperty);\n\n// If JS engine supports accessors creating shortcuts.\nvar defineGetter;\nvar defineSetter;\nvar lookupGetter;\nvar lookupSetter;\nvar supportsAccessors;\nif ((supportsAccessors = owns(prototypeOfObject, \"__defineGetter__\"))) {\n    defineGetter = call.bind(prototypeOfObject.__defineGetter__);\n    defineSetter = call.bind(prototypeOfObject.__defineSetter__);\n    lookupGetter = call.bind(prototypeOfObject.__lookupGetter__);\n    lookupSetter = call.bind(prototypeOfObject.__lookupSetter__);\n}\n\n//\n// Array\n// =====\n//\n\n// ES5 15.4.3.2\nif (!Array.isArray) {\n    Array.isArray = function isArray(obj) {\n        return toString(obj) == \"[object Array]\";\n    };\n}\n\n// The IsCallable() check in the Array functions\n// has been replaced with a strict check on the\n// internal class of the object to trap cases where\n// the provided function was actually a regular\n// expression literal, which in V8 and\n// JavaScriptCore is a typeof \"function\".  Only in\n// V8 are regular expression literals permitted as\n// reduce parameters, so it is desirable in the\n// general case for the shim to match the more\n// strict and common behavior of rejecting regular\n// expressions.\n\n// ES5 15.4.4.18\n// https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/array/foreach\nif (!Array.prototype.forEach) {\n    Array.prototype.forEach = function forEach(fun /*, thisp*/) {\n        var self = toObject(this),\n            thisp = arguments[1],\n            i = 0,\n            length = self.length >>> 0;\n\n        // If no callback function or if callback is not a callable function\n        if (toString(fun) != \"[object Function]\") {\n            throw new TypeError(); // TODO message\n        }\n\n        while (i < length) {\n            if (i in self) {\n                // Invoke the callback function with call, passing arguments:\n                // context, property value, property key, thisArg object context\n                fun.call(thisp, self[i], i, self);\n            }\n            i++;\n        }\n    };\n}\n\n// ES5 15.4.4.19\n// https://developer.mozilla.org/en/Core_JavaScript_1.5_Reference/Objects/Array/map\nif (!Array.prototype.map) {\n    Array.prototype.map = function map(fun /*, thisp*/) {\n        var self = toObject(this),\n            length = self.length >>> 0,\n            result = Array(length),\n            thisp = arguments[1];\n\n        // If no callback function or if callback is not a callable function\n        if (toString(fun) != \"[object Function]\") {\n            throw new TypeError(); // TODO message\n        }\n\n        for (var i = 0; i < length; i++) {\n            if (i in self)\n                result[i] = fun.call(thisp, self[i], i, self);\n        }\n        return result;\n    };\n}\n\n// ES5 15.4.4.20\nif (!Array.prototype.filter) {\n    Array.prototype.filter = function filter(fun /*, thisp */) {\n        var self = toObject(this),\n            length = self.length >>> 0,\n            result = [],\n            thisp = arguments[1];\n\n        // If no callback function or if callback is not a callable function\n        if (toString(fun) != \"[object Function]\") {\n            throw new TypeError(); // TODO message\n        }\n\n        for (var i = 0; i < length; i++) {\n            if (i in self && fun.call(thisp, self[i], i, self))\n                result.push(self[i]);\n        }\n        return result;\n    };\n}\n\n// ES5 15.4.4.16\nif (!Array.prototype.every) {\n    Array.prototype.every = function every(fun /*, thisp */) {\n        var self = toObject(this),\n            length = self.length >>> 0,\n            thisp = arguments[1];\n\n        // If no callback function or if callback is not a callable function\n        if (toString(fun) != \"[object Function]\") {\n            throw new TypeError(); // TODO message\n        }\n\n        for (var i = 0; i < length; i++) {\n            if (i in self && !fun.call(thisp, self[i], i, self))\n                return false;\n        }\n        return true;\n    };\n}\n\n// ES5 15.4.4.17\n// https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Array/some\nif (!Array.prototype.some) {\n    Array.prototype.some = function some(fun /*, thisp */) {\n        var self = toObject(this),\n            length = self.length >>> 0,\n            thisp = arguments[1];\n\n        // If no callback function or if callback is not a callable function\n        if (toString(fun) != \"[object Function]\") {\n            throw new TypeError(); // TODO message\n        }\n\n        for (var i = 0; i < length; i++) {\n            if (i in self && fun.call(thisp, self[i], i, self))\n                return true;\n        }\n        return false;\n    };\n}\n\n// ES5 15.4.4.21\n// https://developer.mozilla.org/en/Core_JavaScript_1.5_Reference/Objects/Array/reduce\nif (!Array.prototype.reduce) {\n    Array.prototype.reduce = function reduce(fun /*, initial*/) {\n        var self = toObject(this),\n            length = self.length >>> 0;\n\n        // If no callback function or if callback is not a callable function\n        if (toString(fun) != \"[object Function]\") {\n            throw new TypeError(); // TODO message\n        }\n\n        // no value to return if no initial value and an empty array\n        if (!length && arguments.length == 1)\n            throw new TypeError(); // TODO message\n\n        var i = 0;\n        var result;\n        if (arguments.length >= 2) {\n            result = arguments[1];\n        } else {\n            do {\n                if (i in self) {\n                    result = self[i++];\n                    break;\n                }\n\n                // if array contains no values, no initial value to return\n                if (++i >= length)\n                    throw new TypeError(); // TODO message\n            } while (true);\n        }\n\n        for (; i < length; i++) {\n            if (i in self)\n                result = fun.call(void 0, result, self[i], i, self);\n        }\n\n        return result;\n    };\n}\n\n// ES5 15.4.4.22\n// https://developer.mozilla.org/en/Core_JavaScript_1.5_Reference/Objects/Array/reduceRight\nif (!Array.prototype.reduceRight) {\n    Array.prototype.reduceRight = function reduceRight(fun /*, initial*/) {\n        var self = toObject(this),\n            length = self.length >>> 0;\n\n        // If no callback function or if callback is not a callable function\n        if (toString(fun) != \"[object Function]\") {\n            throw new TypeError(); // TODO message\n        }\n\n        // no value to return if no initial value, empty array\n        if (!length && arguments.length == 1)\n            throw new TypeError(); // TODO message\n\n        var result, i = length - 1;\n        if (arguments.length >= 2) {\n            result = arguments[1];\n        } else {\n            do {\n                if (i in self) {\n                    result = self[i--];\n                    break;\n                }\n\n                // if array contains no values, no initial value to return\n                if (--i < 0)\n                    throw new TypeError(); // TODO message\n            } while (true);\n        }\n\n        do {\n            if (i in this)\n                result = fun.call(void 0, result, self[i], i, self);\n        } while (i--);\n\n        return result;\n    };\n}\n\n// ES5 15.4.4.14\n// https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Array/indexOf\nif (!Array.prototype.indexOf) {\n    Array.prototype.indexOf = function indexOf(sought /*, fromIndex */ ) {\n        var self = toObject(this),\n            length = self.length >>> 0;\n\n        if (!length)\n            return -1;\n\n        var i = 0;\n        if (arguments.length > 1)\n            i = toInteger(arguments[1]);\n\n        // handle negative indices\n        i = i >= 0 ? i : length - Math.abs(i);\n        for (; i < length; i++) {\n            if (i in self && self[i] === sought) {\n                return i;\n            }\n        }\n        return -1;\n    };\n}\n\n// ES5 15.4.4.15\nif (!Array.prototype.lastIndexOf) {\n    Array.prototype.lastIndexOf = function lastIndexOf(sought /*, fromIndex */) {\n        var self = toObject(this),\n            length = self.length >>> 0;\n\n        if (!length)\n            return -1;\n        var i = length - 1;\n        if (arguments.length > 1)\n            i = toInteger(arguments[1]);\n        // handle negative indices\n        i = i >= 0 ? i : length - Math.abs(i);\n        for (; i >= 0; i--) {\n            if (i in self && sought === self[i])\n                return i;\n        }\n        return -1;\n    };\n}\n\n//\n// Object\n// ======\n//\n\n// ES5 15.2.3.2\nif (!Object.getPrototypeOf) {\n    // https://github.com/kriskowal/es5-shim/issues#issue/2\n    // http://ejohn.org/blog/objectgetprototypeof/\n    // recommended by fschaefer on github\n    Object.getPrototypeOf = function getPrototypeOf(object) {\n        return object.__proto__ || (\n            object.constructor ?\n            object.constructor.prototype :\n            prototypeOfObject\n        );\n    };\n}\n\n// ES5 15.2.3.3\nif (!Object.getOwnPropertyDescriptor) {\n    var ERR_NON_OBJECT = \"Object.getOwnPropertyDescriptor called on a \" +\n                         \"non-object: \";\n    Object.getOwnPropertyDescriptor = function getOwnPropertyDescriptor(object, property) {\n        if ((typeof object != \"object\" && typeof object != \"function\") || object === null)\n            throw new TypeError(ERR_NON_OBJECT + object);\n        // If object does not owns property return undefined immediately.\n        if (!owns(object, property))\n            return;\n\n        var descriptor, getter, setter;\n\n        // If object has a property then it's for sure both `enumerable` and\n        // `configurable`.\n        descriptor =  { enumerable: true, configurable: true };\n\n        // If JS engine supports accessor properties then property may be a\n        // getter or setter.\n        if (supportsAccessors) {\n            // Unfortunately `__lookupGetter__` will return a getter even\n            // if object has own non getter property along with a same named\n            // inherited getter. To avoid misbehavior we temporary remove\n            // `__proto__` so that `__lookupGetter__` will return getter only\n            // if it's owned by an object.\n            var prototype = object.__proto__;\n            object.__proto__ = prototypeOfObject;\n\n            var getter = lookupGetter(object, property);\n            var setter = lookupSetter(object, property);\n\n            // Once we have getter and setter we can put values back.\n            object.__proto__ = prototype;\n\n            if (getter || setter) {\n                if (getter) descriptor.get = getter;\n                if (setter) descriptor.set = setter;\n\n                // If it was accessor property we're done and return here\n                // in order to avoid adding `value` to the descriptor.\n                return descriptor;\n            }\n        }\n\n        // If we got this far we know that object has an own property that is\n        // not an accessor so we set it as a value and return descriptor.\n        descriptor.value = object[property];\n        return descriptor;\n    };\n}\n\n// ES5 15.2.3.4\nif (!Object.getOwnPropertyNames) {\n    Object.getOwnPropertyNames = function getOwnPropertyNames(object) {\n        return Object.keys(object);\n    };\n}\n\n// ES5 15.2.3.5\nif (!Object.create) {\n    Object.create = function create(prototype, properties) {\n        var object;\n        if (prototype === null) {\n            object = { \"__proto__\": null };\n        } else {\n            if (typeof prototype != \"object\")\n                throw new TypeError(\"typeof prototype[\"+(typeof prototype)+\"] != 'object'\");\n            var Type = function () {};\n            Type.prototype = prototype;\n            object = new Type();\n            // IE has no built-in implementation of `Object.getPrototypeOf`\n            // neither `__proto__`, but this manually setting `__proto__` will\n            // guarantee that `Object.getPrototypeOf` will work as expected with\n            // objects created using `Object.create`\n            object.__proto__ = prototype;\n        }\n        if (properties !== void 0)\n            Object.defineProperties(object, properties);\n        return object;\n    };\n}\n\n// ES5 15.2.3.6\n\n// Patch for WebKit and IE8 standard mode\n// Designed by hax <hax.github.com>\n// related issue: https://github.com/kriskowal/es5-shim/issues#issue/5\n// IE8 Reference:\n//     http://msdn.microsoft.com/en-us/library/dd282900.aspx\n//     http://msdn.microsoft.com/en-us/library/dd229916.aspx\n// WebKit Bugs:\n//     https://bugs.webkit.org/show_bug.cgi?id=36423\n\nfunction doesDefinePropertyWork(object) {\n    try {\n        Object.defineProperty(object, \"sentinel\", {});\n        return \"sentinel\" in object;\n    } catch (exception) {\n        // returns falsy\n    }\n}\n\n// check whether defineProperty works if it's given. Otherwise,\n// shim partially.\nif (Object.defineProperty) {\n    var definePropertyWorksOnObject = doesDefinePropertyWork({});\n    var definePropertyWorksOnDom = typeof document == \"undefined\" ||\n        doesDefinePropertyWork(document.createElement(\"div\"));\n    if (!definePropertyWorksOnObject || !definePropertyWorksOnDom) {\n        var definePropertyFallback = Object.defineProperty;\n    }\n}\n\nif (!Object.defineProperty || definePropertyFallback) {\n    var ERR_NON_OBJECT_DESCRIPTOR = \"Property description must be an object: \";\n    var ERR_NON_OBJECT_TARGET = \"Object.defineProperty called on non-object: \"\n    var ERR_ACCESSORS_NOT_SUPPORTED = \"getters & setters can not be defined \" +\n                                      \"on this javascript engine\";\n\n    Object.defineProperty = function defineProperty(object, property, descriptor) {\n        if ((typeof object != \"object\" && typeof object != \"function\") || object === null)\n            throw new TypeError(ERR_NON_OBJECT_TARGET + object);\n        if ((typeof descriptor != \"object\" && typeof descriptor != \"function\") || descriptor === null)\n            throw new TypeError(ERR_NON_OBJECT_DESCRIPTOR + descriptor);\n\n        // make a valiant attempt to use the real defineProperty\n        // for I8's DOM elements.\n        if (definePropertyFallback) {\n            try {\n                return definePropertyFallback.call(Object, object, property, descriptor);\n            } catch (exception) {\n                // try the shim if the real one doesn't work\n            }\n        }\n\n        // If it's a data property.\n        if (owns(descriptor, \"value\")) {\n            // fail silently if \"writable\", \"enumerable\", or \"configurable\"\n            // are requested but not supported\n            /*\n            // alternate approach:\n            if ( // can't implement these features; allow false but not true\n                !(owns(descriptor, \"writable\") ? descriptor.writable : true) ||\n                !(owns(descriptor, \"enumerable\") ? descriptor.enumerable : true) ||\n                !(owns(descriptor, \"configurable\") ? descriptor.configurable : true)\n            )\n                throw new RangeError(\n                    \"This implementation of Object.defineProperty does not \" +\n                    \"support configurable, enumerable, or writable.\"\n                );\n            */\n\n            if (supportsAccessors && (lookupGetter(object, property) ||\n                                      lookupSetter(object, property)))\n            {\n                // As accessors are supported only on engines implementing\n                // `__proto__` we can safely override `__proto__` while defining\n                // a property to make sure that we don't hit an inherited\n                // accessor.\n                var prototype = object.__proto__;\n                object.__proto__ = prototypeOfObject;\n                // Deleting a property anyway since getter / setter may be\n                // defined on object itself.\n                delete object[property];\n                object[property] = descriptor.value;\n                // Setting original `__proto__` back now.\n                object.__proto__ = prototype;\n            } else {\n                object[property] = descriptor.value;\n            }\n        } else {\n            if (!supportsAccessors)\n                throw new TypeError(ERR_ACCESSORS_NOT_SUPPORTED);\n            // If we got that far then getters and setters can be defined !!\n            if (owns(descriptor, \"get\"))\n                defineGetter(object, property, descriptor.get);\n            if (owns(descriptor, \"set\"))\n                defineSetter(object, property, descriptor.set);\n        }\n\n        return object;\n    };\n}\n\n// ES5 15.2.3.7\nif (!Object.defineProperties) {\n    Object.defineProperties = function defineProperties(object, properties) {\n        for (var property in properties) {\n            if (owns(properties, property))\n                Object.defineProperty(object, property, properties[property]);\n        }\n        return object;\n    };\n}\n\n// ES5 15.2.3.8\nif (!Object.seal) {\n    Object.seal = function seal(object) {\n        // this is misleading and breaks feature-detection, but\n        // allows \"securable\" code to \"gracefully\" degrade to working\n        // but insecure code.\n        return object;\n    };\n}\n\n// ES5 15.2.3.9\nif (!Object.freeze) {\n    Object.freeze = function freeze(object) {\n        // this is misleading and breaks feature-detection, but\n        // allows \"securable\" code to \"gracefully\" degrade to working\n        // but insecure code.\n        return object;\n    };\n}\n\n// detect a Rhino bug and patch it\ntry {\n    Object.freeze(function () {});\n} catch (exception) {\n    Object.freeze = (function freeze(freezeObject) {\n        return function freeze(object) {\n            if (typeof object == \"function\") {\n                return object;\n            } else {\n                return freezeObject(object);\n            }\n        };\n    })(Object.freeze);\n}\n\n// ES5 15.2.3.10\nif (!Object.preventExtensions) {\n    Object.preventExtensions = function preventExtensions(object) {\n        // this is misleading and breaks feature-detection, but\n        // allows \"securable\" code to \"gracefully\" degrade to working\n        // but insecure code.\n        return object;\n    };\n}\n\n// ES5 15.2.3.11\nif (!Object.isSealed) {\n    Object.isSealed = function isSealed(object) {\n        return false;\n    };\n}\n\n// ES5 15.2.3.12\nif (!Object.isFrozen) {\n    Object.isFrozen = function isFrozen(object) {\n        return false;\n    };\n}\n\n// ES5 15.2.3.13\nif (!Object.isExtensible) {\n    Object.isExtensible = function isExtensible(object) {\n        // 1. If Type(O) is not Object throw a TypeError exception.\n        if (Object(object) === object) {\n            throw new TypeError(); // TODO message\n        }\n        // 2. Return the Boolean value of the [[Extensible]] internal property of O.\n        var name = '';\n        while (owns(object, name)) {\n            name += '?';\n        }\n        object[name] = true;\n        var returnValue = owns(object, name);\n        delete object[name];\n        return returnValue;\n    };\n}\n\n// ES5 15.2.3.14\n// http://whattheheadsaid.com/2010/10/a-safer-object-keys-compatibility-implementation\nif (!Object.keys) {\n\n    var hasDontEnumBug = true,\n        dontEnums = [\n            \"toString\",\n            \"toLocaleString\",\n            \"valueOf\",\n            \"hasOwnProperty\",\n            \"isPrototypeOf\",\n            \"propertyIsEnumerable\",\n            \"constructor\"\n        ],\n        dontEnumsLength = dontEnums.length;\n\n    for (var key in {\"toString\": null})\n        hasDontEnumBug = false;\n\n    Object.keys = function keys(object) {\n\n        if ((typeof object != \"object\" && typeof object != \"function\") || object === null)\n            throw new TypeError(\"Object.keys called on a non-object\");\n\n        var keys = [];\n        for (var name in object) {\n            if (owns(object, name)) {\n                keys.push(name);\n            }\n        }\n\n        if (hasDontEnumBug) {\n            for (var i = 0, ii = dontEnumsLength; i < ii; i++) {\n                var dontEnum = dontEnums[i];\n                if (owns(object, dontEnum)) {\n                    keys.push(dontEnum);\n                }\n            }\n        }\n\n        return keys;\n    };\n\n}\n\n//\n// Date\n// ====\n//\n\n// ES5 15.9.5.43\n// Format a Date object as a string according to a simplified subset of the ISO 8601\n// standard as defined in 15.9.1.15.\nif (!Date.prototype.toISOString) {\n    Date.prototype.toISOString = function toISOString() {\n        var result, length, value;\n        if (!isFinite(this))\n            throw new RangeError;\n\n        // the date time string format is specified in 15.9.1.15.\n        result = [this.getUTCFullYear(), this.getUTCMonth() + 1, this.getUTCDate(),\n            this.getUTCHours(), this.getUTCMinutes(), this.getUTCSeconds()];\n\n        length = result.length;\n        while (length--) {\n            value = result[length];\n            // pad months, days, hours, minutes, and seconds to have two digits.\n            if (value < 10)\n                result[length] = \"0\" + value;\n        }\n        // pad milliseconds to have three digits.\n        return result.slice(0, 3).join(\"-\") + \"T\" + result.slice(3).join(\":\") + \".\" +\n            (\"000\" + this.getUTCMilliseconds()).slice(-3) + \"Z\";\n    }\n}\n\n// ES5 15.9.4.4\nif (!Date.now) {\n    Date.now = function now() {\n        return new Date().getTime();\n    };\n}\n\n// ES5 15.9.5.44\nif (!Date.prototype.toJSON) {\n    Date.prototype.toJSON = function toJSON(key) {\n        // This function provides a String representation of a Date object for\n        // use by JSON.stringify (15.12.3). When the toJSON method is called\n        // with argument key, the following steps are taken:\n\n        // 1.  Let O be the result of calling ToObject, giving it the this\n        // value as its argument.\n        // 2. Let tv be ToPrimitive(O, hint Number).\n        // 3. If tv is a Number and is not finite, return null.\n        // XXX\n        // 4. Let toISO be the result of calling the [[Get]] internal method of\n        // O with argument \"toISOString\".\n        // 5. If IsCallable(toISO) is false, throw a TypeError exception.\n        if (typeof this.toISOString != \"function\")\n            throw new TypeError(); // TODO message\n        // 6. Return the result of calling the [[Call]] internal method of\n        // toISO with O as the this value and an empty argument list.\n        return this.toISOString();\n\n        // NOTE 1 The argument is ignored.\n\n        // NOTE 2 The toJSON function is intentionally generic; it does not\n        // require that its this value be a Date object. Therefore, it can be\n        // transferred to other kinds of objects for use as a method. However,\n        // it does require that any such object have a toISOString method. An\n        // object is free to use the argument key to filter its\n        // stringification.\n    };\n}\n\n// 15.9.4.2 Date.parse (string)\n// 15.9.1.15 Date Time String Format\n// Date.parse\n// based on work shared by Daniel Friesen (dantman)\n// http://gist.github.com/303249\nif (isNaN(Date.parse(\"2011-06-15T21:40:05+06:00\"))) {\n    // XXX global assignment won't work in embeddings that use\n    // an alternate object for the context.\n    Date = (function(NativeDate) {\n\n        // Date.length === 7\n        var Date = function Date(Y, M, D, h, m, s, ms) {\n            var length = arguments.length;\n            if (this instanceof NativeDate) {\n                var date = length == 1 && String(Y) === Y ? // isString(Y)\n                    // We explicitly pass it through parse:\n                    new NativeDate(Date.parse(Y)) :\n                    // We have to manually make calls depending on argument\n                    // length here\n                    length >= 7 ? new NativeDate(Y, M, D, h, m, s, ms) :\n                    length >= 6 ? new NativeDate(Y, M, D, h, m, s) :\n                    length >= 5 ? new NativeDate(Y, M, D, h, m) :\n                    length >= 4 ? new NativeDate(Y, M, D, h) :\n                    length >= 3 ? new NativeDate(Y, M, D) :\n                    length >= 2 ? new NativeDate(Y, M) :\n                    length >= 1 ? new NativeDate(Y) :\n                                  new NativeDate();\n                // Prevent mixups with unfixed Date object\n                date.constructor = Date;\n                return date;\n            }\n            return NativeDate.apply(this, arguments);\n        };\n\n        // 15.9.1.15 Date Time String Format. This pattern does not implement\n        // extended years (15.9.1.15.1), as `Date.UTC` cannot parse them.\n        var isoDateExpression = new RegExp(\"^\" +\n            \"(\\\\d{4})\" + // four-digit year capture\n            \"(?:-(\\\\d{2})\" + // optional month capture\n            \"(?:-(\\\\d{2})\" + // optional day capture\n            \"(?:\" + // capture hours:minutes:seconds.milliseconds\n                \"T(\\\\d{2})\" + // hours capture\n                \":(\\\\d{2})\" + // minutes capture\n                \"(?:\" + // optional :seconds.milliseconds\n                    \":(\\\\d{2})\" + // seconds capture\n                    \"(?:\\\\.(\\\\d{3}))?\" + // milliseconds capture\n                \")?\" +\n            \"(?:\" + // capture UTC offset component\n                \"Z|\" + // UTC capture\n                \"(?:\" + // offset specifier +/-hours:minutes\n                    \"([-+])\" + // sign capture\n                    \"(\\\\d{2})\" + // hours offset capture\n                    \":(\\\\d{2})\" + // minutes offset capture\n                \")\" +\n            \")?)?)?)?\" +\n        \"$\");\n\n        // Copy any custom methods a 3rd party library may have added\n        for (var key in NativeDate)\n            Date[key] = NativeDate[key];\n\n        // Copy \"native\" methods explicitly; they may be non-enumerable\n        Date.now = NativeDate.now;\n        Date.UTC = NativeDate.UTC;\n        Date.prototype = NativeDate.prototype;\n        Date.prototype.constructor = Date;\n\n        // Upgrade Date.parse to handle simplified ISO 8601 strings\n        Date.parse = function parse(string) {\n            var match = isoDateExpression.exec(string);\n            if (match) {\n                match.shift(); // kill match[0], the full match\n                // parse months, days, hours, minutes, seconds, and milliseconds\n                for (var i = 1; i < 7; i++) {\n                    // provide default values if necessary\n                    match[i] = +(match[i] || (i < 3 ? 1 : 0));\n                    // match[1] is the month. Months are 0-11 in JavaScript\n                    // `Date` objects, but 1-12 in ISO notation, so we\n                    // decrement.\n                    if (i == 1)\n                        match[i]--;\n                }\n\n                // parse the UTC offset component\n                var minuteOffset = +match.pop(), hourOffset = +match.pop(), sign = match.pop();\n\n                // compute the explicit time zone offset if specified\n                var offset = 0;\n                if (sign) {\n                    // detect invalid offsets and return early\n                    if (hourOffset > 23 || minuteOffset > 59)\n                        return NaN;\n\n                    // express the provided time zone offset in minutes. The offset is\n                    // negative for time zones west of UTC; positive otherwise.\n                    offset = (hourOffset * 60 + minuteOffset) * 6e4 * (sign == \"+\" ? -1 : 1);\n                }\n\n                // compute a new UTC date value, accounting for the optional offset\n                return NativeDate.UTC.apply(this, match) + offset;\n            }\n            return NativeDate.parse.apply(this, arguments);\n        };\n\n        return Date;\n    })(Date);\n}\n\n//\n// String\n// ======\n//\n\n// ES5 15.5.4.20\nvar ws = \"\\x09\\x0A\\x0B\\x0C\\x0D\\x20\\xA0\\u1680\\u180E\\u2000\\u2001\\u2002\\u2003\" +\n    \"\\u2004\\u2005\\u2006\\u2007\\u2008\\u2009\\u200A\\u202F\\u205F\\u3000\\u2028\" +\n    \"\\u2029\\uFEFF\";\nif (!String.prototype.trim || ws.trim()) {\n    // http://blog.stevenlevithan.com/archives/faster-trim-javascript\n    // http://perfectionkills.com/whitespace-deviations/\n    ws = \"[\" + ws + \"]\";\n    var trimBeginRegexp = new RegExp(\"^\" + ws + ws + \"*\"),\n        trimEndRegexp = new RegExp(ws + ws + \"*$\");\n    String.prototype.trim = function trim() {\n        return String(this).replace(trimBeginRegexp, \"\").replace(trimEndRegexp, \"\");\n    };\n}\n\n//\n// Util\n// ======\n//\n\n// http://jsperf.com/to-integer\nvar toInteger = function (n) {\n    n = +n;\n    if (n !== n) // isNaN\n        n = -1;\n    else if (n !== 0 && n !== (1/0) && n !== -(1/0))\n        n = (n > 0 || -1) * Math.floor(Math.abs(n));\n    return n;\n};\n\nvar prepareString = \"a\"[0] != \"a\",\n    // ES5 9.9\n    toObject = function (o) {\n        if (o == null) { // this matches both null and undefined\n            throw new TypeError(); // TODO message\n        }\n        // If the implementation doesn't support by-index access of\n        // string characters (ex. IE < 7), split the string\n        if (prepareString && typeof o == \"string\" && o) {\n            return o.split(\"\");\n        }\n        return Object(o);\n    };\n});\n\n//@ sourceURL=/node_modules/es5-shim/es5-shim.js"
));

require.define("events", Function(
    [ 'require', 'module', 'exports', '__dirname', '__filename' ],
    "if (!process.EventEmitter) process.EventEmitter = function () {};\n\nvar EventEmitter = exports.EventEmitter = process.EventEmitter;\nvar isArray = typeof Array.isArray === 'function'\n    ? Array.isArray\n    : function (xs) {\n        return Object.prototype.toString.call(xs) === '[object Array]'\n    }\n;\n\n// By default EventEmitters will print a warning if more than\n// 10 listeners are added to it. This is a useful default which\n// helps finding memory leaks.\n//\n// Obviously not all Emitters should be limited to 10. This function allows\n// that to be increased. Set to zero for unlimited.\nvar defaultMaxListeners = 10;\nEventEmitter.prototype.setMaxListeners = function(n) {\n  if (!this._events) this._events = {};\n  this._events.maxListeners = n;\n};\n\n\nEventEmitter.prototype.emit = function(type) {\n  // If there is no 'error' event listener then throw.\n  if (type === 'error') {\n    if (!this._events || !this._events.error ||\n        (isArray(this._events.error) && !this._events.error.length))\n    {\n      if (arguments[1] instanceof Error) {\n        throw arguments[1]; // Unhandled 'error' event\n      } else {\n        throw new Error(\"Uncaught, unspecified 'error' event.\");\n      }\n      return false;\n    }\n  }\n\n  if (!this._events) return false;\n  var handler = this._events[type];\n  if (!handler) return false;\n\n  if (typeof handler == 'function') {\n    switch (arguments.length) {\n      // fast cases\n      case 1:\n        handler.call(this);\n        break;\n      case 2:\n        handler.call(this, arguments[1]);\n        break;\n      case 3:\n        handler.call(this, arguments[1], arguments[2]);\n        break;\n      // slower\n      default:\n        var args = Array.prototype.slice.call(arguments, 1);\n        handler.apply(this, args);\n    }\n    return true;\n\n  } else if (isArray(handler)) {\n    var args = Array.prototype.slice.call(arguments, 1);\n\n    var listeners = handler.slice();\n    for (var i = 0, l = listeners.length; i < l; i++) {\n      listeners[i].apply(this, args);\n    }\n    return true;\n\n  } else {\n    return false;\n  }\n};\n\n// EventEmitter is defined in src/node_events.cc\n// EventEmitter.prototype.emit() is also defined there.\nEventEmitter.prototype.addListener = function(type, listener) {\n  if ('function' !== typeof listener) {\n    throw new Error('addListener only takes instances of Function');\n  }\n\n  if (!this._events) this._events = {};\n\n  // To avoid recursion in the case that type == \"newListeners\"! Before\n  // adding it to the listeners, first emit \"newListeners\".\n  this.emit('newListener', type, listener);\n\n  if (!this._events[type]) {\n    // Optimize the case of one listener. Don't need the extra array object.\n    this._events[type] = listener;\n  } else if (isArray(this._events[type])) {\n\n    // Check for listener leak\n    if (!this._events[type].warned) {\n      var m;\n      if (this._events.maxListeners !== undefined) {\n        m = this._events.maxListeners;\n      } else {\n        m = defaultMaxListeners;\n      }\n\n      if (m && m > 0 && this._events[type].length > m) {\n        this._events[type].warned = true;\n        console.error('(node) warning: possible EventEmitter memory ' +\n                      'leak detected. %d listeners added. ' +\n                      'Use emitter.setMaxListeners() to increase limit.',\n                      this._events[type].length);\n        console.trace();\n      }\n    }\n\n    // If we've already got an array, just append.\n    this._events[type].push(listener);\n  } else {\n    // Adding the second element, need to change to array.\n    this._events[type] = [this._events[type], listener];\n  }\n\n  return this;\n};\n\nEventEmitter.prototype.on = EventEmitter.prototype.addListener;\n\nEventEmitter.prototype.once = function(type, listener) {\n  var self = this;\n  self.on(type, function g() {\n    self.removeListener(type, g);\n    listener.apply(this, arguments);\n  });\n\n  return this;\n};\n\nEventEmitter.prototype.removeListener = function(type, listener) {\n  if ('function' !== typeof listener) {\n    throw new Error('removeListener only takes instances of Function');\n  }\n\n  // does not use listeners(), so no side effect of creating _events[type]\n  if (!this._events || !this._events[type]) return this;\n\n  var list = this._events[type];\n\n  if (isArray(list)) {\n    var i = list.indexOf(listener);\n    if (i < 0) return this;\n    list.splice(i, 1);\n    if (list.length == 0)\n      delete this._events[type];\n  } else if (this._events[type] === listener) {\n    delete this._events[type];\n  }\n\n  return this;\n};\n\nEventEmitter.prototype.removeAllListeners = function(type) {\n  // does not use listeners(), so no side effect of creating _events[type]\n  if (type && this._events && this._events[type]) this._events[type] = null;\n  return this;\n};\n\nEventEmitter.prototype.listeners = function(type) {\n  if (!this._events) this._events = {};\n  if (!this._events[type]) this._events[type] = [];\n  if (!isArray(this._events[type])) {\n    this._events[type] = [this._events[type]];\n  }\n  return this._events[type];\n};\n\n//@ sourceURL=events"
));

require.define("/node_modules/racer/lib/plugin.js", Function(
    [ 'require', 'module', 'exports', '__dirname', '__filename' ],
    "// Generated by CoffeeScript 1.3.1\nvar isServer, mergeAll, mergeProto, _ref, _require,\n  __slice = [].slice;\n\n_ref = require('./util'), mergeAll = _ref.mergeAll, isServer = _ref.isServer;\n\n_require = require;\n\nmodule.exports = {\n  use: function(plugin, options) {\n    if (typeof plugin === 'string') {\n      if (!isServer) {\n        return this;\n      }\n      plugin = _require(plugin);\n    }\n    this._plugins || (this._plugins = []);\n    if (-1 === this._plugins.indexOf(plugin)) {\n      this._plugins.push(plugin);\n      plugin(this, options);\n    }\n    return this;\n  },\n  mixin: function() {\n    var Klass, fn, mixin, name, server, type, _i, _len, _ref1,\n      _this = this;\n    for (_i = 0, _len = arguments.length; _i < _len; _i++) {\n      mixin = arguments[_i];\n      if (typeof mixin === 'string') {\n        if (!isServer) {\n          continue;\n        }\n        mixin = _require(mixin);\n      }\n      if (!(type = mixin.type)) {\n        throw new Error(\"Mixins require a type parameter\");\n      }\n      if (!(Klass = this[\"protected\"][type])) {\n        throw new Error(\"Cannot find racer.protected.\" + type);\n      }\n      if (Klass.mixins) {\n        Klass.mixins.push(mixin);\n      } else {\n        Klass.mixins = [mixin];\n        Klass.prototype.mixinEmit = function() {\n          var args, name;\n          name = arguments[0], args = 2 <= arguments.length ? __slice.call(arguments, 1) : [];\n          return _this.emit.apply(_this, [type + ':' + name].concat(__slice.call(args)));\n        };\n      }\n      mergeAll(Klass, mixin[\"static\"]);\n      mergeProto(mixin.proto, Klass);\n      if (isServer && (server = mixin.server)) {\n        server = typeof server === 'string' ? _require(server) : mixin.server;\n        mergeProto(server, Klass);\n      }\n      _ref1 = mixin.events;\n      for (name in _ref1) {\n        fn = _ref1[name];\n        this.on(type + ':' + name, fn);\n      }\n      this.emit(type + ':mixin', Klass);\n    }\n    return this;\n  }\n};\n\nmergeProto = function(protoSpec, Klass) {\n  var descriptor, fn, groupName, key, methods, name, targetPrototype, value, _i, _len, _ref1;\n  targetPrototype = Klass.prototype;\n  for (name in protoSpec) {\n    descriptor = protoSpec[name];\n    if (typeof descriptor === 'function') {\n      targetPrototype[name] = descriptor;\n      continue;\n    }\n    fn = targetPrototype[name] = descriptor.fn;\n    for (key in descriptor) {\n      value = descriptor[key];\n      switch (key) {\n        case 'fn':\n          continue;\n        case 'type':\n          _ref1 = value.split(',');\n          for (_i = 0, _len = _ref1.length; _i < _len; _i++) {\n            groupName = _ref1[_i];\n            methods = Klass[groupName] || (Klass[groupName] = {});\n            methods[name] = fn;\n          }\n          break;\n        default:\n          fn[key] = value;\n      }\n    }\n  }\n};\n\n//@ sourceURL=/node_modules/racer/lib/plugin.js"
));

require.define("/node_modules/racer/lib/Model.js", Function(
    [ 'require', 'module', 'exports', '__dirname', '__filename' ],
    "// Generated by CoffeeScript 1.3.1\nvar EventEmitter, Memory, Model, eventListener, eventRegExp, mergeAll;\n\nEventEmitter = require('events').EventEmitter;\n\nMemory = require('./Memory');\n\neventRegExp = require('./path').eventRegExp;\n\nmergeAll = require('./util').mergeAll;\n\nModel = module.exports = function() {\n  this._memory = new Memory;\n  this._count = {\n    id: 0\n  };\n  this.setMaxListeners(0);\n  this.mixinEmit('init', this);\n};\n\nmergeAll(Model.prototype, EventEmitter.prototype, {\n  id: function() {\n    return '$_' + this._clientId + '_' + (this._count.id++).toString(36);\n  },\n  connected: true,\n  canConnect: true,\n  _setSocket: function(socket) {\n    var onConnected,\n      _this = this;\n    this.socket = socket;\n    this.mixinEmit('socket', this, socket);\n    this.disconnect = function() {\n      return socket.disconnect();\n    };\n    this.connect = function(cb) {\n      if (cb) {\n        socket.once('connect', cb);\n      }\n      return socket.socket.connect();\n    };\n    this.canConnect = true;\n    socket.on('fatalErr', function(msg) {\n      _this.canConnect = false;\n      _this.emit('canConnect', false);\n      return socket.disconnect();\n    });\n    this.connected = false;\n    onConnected = function() {\n      _this.emit('connected', _this.connected);\n      return _this.emit('connectionStatus', _this.connected, _this.canConnect);\n    };\n    socket.on('connect', function() {\n      _this.connected = true;\n      return onConnected();\n    });\n    socket.on('disconnect', function() {\n      _this.connected = false;\n      return setTimeout(onConnected, 400);\n    });\n    return socket.on('connect_failed', onConnected);\n  },\n  at: function(segment, absolute) {\n    var at;\n    return Object.create(this, {\n      _at: {\n        value: (at = this._at) && !absolute ? segment === '' ? at : at + '.' + segment : segment.toString()\n      }\n    });\n  },\n  parent: function(levels) {\n    var at, segments;\n    if (levels == null) {\n      levels = 1;\n    }\n    if (!(at = this._at)) {\n      return this;\n    }\n    segments = at.split('.');\n    return this.at(segments.slice(0, segments.length - levels).join('.'), true);\n  },\n  path: function(rest) {\n    if (this._at) {\n      if (rest) {\n        return this._at + '.' + rest;\n      }\n      return this._at;\n    }\n    return rest || '';\n  },\n  leaf: function(path) {\n    var i;\n    if (path == null) {\n      path = this._at || '';\n    }\n    i = path.lastIndexOf('.');\n    return path.substr(i + 1);\n  },\n  _on: EventEmitter.prototype.on,\n  on: function(type, pattern, callback) {\n    var listener;\n    this._on(type, listener = eventListener(type, pattern, callback, this._at));\n    return listener;\n  },\n  _once: EventEmitter.prototype.once,\n  once: function(type, pattern, callback) {\n    var g, listener,\n      _this = this;\n    listener = eventListener(type, pattern, callback, this._at);\n    this._on(type, g = function() {\n      var matches;\n      matches = listener.apply(null, arguments);\n      if (matches) {\n        return _this.removeListener(type, g);\n      }\n    });\n    return listener;\n  },\n  pass: function(arg) {\n    return Object.create(this, {\n      _pass: {\n        value: arg\n      }\n    });\n  }\n});\n\nModel.prototype.addListener = Model.prototype.on;\n\neventListener = function(method, pattern, callback, at) {\n  var re;\n  if (at) {\n    if (typeof pattern === 'string') {\n      pattern = at + '.' + pattern;\n    } else if (pattern.call) {\n      callback = pattern;\n      pattern = at;\n    } else {\n      throw new Error('Unsupported event pattern on scoped model');\n    }\n  } else {\n    if (pattern.call) {\n      return pattern;\n    }\n  }\n  re = eventRegExp(pattern);\n  return function(methodArgs, out, isLocal, pass) {\n    var args, argsForEmit, path;\n    path = methodArgs[0];\n    if (re.test(path)) {\n      args = methodArgs.slice(1);\n      argsForEmit = re.exec(path).slice(1).concat(args);\n      argsForEmit.push(out, isLocal, pass);\n      callback.apply(null, argsForEmit);\n      return true;\n    }\n  };\n};\n\n//@ sourceURL=/node_modules/racer/lib/Model.js"
));

require.define("/node_modules/racer/lib/Memory.js", Function(
    [ 'require', 'module', 'exports', '__dirname', '__filename' ],
    "// Generated by CoffeeScript 1.3.1\nvar Memory, clone, create, createArray, createObject, isPrivate, lookup, lookupSet, _ref,\n  __slice = [].slice;\n\n_ref = require('./util/speculative'), clone = _ref.clone, create = _ref.create, createObject = _ref.createObject, createArray = _ref.createArray;\n\nisPrivate = require('./path').isPrivate;\n\nMemory = module.exports = function() {\n  this.flush();\n};\n\nMemory.prototype = {\n  flush: function() {\n    this._data = {\n      world: {}\n    };\n    return this.version = 0;\n  },\n  init: function(obj) {\n    this._data = {\n      world: obj.data\n    };\n    return this.version = obj.ver;\n  },\n  eraseNonPrivate: function() {\n    var path, world;\n    world = this._data.world;\n    for (path in world) {\n      if (!isPrivate(path)) {\n        delete world[path];\n      }\n    }\n  },\n  toJSON: function() {\n    return {\n      data: this._data.world,\n      ver: this.version\n    };\n  },\n  setVersion: function(ver) {\n    return this.version = Math.max(this.version, ver);\n  },\n  get: function(path, data, getRef) {\n    data || (data = this._data);\n    data.$deref = null;\n    if (path) {\n      return lookup(path, data, getRef);\n    }\n    return data.world;\n  },\n  set: function(path, value, ver, data) {\n    var obj, parent, prop, segments, _ref1;\n    this.setVersion(ver);\n    _ref1 = lookupSet(path, data || this._data, ver == null, 'object'), obj = _ref1[0], parent = _ref1[1], prop = _ref1[2];\n    parent[prop] = value;\n    segments = path.split('.');\n    if (segments.length === 2 && value && value.constructor === Object) {\n      if (value.id == null) {\n        value.id = segments[1];\n      }\n    }\n    return obj;\n  },\n  del: function(path, ver, data) {\n    var grandparent, index, obj, parent, parentClone, parentPath, parentProp, prop, speculative, _ref1, _ref2;\n    this.setVersion(ver);\n    data || (data = this._data);\n    speculative = ver == null;\n    _ref1 = lookupSet(path, data, speculative), obj = _ref1[0], parent = _ref1[1], prop = _ref1[2];\n    if (ver != null) {\n      if (parent) {\n        delete parent[prop];\n      }\n      return obj;\n    }\n    if (!parent) {\n      return obj;\n    }\n    if (~(index = path.lastIndexOf('.'))) {\n      parentPath = path.substr(0, index);\n      _ref2 = lookupSet(parentPath, data, speculative), parent = _ref2[0], grandparent = _ref2[1], parentProp = _ref2[2];\n    } else {\n      parent = data.world;\n      grandparent = data;\n      parentProp = 'world';\n    }\n    parentClone = clone(parent);\n    delete parentClone[prop];\n    grandparent[parentProp] = parentClone;\n    return obj;\n  },\n  push: function() {\n    var args, arr, data, path, ver, _i;\n    path = arguments[0], args = 4 <= arguments.length ? __slice.call(arguments, 1, _i = arguments.length - 2) : (_i = 1, []), ver = arguments[_i++], data = arguments[_i++];\n    this.setVersion(ver);\n    arr = lookupSet(path, data || this._data, ver == null, 'array')[0];\n    if (!Array.isArray(arr)) {\n      throw new Error('Not an Array');\n    }\n    return arr.push.apply(arr, args);\n  },\n  unshift: function() {\n    var args, arr, data, path, ver, _i;\n    path = arguments[0], args = 4 <= arguments.length ? __slice.call(arguments, 1, _i = arguments.length - 2) : (_i = 1, []), ver = arguments[_i++], data = arguments[_i++];\n    this.setVersion(ver);\n    arr = lookupSet(path, data || this._data, ver == null, 'array')[0];\n    if (!Array.isArray(arr)) {\n      throw new Error('Not an Array');\n    }\n    return arr.unshift.apply(arr, args);\n  },\n  insert: function() {\n    var args, arr, data, index, len, path, ver, _i;\n    path = arguments[0], index = arguments[1], args = 5 <= arguments.length ? __slice.call(arguments, 2, _i = arguments.length - 2) : (_i = 2, []), ver = arguments[_i++], data = arguments[_i++];\n    this.setVersion(ver);\n    arr = lookupSet(path, data || this._data, ver == null, 'array')[0];\n    if (!Array.isArray(arr)) {\n      throw new Error('Not an Array');\n    }\n    len = arr.length;\n    arr.splice.apply(arr, [index, 0].concat(__slice.call(args)));\n    return arr.length;\n  },\n  pop: function(path, ver, data) {\n    var arr;\n    this.setVersion(ver);\n    arr = lookupSet(path, data || this._data, ver == null, 'array')[0];\n    if (!Array.isArray(arr)) {\n      throw new Error('Not an Array');\n    }\n    return arr.pop();\n  },\n  shift: function(path, ver, data) {\n    var arr;\n    this.setVersion(ver);\n    arr = lookupSet(path, data || this._data, ver == null, 'array')[0];\n    if (!Array.isArray(arr)) {\n      throw new Error('Not an Array');\n    }\n    return arr.shift();\n  },\n  remove: function(path, index, howMany, ver, data) {\n    var arr, len;\n    this.setVersion(ver);\n    arr = lookupSet(path, data || this._data, ver == null, 'array')[0];\n    if (!Array.isArray(arr)) {\n      throw new Error('Not an Array');\n    }\n    len = arr.length;\n    return arr.splice(index, howMany);\n  },\n  move: function(path, from, to, howMany, ver, data) {\n    var arr, len, values;\n    this.setVersion(ver);\n    arr = lookupSet(path, data || this._data, ver == null, 'array')[0];\n    if (!Array.isArray(arr)) {\n      throw new Error('Not an Array');\n    }\n    len = arr.length;\n    from = +from;\n    to = +to;\n    if (from < 0) {\n      from += len;\n    }\n    if (to < 0) {\n      to += len;\n    }\n    values = arr.splice(from, howMany);\n    arr.splice.apply(arr, [to, 0].concat(__slice.call(values)));\n    return values;\n  }\n};\n\nlookup = function(path, data, getRef) {\n  var curr, i, len, prop, props, refOut, _ref1;\n  props = path.split('.');\n  len = props.length;\n  i = 0;\n  curr = data.world;\n  path = '';\n  while (i < len) {\n    prop = props[i++];\n    curr = curr[prop];\n    path = path ? path + '.' + prop : prop;\n    if (typeof curr === 'function') {\n      if (getRef && i === len) {\n        break;\n      }\n      _ref1 = refOut = curr(lookup, data, path, props, len, i), curr = _ref1[0], path = _ref1[1], i = _ref1[2];\n    }\n    if (curr == null) {\n      break;\n    }\n  }\n  return curr;\n};\n\nlookupSet = function(path, data, speculative, pathType) {\n  var curr, firstProp, i, len, parent, prop, props;\n  props = path.split('.');\n  len = props.length;\n  i = 0;\n  curr = data.world = speculative ? create(data.world) : data.world;\n  firstProp = props[0];\n  while (i < len) {\n    prop = props[i++];\n    parent = curr;\n    curr = curr[prop];\n    if (curr != null) {\n      if (speculative && typeof curr === 'object') {\n        curr = parent[prop] = create(curr);\n      }\n    } else {\n      if (pathType === 'object') {\n        if (i !== 1 && /^[0-9]+$/.test(props[i])) {\n          curr = parent[prop] = speculative ? createArray() : [];\n        } else if (i !== len) {\n          curr = parent[prop] = speculative ? createObject() : {};\n          if (i === 2 && !isPrivate(firstProp)) {\n            curr.id = prop;\n          }\n        }\n      } else if (pathType === 'array') {\n        if (i === len) {\n          curr = parent[prop] = speculative ? createArray() : [];\n        } else {\n          curr = parent[prop] = speculative ? createObject() : {};\n          if (i === 2 && !isPrivate(firstProp)) {\n            curr.id = prop;\n          }\n        }\n      } else {\n        if (i !== len) {\n          parent = curr = void 0;\n        }\n        return [curr, parent, prop];\n      }\n    }\n  }\n  return [curr, parent, prop];\n};\n\n//@ sourceURL=/node_modules/racer/lib/Memory.js"
));

require.define("/node_modules/racer/lib/util/speculative.js", Function(
    [ 'require', 'module', 'exports', '__dirname', '__filename' ],
    "// Generated by CoffeeScript 1.3.1\nvar merge, util;\n\nmerge = (util = require('./index')).merge;\n\nutil.speculative = module.exports = {\n  createObject: function() {\n    return {\n      $spec: true\n    };\n  },\n  createArray: function() {\n    var obj;\n    obj = [];\n    obj.$spec = true;\n    return obj;\n  },\n  create: function(proto) {\n    var obj;\n    if (proto.$spec) {\n      return proto;\n    }\n    if (Array.isArray(proto)) {\n      obj = proto.slice();\n      obj.$spec = true;\n      return obj;\n    }\n    return Object.create(proto, {\n      $spec: {\n        value: true\n      }\n    });\n  },\n  clone: function(proto) {\n    var obj;\n    if (Array.isArray(proto)) {\n      obj = proto.slice();\n      obj.$spec = true;\n      return obj;\n    }\n    return merge({}, proto);\n  },\n  isSpeculative: function(obj) {\n    return obj && obj.$spec;\n  },\n  identifier: '$spec'\n};\n\n//@ sourceURL=/node_modules/racer/lib/util/speculative.js"
));

require.define("/node_modules/racer/lib/path.js", Function(
    [ 'require', 'module', 'exports', '__dirname', '__filename' ],
    "// Generated by CoffeeScript 1.3.1\n\nmodule.exports = {\n  isPrivate: function(name) {\n    return /(?:^_)|(?:\\._)/.test(name);\n  },\n  eventRegExp: function(pattern) {\n    if (pattern instanceof RegExp) {\n      return pattern;\n    } else {\n      return new RegExp('^' + pattern.replace(/[,.*]/g, function(match, index) {\n        if (match === '.') {\n          return '\\\\.';\n        } else if (match === ',') {\n          return '|';\n        } else if (pattern.length - index === 1) {\n          return '(.+)';\n        } else {\n          return '([^.]+)';\n        }\n      }) + '$');\n    }\n  },\n  regExp: function(pattern) {\n    if (!pattern) {\n      return /^/;\n    } else {\n      return new RegExp('^' + pattern.replace(/[.*]/g, function(match, index) {\n        if (match === '.') {\n          return '\\\\.';\n        } else {\n          return '[^.]+';\n        }\n      }) + '(?:\\\\.|$)');\n    }\n  },\n  regExpPathOrParent: function(path) {\n    var i, p, segment, source;\n    p = '';\n    source = ((function() {\n      var _i, _len, _ref, _results;\n      _ref = path.split('.');\n      _results = [];\n      for (i = _i = 0, _len = _ref.length; _i < _len; i = ++_i) {\n        segment = _ref[i];\n        _results.push(\"(?:\" + (p += i ? '\\\\.' + segment : segment) + \")\");\n      }\n      return _results;\n    })()).join('|');\n    return new RegExp('^(?:' + source + ')$');\n  },\n  regExpPathsOrChildren: function(paths) {\n    var path, source;\n    source = ((function() {\n      var _i, _len, _results;\n      _results = [];\n      for (_i = 0, _len = paths.length; _i < _len; _i++) {\n        path = paths[_i];\n        _results.push(\"(?:\" + path + \"(?:\\\\..+)?)\");\n      }\n      return _results;\n    })()).join('|');\n    return new RegExp('^(?:' + source + ')$');\n  },\n  lookup: function(path, obj) {\n    var parts, prop, _i, _len;\n    if (path.indexOf('.') === -1) {\n      return obj[path];\n    }\n    parts = path.split('.');\n    for (_i = 0, _len = parts.length; _i < _len; _i++) {\n      prop = parts[_i];\n      if (obj == null) {\n        return;\n      }\n      obj = obj[prop];\n    }\n    return obj;\n  },\n  assign: function(obj, path, val) {\n    var i, lastIndex, parts, prop, _i, _len;\n    parts = path.split('.');\n    lastIndex = parts.length - 1;\n    for (i = _i = 0, _len = parts.length; _i < _len; i = ++_i) {\n      prop = parts[i];\n      if (i === lastIndex) {\n        obj[prop] = val;\n      } else {\n        obj = obj[prop] || (obj[prop] = {});\n      }\n    }\n  },\n  split: function(path) {\n    return path.split(/\\.?[(*]\\.?/);\n  },\n  expand: function(path) {\n    var lastClosed, match, out, paths, pre, stack, token, val;\n    path = path.replace(/[\\s\\n]/g, '');\n    if (!~path.indexOf('(')) {\n      return [path];\n    }\n    stack = {\n      paths: paths = [''],\n      out: out = []\n    };\n    while (path) {\n      if (!(match = /^([^,()]*)([,()])(.*)/.exec(path))) {\n        return (function() {\n          var _i, _len, _results;\n          _results = [];\n          for (_i = 0, _len = out.length; _i < _len; _i++) {\n            val = out[_i];\n            _results.push(val + path);\n          }\n          return _results;\n        })();\n      }\n      pre = match[1];\n      token = match[2];\n      path = match[3];\n      if (pre) {\n        paths = (function() {\n          var _i, _len, _results;\n          _results = [];\n          for (_i = 0, _len = paths.length; _i < _len; _i++) {\n            val = paths[_i];\n            _results.push(val + pre);\n          }\n          return _results;\n        })();\n        if (token !== '(') {\n          out = lastClosed ? paths : out.concat(paths);\n        }\n      }\n      lastClosed = false;\n      if (token === ',') {\n        stack.out = stack.out.concat(paths);\n        paths = stack.paths;\n      } else if (token === '(') {\n        stack = {\n          parent: stack,\n          paths: paths,\n          out: out = []\n        };\n      } else if (token === ')') {\n        lastClosed = true;\n        paths = out = stack.out.concat(paths);\n        stack = stack.parent;\n      }\n    }\n    return out;\n  },\n  triplet: function(path) {\n    var parts;\n    parts = path.split('.');\n    return [parts[0], parts[1], parts.slice(2).join('.')];\n  },\n  subPathToDoc: function(path) {\n    return path.split('.').slice(0, 2).join('.');\n  }\n};\n\n//@ sourceURL=/node_modules/racer/lib/path.js"
));

require.define("/node_modules/racer/lib/mutators/index.js", Function(
    [ 'require', 'module', 'exports', '__dirname', '__filename' ],
    "// Generated by CoffeeScript 1.3.1\nvar exports, mixinModel, mixinStore;\n\nmixinModel = require('./mutators.Model');\n\nmixinStore = __dirname + '/mutators.Store';\n\nexports = module.exports = function(racer) {\n  return racer.mixin(mixinModel, mixinStore);\n};\n\nexports.useWith = {\n  server: true,\n  browser: true\n};\n\n//@ sourceURL=/node_modules/racer/lib/mutators/index.js"
));

require.define("/node_modules/racer/lib/mutators/mutators.Model.js", Function(
    [ 'require', 'module', 'exports', '__dirname', '__filename' ],
    "// Generated by CoffeeScript 1.3.1\nvar ACCESSOR, ARRAY_MUTATOR, Async, BASIC_MUTATOR, COMPOUND_MUTATOR, Memory,\n  __slice = [].slice;\n\nAsync = require('./Async');\n\nMemory = require('../Memory');\n\nmodule.exports = {\n  type: 'Model',\n  \"static\": {\n    ACCESSOR: ACCESSOR = 'accessor',\n    BASIC_MUTATOR: BASIC_MUTATOR = 'mutator,basicMutator',\n    COMPOUND_MUTATOR: COMPOUND_MUTATOR = 'mutator,compoundMutator',\n    ARRAY_MUTATOR: ARRAY_MUTATOR = 'mutator,arrayMutator'\n  },\n  events: {\n    init: function(model) {\n      var memory;\n      memory = new Memory;\n      return model.async = new Async({\n        nextTxnId: function() {\n          return model._nextTxnId();\n        },\n        get: function(path, callback) {\n          return model._fetch([path], function(err, data) {\n            var item, items, len, out, subpath, value, _i, _len, _ref;\n            if (err) {\n              return callback(err);\n            }\n            if (!((items = data.data) && (len = items.length))) {\n              return callback();\n            }\n            if (len === 1 && (item = items[0]) && item[0] === path) {\n              return callback(null, item[1]);\n            }\n            for (_i = 0, _len = items.length; _i < _len; _i++) {\n              _ref = items[_i], subpath = _ref[0], value = _ref[1];\n              memory.set(subpath, value, -1);\n            }\n            out = memory.get(path);\n            memory.flush();\n            return callback(null, out);\n          });\n        },\n        commit: function(txn, callback) {\n          return model._asyncCommit(txn, callback);\n        }\n      });\n    }\n  },\n  proto: {\n    get: {\n      type: ACCESSOR,\n      fn: function(path) {\n        var at;\n        if (at = this._at) {\n          path = path ? at + '.' + path : at;\n        }\n        return this._memory.get(path, this._specModel());\n      }\n    },\n    set: {\n      type: BASIC_MUTATOR,\n      fn: function(path, value, callback) {\n        var at, len;\n        if (at = this._at) {\n          len = arguments.length;\n          path = len === 1 || len === 2 && typeof value === 'function' ? (callback = value, value = path, at) : at + '.' + path;\n        }\n        return this._addOpAsTxn('set', [path, value], callback);\n      }\n    },\n    del: {\n      type: BASIC_MUTATOR,\n      fn: function(path, callback) {\n        var at;\n        if (at = this._at) {\n          path = typeof path === 'string' ? at + '.' + path : (callback = path, at);\n        }\n        return this._addOpAsTxn('del', [path], callback);\n      }\n    },\n    setNull: {\n      type: COMPOUND_MUTATOR,\n      fn: function(path, value, callback) {\n        var len, obj;\n        len = arguments.length;\n        obj = this._at && len === 1 || len === 2 && typeof value === 'function' ? this.get() : this.get(path);\n        if (obj != null) {\n          return obj;\n        }\n        if (len === 1) {\n          return this.set(path);\n        } else if (len === 2) {\n          return this.set(path, value);\n        } else {\n          return this.set(path, value, callback);\n        }\n      }\n    },\n    incr: {\n      type: COMPOUND_MUTATOR,\n      fn: function(path, byNum, callback) {\n        var value;\n        if (typeof path !== 'string') {\n          callback = byNum;\n          byNum = path;\n          path = '';\n        }\n        if (typeof byNum === 'function') {\n          callback = byNum;\n          byNum = 1;\n        } else if (typeof byNum !== 'number') {\n          byNum = 1;\n        }\n        value = (this.get(path) || 0) + byNum;\n        if (path) {\n          this.set(path, value, callback);\n          return value;\n        }\n        if (callback) {\n          this.set(value, callback);\n        } else {\n          this.set(value);\n        }\n        return value;\n      }\n    },\n    push: {\n      type: ARRAY_MUTATOR,\n      insertArgs: 1,\n      fn: function() {\n        var args, at, callback, path;\n        args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];\n        if (at = this._at) {\n          if (typeof (path = args[0]) === 'string' && typeof this.get() === 'object') {\n            args[0] = at + '.' + path;\n          } else {\n            args.unshift(at);\n          }\n        }\n        if (typeof args[args.length - 1] === 'function') {\n          callback = args.pop();\n        }\n        return this._addOpAsTxn('push', args, callback);\n      }\n    },\n    unshift: {\n      type: ARRAY_MUTATOR,\n      insertArgs: 1,\n      fn: function() {\n        var args, at, callback, path;\n        args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];\n        if (at = this._at) {\n          if (typeof (path = args[0]) === 'string' && typeof this.get() === 'object') {\n            args[0] = at + '.' + path;\n          } else {\n            args.unshift(at);\n          }\n        }\n        if (typeof args[args.length - 1] === 'function') {\n          callback = args.pop();\n        }\n        return this._addOpAsTxn('unshift', args, callback);\n      }\n    },\n    insert: {\n      type: ARRAY_MUTATOR,\n      indexArgs: [1],\n      insertArgs: 2,\n      fn: function() {\n        var args, at, callback, match, path;\n        args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];\n        if (at = this._at) {\n          if (typeof (path = args[0]) === 'string' && isNaN(path)) {\n            args[0] = at + '.' + path;\n          } else {\n            args.unshift(at);\n          }\n        }\n        if (match = /^(.*)\\.(\\d+)$/.exec(args[0])) {\n          args[0] = match[1];\n          args.splice(1, 0, match[2]);\n        }\n        if (typeof args[args.length - 1] === 'function') {\n          callback = args.pop();\n        }\n        return this._addOpAsTxn('insert', args, callback);\n      }\n    },\n    pop: {\n      type: ARRAY_MUTATOR,\n      fn: function(path, callback) {\n        var at;\n        if (at = this._at) {\n          path = typeof path === 'string' ? at + '.' + path : (callback = path, at);\n        }\n        return this._addOpAsTxn('pop', [path], callback);\n      }\n    },\n    shift: {\n      type: ARRAY_MUTATOR,\n      fn: function(path, callback) {\n        var at;\n        if (at = this._at) {\n          path = typeof path === 'string' ? at + '.' + path : (callback = path, at);\n        }\n        return this._addOpAsTxn('shift', [path], callback);\n      }\n    },\n    remove: {\n      type: ARRAY_MUTATOR,\n      indexArgs: [1],\n      fn: function(path, start, howMany, callback) {\n        var at, match;\n        if (at = this._at) {\n          path = typeof path === 'string' && isNaN(path) ? at + '.' + path : (callback = howMany, howMany = start, start = path, at);\n        }\n        if (match = /^(.*)\\.(\\d+)$/.exec(path)) {\n          callback = howMany;\n          howMany = start;\n          start = match[2];\n          path = match[1];\n        }\n        if (typeof howMany !== 'number') {\n          callback = howMany;\n          howMany = 1;\n        }\n        return this._addOpAsTxn('remove', [path, start, howMany], callback);\n      }\n    },\n    move: {\n      type: ARRAY_MUTATOR,\n      indexArgs: [1, 2],\n      fn: function(path, from, to, howMany, callback) {\n        var at, match;\n        if (at = this._at) {\n          path = typeof path === 'string' && isNaN(path) ? at + '.' + path : (callback = howMany, howMany = to, to = from, from = path, at);\n        }\n        if (match = /^(.*)\\.(\\d+)$/.exec(path)) {\n          callback = howMany;\n          howMany = to;\n          to = from;\n          from = match[2];\n          path = match[1];\n        }\n        if (typeof howMany !== 'number') {\n          callback = howMany;\n          howMany = 1;\n        }\n        return this._addOpAsTxn('move', [path, from, to, howMany], callback);\n      }\n    }\n  }\n};\n\n//@ sourceURL=/node_modules/racer/lib/mutators/mutators.Model.js"
));

require.define("/node_modules/racer/lib/mutators/Async.js", Function(
    [ 'require', 'module', 'exports', '__dirname', '__filename' ],
    "// Generated by CoffeeScript 1.3.1\nvar Async, AsyncAtomic, MAX_RETRIES, RETRY_DELAY, empty, transaction;\n\ntransaction = require('../transaction');\n\nAsync = module.exports = function(options) {\n  var nextTxnId;\n  if (options == null) {\n    options = {};\n  }\n  this.get = options.get;\n  this._commit = options.commit;\n  if (nextTxnId = options.nextTxnId) {\n    this._nextTxnId = function(callback) {\n      return callback(null, '#' + nextTxnId());\n    };\n  }\n};\n\nAsync.prototype = {\n  set: function(path, value, ver, callback) {\n    var _this = this;\n    return this._nextTxnId(function(err, id) {\n      var txn;\n      txn = transaction.create({\n        ver: ver,\n        id: id,\n        method: 'set',\n        args: [path, value]\n      });\n      return _this._commit(txn, callback);\n    });\n  },\n  del: function(path, ver, callback) {\n    var _this = this;\n    return this._nextTxnId(function(err, id) {\n      var txn;\n      txn = transaction.create({\n        ver: ver,\n        id: id,\n        method: 'del',\n        args: [path]\n      });\n      return _this._commit(txn, callback);\n    });\n  },\n  push: function(path, items, ver, callback) {\n    var _this = this;\n    return this._nextTxnId(function(err, id) {\n      var txn;\n      txn = transaction.create({\n        ver: ver,\n        id: id,\n        method: 'push',\n        args: [path].concat(items)\n      });\n      return _this._commit(txn, callback);\n    });\n  },\n  unshift: function(path, items, ver, callback) {\n    var _this = this;\n    return this._nextTxnId(function(err, id) {\n      var txn;\n      txn = transaction.create({\n        ver: ver,\n        id: id,\n        method: 'unshift',\n        args: [path].concat(items)\n      });\n      return _this._commit(txn, callback);\n    });\n  },\n  insert: function(path, index, items, ver, callback) {\n    var _this = this;\n    return this._nextTxnId(function(err, id) {\n      var txn;\n      txn = transaction.create({\n        ver: ver,\n        id: id,\n        method: 'insert',\n        args: [path, index].concat(items)\n      });\n      return _this._commit(txn, callback);\n    });\n  },\n  pop: function(path, ver, callback) {\n    var _this = this;\n    return this._nextTxnId(function(err, id) {\n      var txn;\n      txn = transaction.create({\n        ver: ver,\n        id: id,\n        method: 'pop',\n        args: [path]\n      });\n      return _this._commit(txn, callback);\n    });\n  },\n  shift: function(path, ver, callback) {\n    var _this = this;\n    return this._nextTxnId(function(err, id) {\n      var txn;\n      txn = transaction.create({\n        ver: ver,\n        id: id,\n        method: 'shift',\n        args: [path]\n      });\n      return _this._commit(txn, callback);\n    });\n  },\n  remove: function(path, start, howMany, ver, callback) {\n    var _this = this;\n    return this._nextTxnId(function(err, id) {\n      var txn;\n      txn = transaction.create({\n        ver: ver,\n        id: id,\n        method: 'remove',\n        args: [path, start, howMany]\n      });\n      return _this._commit(txn, callback);\n    });\n  },\n  move: function(path, from, to, howMany, ver, callback) {\n    var _this = this;\n    return this._nextTxnId(function(err, id) {\n      var txn;\n      txn = transaction.create({\n        ver: ver,\n        id: id,\n        method: 'move',\n        args: [path, from, to, howMany]\n      });\n      return _this._commit(txn, callback);\n    });\n  },\n  incr: function(path, byNum, callback) {\n    var tryVal;\n    if (typeof byNum === 'function') {\n      callback = byNum;\n      byNum = 1;\n    } else {\n      if (byNum == null) {\n        byNum = 1;\n      }\n      callback || (callback = empty);\n    }\n    tryVal = null;\n    return this.retry(function(atomic) {\n      return atomic.get(path, function(val) {\n        return atomic.set(path, tryVal = (val || 0) + byNum);\n      });\n    }, function(err) {\n      return callback(err, tryVal);\n    });\n  },\n  setNull: function(path, value, callback) {\n    var tryVal;\n    tryVal = null;\n    return this.retry(function(atomic) {\n      return atomic.get(path, function(val) {\n        if (val != null) {\n          return tryVal = val;\n        }\n        return atomic.set(path, tryVal = value);\n      });\n    }, function(err) {\n      return callback(err, tryVal);\n    });\n  },\n  retry: function(fn, callback) {\n    var atomic, retries;\n    retries = MAX_RETRIES;\n    atomic = new AsyncAtomic(this, function(err) {\n      if (!err) {\n        return typeof callback === \"function\" ? callback() : void 0;\n      }\n      if (!retries--) {\n        return typeof callback === \"function\" ? callback('maxRetries') : void 0;\n      }\n      atomic._reset();\n      return setTimeout(fn, RETRY_DELAY, atomic);\n    });\n    return fn(atomic);\n  }\n};\n\nAsync.MAX_RETRIES = MAX_RETRIES = 20;\n\nAsync.RETRY_DELAY = RETRY_DELAY = 100;\n\nempty = function() {};\n\nAsyncAtomic = function(async, cb) {\n  this.async = async;\n  this.cb = cb;\n  this.minVer = 0;\n  this.count = 0;\n};\n\nAsyncAtomic.prototype = {\n  _reset: function() {\n    this.minVer = 0;\n    return this.count = 0;\n  },\n  get: function(path, callback) {\n    var cb, minVer,\n      _this = this;\n    minVer = this.minVer;\n    cb = this.cb;\n    return this.async.get(path, function(err, value, ver) {\n      if (err) {\n        return cb(err);\n      }\n      _this.minVer = minVer ? Math.min(minVer, ver) : ver;\n      return typeof callback === \"function\" ? callback(value) : void 0;\n    });\n  },\n  set: function(path, value, callback) {\n    var cb,\n      _this = this;\n    this.count++;\n    cb = this.cb;\n    return this.async.set(path, value, this.minVer, function(err, value) {\n      if (err) {\n        return cb(err);\n      }\n      if (typeof callback === \"function\") {\n        callback(null, value);\n      }\n      if (!--_this.count) {\n        return cb();\n      }\n    });\n  },\n  del: function(path, callback) {\n    var cb,\n      _this = this;\n    this.count++;\n    cb = this.cb;\n    return this.async.del(path, this.minVer, function(err) {\n      if (err) {\n        return cb(err);\n      }\n      if (typeof callback === \"function\") {\n        callback();\n      }\n      if (!--_this.count) {\n        return cb();\n      }\n    });\n  }\n};\n\n//@ sourceURL=/node_modules/racer/lib/mutators/Async.js"
));

require.define("/node_modules/racer/lib/transaction.js", Function(
    [ 'require', 'module', 'exports', '__dirname', '__filename' ],
    "// Generated by CoffeeScript 1.3.1\n\nmodule.exports = {\n  create: function(obj) {\n    var txn;\n    if (obj.ops) {\n      txn = [obj.ver, obj.id, obj.ops];\n    } else {\n      txn = [obj.ver, obj.id, obj.method, obj.args];\n    }\n    return txn;\n  },\n  getVer: function(txn) {\n    return txn[0];\n  },\n  setVer: function(txn, val) {\n    return txn[0] = val;\n  },\n  getId: function(txn) {\n    return txn[1];\n  },\n  setId: function(txn, id) {\n    return txn[1] = id;\n  },\n  clientIdAndVer: function(txn) {\n    var res;\n    res = this.getId(txn).split('.');\n    res[1] = parseInt(res[1], 10);\n    return res;\n  },\n  getMethod: function(txn) {\n    return txn[2];\n  },\n  setMethod: function(txn, name) {\n    return txn[2] = name;\n  },\n  getArgs: function(txn) {\n    return txn[3];\n  },\n  copyArgs: function(txn) {\n    return this.getArgs(txn).slice();\n  },\n  setArgs: function(txn, vals) {\n    return txn[3] = vals;\n  },\n  getPath: function(txn) {\n    return this.getArgs(txn)[0];\n  },\n  setPath: function(txn, val) {\n    return this.getArgs(txn)[0] = val;\n  },\n  getMeta: function(txn) {\n    return txn[4];\n  },\n  setMeta: function(txn, vals) {\n    return txn[4] = vals;\n  },\n  getClientId: function(txn) {\n    return this.getId(txn).split('.')[0];\n  },\n  setClientId: function(txn, newClientId) {\n    var clientId, num, _ref;\n    _ref = this.getId(txn).split('.'), clientId = _ref[0], num = _ref[1];\n    this.setId(txn, newClientId + '.' + num);\n    return newClientId;\n  },\n  pathConflict: function(pathA, pathB) {\n    var pathALen, pathBLen;\n    if (pathA === pathB) {\n      return 'equal';\n    }\n    pathALen = pathA.length;\n    pathBLen = pathB.length;\n    if (pathALen === pathBLen) {\n      return false;\n    }\n    if (pathALen > pathBLen) {\n      return pathA.charAt(pathBLen) === '.' && pathA.slice(0, pathBLen) === pathB && 'child';\n    }\n    return pathB.charAt(pathALen) === '.' && pathB.slice(0, pathALen) === pathA && 'parent';\n  },\n  ops: function(txn, ops) {\n    if (ops !== void 0) {\n      txn[2] = ops;\n    }\n    return txn[2];\n  },\n  isCompound: function(txn) {\n    return Array.isArray(txn[2]);\n  },\n  op: {\n    create: function(obj) {\n      var op;\n      op = [obj.method, obj.args];\n      return op;\n    },\n    getMethod: function(op) {\n      return op[0];\n    },\n    setMethod: function(op, name) {\n      return op[0] = name;\n    },\n    getArgs: function(op) {\n      return op[1];\n    },\n    setArgs: function(op, vals) {\n      return op[1] = vals;\n    }\n  }\n};\n\n//@ sourceURL=/node_modules/racer/lib/transaction.js"
));

require.define("/node_modules/racer/lib/refs/index.js", Function(
    [ 'require', 'module', 'exports', '__dirname', '__filename' ],
    "// Generated by CoffeeScript 1.3.1\nvar createRef, createRefList, derefPath, diffArrays, equal, exports, isPrivate, isServer, mixin, racer, regExpPathOrParent, regExpPathsOrChildren, _ref, _ref1,\n  __slice = [].slice;\n\n_ref = require('../path'), isPrivate = _ref.isPrivate, regExpPathOrParent = _ref.regExpPathOrParent, regExpPathsOrChildren = _ref.regExpPathsOrChildren;\n\nderefPath = require('./util').derefPath;\n\ncreateRef = require('./ref');\n\ncreateRefList = require('./refList');\n\ndiffArrays = require('../diffMatchPatch').diffArrays;\n\n_ref1 = require('../util'), isServer = _ref1.isServer, equal = _ref1.equal;\n\nracer = require('../racer');\n\nexports = module.exports = function(racer) {\n  return racer.mixin(mixin);\n};\n\nexports.useWith = {\n  server: true,\n  browser: true\n};\n\nmixin = {\n  type: 'Model',\n  server: __dirname + '/refs.server',\n  events: {\n    init: function(model) {\n      var Model, memory, method, _fn;\n      model._root = model;\n      model._refsToBundle = [];\n      model._fnsToBundle = [];\n      Model = model.constructor;\n      _fn = function(method) {\n        return model.on(method, function(_arg) {\n          var path;\n          path = _arg[0];\n          return model.emit('mutator', method, path, arguments);\n        });\n      };\n      for (method in Model.mutator) {\n        _fn(method);\n      }\n      memory = model._memory;\n      return model.on('beforeTxn', function(method, args) {\n        var data, fn, obj, path;\n        if (path = args[0]) {\n          obj = memory.get(path, data = model._specModel());\n          if (fn = data.$deref) {\n            args[0] = fn(method, args, model, obj);\n          }\n        }\n      });\n    },\n    bundle: function(model) {\n      var from, get, item, onLoad, _i, _j, _len, _len1, _ref2, _ref3, _ref4;\n      onLoad = model._onLoad;\n      _ref2 = model._refsToBundle;\n      for (_i = 0, _len = _ref2.length; _i < _len; _i++) {\n        _ref3 = _ref2[_i], from = _ref3[0], get = _ref3[1], item = _ref3[2];\n        if (model._getRef(from) === get) {\n          onLoad.push(item);\n        }\n      }\n      _ref4 = model._fnsToBundle;\n      for (_j = 0, _len1 = _ref4.length; _j < _len1; _j++) {\n        item = _ref4[_j];\n        if (item) {\n          onLoad.push(item);\n        }\n      }\n    }\n  },\n  proto: {\n    _getRef: function(path) {\n      return this._memory.get(path, this._specModel(), true);\n    },\n    _ensurePrivateRefPath: function(from, modelMethod) {\n      if (!isPrivate(this.dereference(from, true))) {\n        throw new Error(\"Cannot create \" + modelMethod + \" on public path '\" + from + \"'\");\n      }\n    },\n    dereference: function(path, getRef) {\n      var data;\n      if (getRef == null) {\n        getRef = false;\n      }\n      this._memory.get(path, data = this._specModel(), getRef);\n      return derefPath(data, path);\n    },\n    ref: function(from, to, key) {\n      return this._createRef(createRef, 'ref', from, to, key);\n    },\n    refList: function(from, to, key) {\n      return this._createRef(createRefList, 'refList', from, to, key);\n    },\n    _createRef: function(refFactory, modelMethod, from, to, key) {\n      var get, listener, model, previous, value;\n      if (this._at) {\n        key = to;\n        to = from;\n        from = this._at;\n      } else if (from._at) {\n        from = from._at;\n      }\n      if (to._at) {\n        to = to._at;\n      }\n      if (key && key._at) {\n        key = key._at;\n      }\n      model = this._root;\n      model._ensurePrivateRefPath(from, modelMethod);\n      get = refFactory(model, from, to, key);\n      listener = model.on('beforeTxn', function(method, args) {\n        if (method === 'set' && args[1] === get) {\n          args.cancelEmit = true;\n          model.removeListener('beforeTxn', listener);\n        }\n      });\n      previous = model.set(from, get);\n      value = model.get(from);\n      model.emit('set', [from, value], previous, true, void 0);\n      if (typeof this._onCreateRef === \"function\") {\n        this._onCreateRef(modelMethod, from, to, key, get);\n      }\n      return model.at(from);\n    },\n    fn: function() {\n      var fn, fullPath, i, input, inputs, model, path, _i, _j, _len;\n      inputs = 2 <= arguments.length ? __slice.call(arguments, 0, _i = arguments.length - 1) : (_i = 0, []), fn = arguments[_i++];\n      for (i = _j = 0, _len = inputs.length; _j < _len; i = ++_j) {\n        input = inputs[i];\n        if (fullPath = input._at) {\n          inputs[i] = fullPath;\n        }\n      }\n      if (this._at) {\n        path = this._at + '.' + inputs.shift();\n      } else {\n        path = inputs.shift();\n      }\n      model = this._root;\n      model._ensurePrivateRefPath(path, 'fn');\n      if (typeof fn === 'string') {\n        fn = new Function('return ' + fn)();\n      }\n      return model._createFn(path, inputs, fn);\n    },\n    _createFn: function(path, inputs, fn, destroy, prevVal, currVal) {\n      var listener, model, reInput, reSelf, updateVal,\n        _this = this;\n      reSelf = regExpPathOrParent(path);\n      reInput = regExpPathsOrChildren(inputs);\n      destroy = typeof this._onCreateFn === \"function\" ? this._onCreateFn(path, inputs, fn) : void 0;\n      listener = this.on('mutator', function(mutator, mutatorPath, _arguments) {\n        if (_arguments[3] === listener) {\n          return;\n        }\n        if (reSelf.test(mutatorPath) && !equal(_this.get(path), currVal)) {\n          _this.removeListener('mutator', listener);\n          return typeof destroy === \"function\" ? destroy() : void 0;\n        }\n        if (reInput.test(mutatorPath)) {\n          return currVal = updateVal();\n        }\n      });\n      model = this.pass(listener);\n      return (updateVal = function() {\n        var input;\n        prevVal = currVal;\n        currVal = fn.apply(null, (function() {\n          var _i, _len, _results;\n          _results = [];\n          for (_i = 0, _len = inputs.length; _i < _len; _i++) {\n            input = inputs[_i];\n            _results.push(this.get(input));\n          }\n          return _results;\n        }).call(_this));\n        if (equal(prevVal, currVal)) {\n          return currVal;\n        }\n        model.set(path, currVal);\n        return currVal;\n      })();\n    }\n  }\n};\n\n//@ sourceURL=/node_modules/racer/lib/refs/index.js"
));

require.define("/node_modules/racer/lib/refs/util.js", Function(
    [ 'require', 'module', 'exports', '__dirname', '__filename' ],
    "// Generated by CoffeeScript 1.3.1\n\nmodule.exports = {\n  derefPath: function(data, to) {\n    return (typeof data.$deref === \"function\" ? data.$deref() : void 0) || to;\n  },\n  lookupPath: function(path, props, i) {\n    return [path].concat(props.slice(i)).join('.');\n  }\n};\n\n//@ sourceURL=/node_modules/racer/lib/refs/util.js"
));

require.define("/node_modules/racer/lib/refs/ref.js", Function(
    [ 'require', 'module', 'exports', '__dirname', '__filename' ],
    "// Generated by CoffeeScript 1.3.1\nvar Model, addListener, derefPath, eventRegExp, exports, lookupPath, setupRefWithKey, setupRefWithoutKey, _ref;\n\neventRegExp = require('../path').eventRegExp;\n\n_ref = require('./util'), derefPath = _ref.derefPath, lookupPath = _ref.lookupPath;\n\nModel = require('../Model');\n\nexports = module.exports = function(model, from, to, key) {\n  if (!from) {\n    throw new Error('Missing `from` in `model.ref(from, to, key)`');\n  }\n  if (!to) {\n    throw new Error('Missing `to` in `model.ref(from, to, key)`');\n  }\n  if (key) {\n    return setupRefWithKey(model, from, to, key);\n  }\n  return setupRefWithoutKey(model, from, to);\n};\n\nsetupRefWithKey = function(model, from, to, key) {\n  var getter, listeners;\n  listeners = [];\n  getter = function(lookup, data, path, props, len, i) {\n    var curr, currPath, dereffed;\n    lookup(to, data);\n    dereffed = derefPath(data, to) + '.';\n    data.$deref = null;\n    dereffed += lookup(key, data);\n    curr = lookup(dereffed, data);\n    currPath = lookupPath(dereffed, props, i);\n    data.$deref = function(method) {\n      if (i === len && method in Model.basicMutator) {\n        return path;\n      } else {\n        return currPath;\n      }\n    };\n    return [curr, currPath, i];\n  };\n  addListener(model, from, getter, listeners, \"\" + to + \".*\", function(match) {\n    var index, keyPath, remainder;\n    keyPath = model.get(key) + '';\n    remainder = match[1];\n    if (remainder === keyPath) {\n      return from;\n    }\n    index = keyPath.length;\n    if (remainder.slice(0, index + 1 || 9e9) === keyPath + '.') {\n      remainder = remainder.slice(index + 1);\n      return from + '.' + remainder;\n    }\n    return null;\n  });\n  addListener(model, from, getter, listeners, key, function(match, mutator, args) {\n    if (mutator === 'set') {\n      args[1] = model.get(to + '.' + args[1]);\n      args.out = model.get(to + '.' + args.out);\n    } else if (mutator === 'del') {\n      args.out = model.get(to + '.' + args.out);\n    }\n    return from;\n  });\n  return getter;\n};\n\nsetupRefWithoutKey = function(model, from, to) {\n  var getter, listeners;\n  listeners = [];\n  getter = function(lookup, data, path, props, len, i) {\n    var curr, currPath, dereffed;\n    curr = lookup(to, data);\n    dereffed = derefPath(data, to);\n    currPath = lookupPath(dereffed, props, i);\n    data.$deref = function(method) {\n      if (i === len && method in Model.basicMutator) {\n        return path;\n      } else {\n        return currPath;\n      }\n    };\n    return [curr, currPath, i];\n  };\n  addListener(model, from, getter, listeners, \"\" + to + \".*\", function(match) {\n    return from + '.' + match[1];\n  });\n  addListener(model, from, getter, listeners, to, function() {\n    return from;\n  });\n  return getter;\n};\n\nexports.addListener = addListener = function(model, from, getter, listeners, pattern, callback) {\n  var listener, re;\n  re = eventRegExp(pattern);\n  listener = function(mutator, path, _arguments) {\n    var args, fn, _i, _len;\n    if (re.test(path)) {\n      if (model._getRef(from) !== getter) {\n        for (_i = 0, _len = listeners.length; _i < _len; _i++) {\n          fn = listeners[_i];\n          model.removeListener('mutator', fn);\n        }\n        return;\n      }\n      args = _arguments[0].slice();\n      args.out = _arguments[1];\n      path = callback(re.exec(path), mutator, args);\n      if (path === null) {\n        return;\n      }\n      args[0] = path;\n      model.emit(mutator, args, args.out, _arguments[2], _arguments[3]);\n    }\n  };\n  listeners.push(listener);\n  return model.on('mutator', listener);\n};\n\n//@ sourceURL=/node_modules/racer/lib/refs/ref.js"
));

require.define("/node_modules/racer/lib/refs/refList.js", Function(
    [ 'require', 'module', 'exports', '__dirname', '__filename' ],
    "// Generated by CoffeeScript 1.3.1\nvar Model, addListener, createGetter, derefPath, hasKeys, lookupPath, mergeAll, ref, _ref, _ref1;\n\n_ref = require('../util'), mergeAll = _ref.mergeAll, hasKeys = _ref.hasKeys;\n\n_ref1 = require('./util'), derefPath = _ref1.derefPath, lookupPath = _ref1.lookupPath;\n\nModel = require('../Model');\n\naddListener = (ref = require('./ref')).addListener;\n\nmodule.exports = function(model, from, to, key) {\n  var arrayMutators, getter, listeners;\n  if (!(from && to && key)) {\n    throw new Error('Invalid arguments for model.refList');\n  }\n  listeners = [];\n  arrayMutators = Model.arrayMutator;\n  getter = createGetter(from, to, key);\n  addListener(model, from, getter, listeners, key, function(match, method, args) {\n    var i, id, _ref2;\n    if (i = (_ref2 = arrayMutators[method]) != null ? _ref2.insertArgs : void 0) {\n      while ((id = args[i]) != null) {\n        args[i] = model.get(to + '.' + id);\n        i++;\n      }\n    }\n    return from;\n  });\n  addListener(model, from, getter, listeners, \"\" + to + \".*\", function(match) {\n    var found, i, id, pointerList, remainder, value, _i, _len;\n    id = match[1];\n    if (~(i = id.indexOf('.'))) {\n      remainder = id.substr(i + 1);\n      id = id.substr(0, i);\n    }\n    if (pointerList = model.get(key)) {\n      for (i = _i = 0, _len = pointerList.length; _i < _len; i = ++_i) {\n        value = pointerList[i];\n        if (value == id) {\n          found = true;\n          break;\n        }\n      }\n    }\n    if (!found) {\n      return null;\n    }\n    if (remainder) {\n      return \"\" + from + \".\" + i + \".\" + remainder;\n    } else {\n      return \"\" + from + \".\" + i;\n    }\n  });\n  return getter;\n};\n\ncreateGetter = function(from, to, key) {\n  var getter;\n  return getter = function(lookup, data, path, props, len, i) {\n    var arrayMutators, basicMutators, curr, currPath, dereffed, dereffedKey, index, obj, pointerList, prop;\n    basicMutators = Model.basicMutator;\n    arrayMutators = Model.arrayMutator;\n    obj = lookup(to, data) || {};\n    dereffed = derefPath(data, to);\n    data.$deref = null;\n    pointerList = lookup(key, data);\n    dereffedKey = derefPath(data, key);\n    if (i === len) {\n      currPath = lookupPath(dereffed, props, i);\n      data.$deref = function(method, args, model) {\n        var arg, id, index, indexArgs, j, keyId, mutator, _i, _j, _len, _len1;\n        if (method in basicMutators) {\n          return path;\n        }\n        if (mutator = arrayMutators[method]) {\n          if (indexArgs = mutator.indexArgs) {\n            for (_i = 0, _len = indexArgs.length; _i < _len; _i++) {\n              j = indexArgs[_i];\n              if (!((arg = args[j]) && ((id = arg.id) != null))) {\n                continue;\n              }\n              for (index = _j = 0, _len1 = pointerList.length; _j < _len1; index = ++_j) {\n                keyId = pointerList[index];\n                if (keyId == id) {\n                  args[j] = index;\n                  break;\n                }\n              }\n            }\n          }\n          if (j = mutator.insertArgs) {\n            while (arg = args[j]) {\n              if ((id = arg.id) == null) {\n                id = arg.id = model.id();\n              }\n              if (hasKeys(arg, 'id')) {\n                model.set(dereffed + '.' + id, arg);\n              }\n              args[j] = id;\n              j++;\n            }\n          }\n          return dereffedKey;\n        }\n        throw new Error(method + ' unsupported on refList');\n      };\n      if (pointerList) {\n        curr = (function() {\n          var _i, _len, _results;\n          _results = [];\n          for (_i = 0, _len = pointerList.length; _i < _len; _i++) {\n            prop = pointerList[_i];\n            _results.push(obj[prop]);\n          }\n          return _results;\n        })();\n        return [curr, currPath, i];\n      }\n      return [void 0, currPath, i];\n    } else {\n      index = props[i++];\n      if (pointerList && ((prop = pointerList[index]) != null)) {\n        curr = obj[prop];\n      }\n      if (i === len) {\n        currPath = lookupPath(dereffed, props, i);\n        data.$deref = function(method, args, model, obj) {\n          var id, value;\n          if (method === 'set') {\n            value = args[1];\n            if ((id = value.id) == null) {\n              id = value.id = model.id();\n            }\n            if (pointerList) {\n              model.set(dereffedKey + '.' + index, id);\n            } else {\n              model.set(dereffedKey, [id]);\n            }\n            return currPath + '.' + id;\n          }\n          if (method === 'del') {\n            if ((id = obj.id) == null) {\n              throw new Error('Cannot delete refList item without id');\n            }\n            model.del(dereffedKey + '.' + index);\n            return currPath + '.' + id;\n          }\n          throw new Error(method + ' unsupported on refList index');\n        };\n      } else {\n        currPath = lookupPath(dereffed + '.' + prop, props, i);\n        data.$deref = function(method) {\n          if (method && prop == null) {\n            throw new Error(method + ' on undefined refList child ' + props.join('.'));\n          }\n          return currPath;\n        };\n      }\n      return [curr, currPath, i];\n    }\n  };\n};\n\n//@ sourceURL=/node_modules/racer/lib/refs/refList.js"
));

require.define("/node_modules/racer/lib/diffMatchPatch.js", Function(
    [ 'require', 'module', 'exports', '__dirname', '__filename' ],
    "// Generated by CoffeeScript 1.3.1\nvar addInsertOrRemove, diffArrays, moveLookAhead,\n  __slice = [].slice;\n\nmodule.exports = {\n  diffArrays: function(before, after) {\n    var current, inserts, items, moves, op, out, removes, _i, _j, _k, _len, _len1, _len2;\n    out = [];\n    current = before.slice();\n    diffArrays(before, after, removes = [], moves = [], inserts = []);\n    while (removes.length || moves.length || inserts.length) {\n      out = out.concat(removes, moves, inserts);\n      for (_i = 0, _len = removes.length; _i < _len; _i++) {\n        op = removes[_i];\n        current.splice(op[1], op[2]);\n      }\n      for (_j = 0, _len1 = moves.length; _j < _len1; _j++) {\n        op = moves[_j];\n        items = current.splice(op[1], op[3]);\n        current.splice.apply(current, [op[2], 0].concat(__slice.call(items)));\n      }\n      for (_k = 0, _len2 = inserts.length; _k < _len2; _k++) {\n        op = inserts[_k];\n        current.splice.apply(current, [op[1], 0].concat(__slice.call(op.slice(2))));\n      }\n      diffArrays(current, after, removes = [], moves = [], inserts = []);\n    }\n    return out;\n  }\n};\n\ndiffArrays = function(before, after, removes, moves, inserts) {\n  var a, afterLen, b, dir, end, from, fromBackward, fromForward, i, index, indexAfter, indexBefore, insert, itemAfter, itemBefore, j, move, moveFrom, num, numBackward, numForward, numInsert, numRemove, offset, op, otherItem, remove, skipA, skipB, to, toBackward, toForward, _i, _j, _k, _l, _len, _len1, _len2, _len3;\n  afterLen = after.length;\n  a = b = -1;\n  skipA = {};\n  skipB = {};\n  while (a < afterLen) {\n    while (skipA[++a]) {\n      addInsertOrRemove(inserts, removes, after, insert, numInsert, remove, numRemove);\n      insert = remove = null;\n    }\n    while (skipB[++b]) {\n      addInsertOrRemove(inserts, removes, after, insert, numInsert, remove, numRemove);\n      insert = remove = null;\n    }\n    itemAfter = after[a];\n    itemBefore = before[b];\n    if (itemAfter === itemBefore) {\n      addInsertOrRemove(inserts, removes, after, insert, numInsert, remove, numRemove);\n      insert = remove = null;\n      continue;\n    }\n    indexAfter = before.indexOf(itemAfter, b);\n    while (skipB[indexAfter]) {\n      indexAfter = before.indexOf(itemAfter, indexAfter + 1);\n    }\n    if (a < afterLen && indexAfter === -1) {\n      if (insert == null) {\n        insert = a;\n        numInsert = 0;\n      }\n      numInsert++;\n      b--;\n      continue;\n    }\n    indexBefore = after.indexOf(itemBefore, a);\n    while (skipA[indexBefore]) {\n      indexBefore = after.indexOf(itemBefore, indexBefore + 1);\n    }\n    if (indexBefore === -1) {\n      if (remove == null) {\n        remove = b;\n        numRemove = 0;\n      }\n      numRemove++;\n      a--;\n      continue;\n    }\n    addInsertOrRemove(inserts, removes, after, insert, numInsert, remove, numRemove);\n    insert = remove = null;\n    fromBackward = indexAfter;\n    toBackward = a;\n    numBackward = moveLookAhead(before, after, skipA, skipB, afterLen, fromBackward, toBackward, itemBefore);\n    fromForward = b;\n    toForward = indexBefore;\n    otherItem = numBackward === -1 ? NaN : itemAfter;\n    numForward = moveLookAhead(before, after, skipA, skipB, afterLen, fromForward, toForward, otherItem);\n    dir = numBackward === -1 ? dir = true : numForward === -1 ? dir = false : numForward < numBackward;\n    if (dir) {\n      from = fromForward;\n      to = toForward;\n      num = numForward;\n      a--;\n    } else {\n      from = fromBackward;\n      to = toBackward;\n      num = numBackward;\n      b--;\n    }\n    moves.push(['move', from, to, num]);\n    end = from + num;\n    while (from < end) {\n      skipB[from++] = true;\n      skipA[to++] = true;\n    }\n  }\n  offset = 0;\n  for (_i = 0, _len = removes.length; _i < _len; _i++) {\n    op = removes[_i];\n    index = op[1] += offset;\n    num = op[2];\n    offset -= num;\n    for (_j = 0, _len1 = moves.length; _j < _len1; _j++) {\n      move = moves[_j];\n      if (index < move[1]) {\n        move[1] -= num;\n      }\n    }\n  }\n  i = inserts.length;\n  while (op = inserts[--i]) {\n    num = op.length - 2;\n    index = op[1];\n    for (_k = 0, _len2 = moves.length; _k < _len2; _k++) {\n      move = moves[_k];\n      if (index <= move[2]) {\n        move[2] -= num;\n      }\n    }\n  }\n  for (i = _l = 0, _len3 = moves.length; _l < _len3; i = ++_l) {\n    op = moves[i];\n    from = op[1];\n    to = op[2];\n    num = op[3];\n    j = i;\n    while (move = moves[++j]) {\n      moveFrom = move[1];\n      if (to < moveFrom && from < moveFrom) {\n        continue;\n      }\n      move[1] = from < moveFrom ? moveFrom - num : moveFrom + num;\n    }\n  }\n};\n\nmoveLookAhead = function(before, after, skipA, skipB, afterLen, b, a, otherItem) {\n  var item, num;\n  num = 1;\n  if (skipB[b] || skipA[a]) {\n    return -1;\n  }\n  while ((item = before[++b]) === after[++a] && a < afterLen) {\n    if (item === otherItem || skipB[b] || skipA[a]) {\n      return num;\n    }\n    num++;\n  }\n  return num;\n};\n\naddInsertOrRemove = function(inserts, removes, after, insert, numInsert, remove, numRemove) {\n  if (insert != null) {\n    inserts.push(['insert', insert].concat(__slice.call(after.slice(insert, insert + numInsert))));\n  }\n  if (remove != null) {\n    removes.push(['remove', remove, numRemove]);\n  }\n};\n\n//@ sourceURL=/node_modules/racer/lib/diffMatchPatch.js"
));

require.define("/node_modules/racer/lib/pubSub/index.js", Function(
    [ 'require', 'module', 'exports', '__dirname', '__filename' ],
    "// Generated by CoffeeScript 1.3.1\nvar exports, mixinModel, mixinStore;\n\nmixinModel = require('./pubSub.Model');\n\nmixinStore = __dirname + '/pubSub.Store';\n\nexports = module.exports = function(racer) {\n  return racer.mixin(mixinModel, mixinStore);\n};\n\nexports.useWith = {\n  server: true,\n  browser: true\n};\n\n//@ sourceURL=/node_modules/racer/lib/pubSub/index.js"
));

require.define("/node_modules/racer/lib/pubSub/pubSub.Model.js", Function(
    [ 'require', 'module', 'exports', '__dirname', '__filename' ],
    "// Generated by CoffeeScript 1.3.1\nvar LiveQuery, Query, deserialize, empty, expandPath, merge, splitPath, transaction, _ref,\n  __slice = [].slice;\n\ntransaction = require('../transaction');\n\n_ref = require('../path'), expandPath = _ref.expand, splitPath = _ref.split;\n\nLiveQuery = require('./LiveQuery');\n\ndeserialize = (Query = require('./Query')).deserialize;\n\nmerge = require('../util').merge;\n\nempty = function() {};\n\nmodule.exports = {\n  type: 'Model',\n  events: {\n    init: function(model) {\n      model._pathSubs = {};\n      model._querySubs = {};\n      return model._liveQueries = {};\n    },\n    bundle: function(model) {\n      var query, querySubs, _;\n      querySubs = (function() {\n        var _ref1, _results;\n        _ref1 = model._querySubs;\n        _results = [];\n        for (_ in _ref1) {\n          query = _ref1[_];\n          _results.push(query);\n        }\n        return _results;\n      })();\n      return model._onLoad.push(['_loadSubs', model._pathSubs, querySubs]);\n    },\n    socket: function(model, socket) {\n      var memory;\n      memory = model._memory;\n      socket.on('resyncWithStore', function(fn) {\n        return fn(model._subs(), memory.version, model._startId);\n      });\n      socket.on('addDoc', function(_arg, num) {\n        var data, doc, ns, txn, ver;\n        doc = _arg.doc, ns = _arg.ns, ver = _arg.ver;\n        if ((data = memory.get(ns)) && data[doc.id]) {\n          return model._addRemoteTxn(null, num);\n        } else {\n          txn = transaction.create({\n            ver: ver,\n            id: null,\n            method: 'set',\n            args: [\"\" + ns + \".\" + doc.id, doc]\n          });\n          model._addRemoteTxn(txn, num);\n          return model.emit('addDoc', \"\" + ns + \".\" + doc.id, doc);\n        }\n      });\n      return socket.on('rmDoc', function(_arg, num) {\n        var doc, hash, id, key, ns, query, txn, ver, _ref1;\n        doc = _arg.doc, ns = _arg.ns, hash = _arg.hash, id = _arg.id, ver = _arg.ver;\n        _ref1 = model._liveQueries;\n        for (key in _ref1) {\n          query = _ref1[key];\n          if (hash !== key && query.test(doc, \"\" + ns + \".\" + id)) {\n            return model._addRemoteTxn(null, num);\n          }\n        }\n        txn = transaction.create({\n          ver: ver,\n          id: null,\n          method: 'del',\n          args: [\"\" + ns + \".\" + id]\n        });\n        model._addRemoteTxn(txn, num);\n        return model.emit('rmDoc', ns + '.' + id, doc);\n      });\n    }\n  },\n  proto: {\n    _loadSubs: function(_pathSubs, querySubList) {\n      var hash, item, liveQueries, query, querySubs, _i, _len;\n      this._pathSubs = _pathSubs;\n      querySubs = this._querySubs;\n      liveQueries = this._liveQueries;\n      for (_i = 0, _len = querySubList.length; _i < _len; _i++) {\n        item = querySubList[_i];\n        query = deserialize(item);\n        hash = query.hash();\n        querySubs[hash] = query;\n        liveQueries[hash] = new LiveQuery(query);\n      }\n    },\n    query: function(namespace, opts) {\n      var args, conditions, k, method, property, q, v;\n      q = new Query(namespace);\n      if (opts) {\n        for (k in opts) {\n          v = opts[k];\n          switch (k) {\n            case 'byKey':\n            case 'skip':\n            case 'limit':\n            case 'sort':\n              q = q[k](v);\n              break;\n            case 'where':\n              for (property in v) {\n                conditions = v[property];\n                q = q.where(property);\n                if (conditions.constructor === Object) {\n                  for (method in conditions) {\n                    args = conditions[method];\n                    q = q[method](args);\n                  }\n                } else {\n                  q = q.equals(conditions);\n                }\n              }\n              break;\n            case 'only':\n            case 'except':\n              q = q[k].apply(q, v);\n              break;\n            default:\n              throw new Error(\"Unsupported key \" + k);\n          }\n        }\n      }\n      return q;\n    },\n    fetch: function() {\n      var callback, last, newTargets, out, path, root, target, targets, _i, _j, _len, _len1, _ref1,\n        _this = this;\n      targets = 1 <= arguments.length ? __slice.call(arguments, 0) : [];\n      last = targets[targets.length - 1];\n      callback = typeof last === 'function' ? targets.pop() : empty;\n      newTargets = [];\n      out = [];\n      for (_i = 0, _len = targets.length; _i < _len; _i++) {\n        target = targets[_i];\n        if (target.isQuery) {\n          root = target.namespace;\n          newTargets.push(target);\n        } else {\n          if (target._at) {\n            target = target._at;\n          }\n          root = splitPath(target)[0];\n          _ref1 = expandPath(target);\n          for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {\n            path = _ref1[_j];\n            newTargets.push(path);\n          }\n        }\n        out.push(this.at(root, true));\n      }\n      return this._fetch(newTargets, function(err, data) {\n        _this._initSubData(data);\n        return callback.apply(null, [err].concat(__slice.call(out)));\n      });\n    },\n    subscribe: function() {\n      var callback, hash, last, liveQueries, newTargets, out, path, pathSubs, querySubs, root, target, targets, _i, _j, _len, _len1, _ref1,\n        _this = this;\n      targets = 1 <= arguments.length ? __slice.call(arguments, 0) : [];\n      last = targets[targets.length - 1];\n      callback = typeof last === 'function' ? targets.pop() : empty;\n      pathSubs = this._pathSubs;\n      querySubs = this._querySubs;\n      liveQueries = this._liveQueries;\n      newTargets = [];\n      out = [];\n      for (_i = 0, _len = targets.length; _i < _len; _i++) {\n        target = targets[_i];\n        if (target.isQuery) {\n          root = target.namespace;\n          hash = target.hash();\n          if (!querySubs[hash]) {\n            querySubs[hash] = target;\n            liveQueries[hash] = new LiveQuery(target);\n            newTargets.push(target);\n          }\n        } else {\n          if (target._at) {\n            target = target._at;\n          }\n          root = splitPath(target)[0];\n          _ref1 = expandPath(target);\n          for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {\n            path = _ref1[_j];\n            if (pathSubs[path]) {\n              continue;\n            }\n            pathSubs[path] = 1;\n            newTargets.push(path);\n          }\n        }\n        out.push(this.at(root, true));\n      }\n      if (!newTargets.length) {\n        return callback.apply(null, [null].concat(__slice.call(out)));\n      }\n      return this._addSub(newTargets, function(err, data) {\n        if (err) {\n          return callback(err);\n        }\n        _this._initSubData(data);\n        return callback.apply(null, [null].concat(__slice.call(out)));\n      });\n    },\n    unsubscribe: function() {\n      var callback, hash, last, liveQueries, newTargets, path, pathSubs, querySubs, target, targets, _i, _j, _len, _len1, _ref1;\n      targets = 1 <= arguments.length ? __slice.call(arguments, 0) : [];\n      last = targets[targets.length - 1];\n      callback = typeof last === 'function' ? targets.pop() : empty;\n      pathSubs = this._pathSubs;\n      querySubs = this._querySubs;\n      liveQueries = this._liveQueries;\n      newTargets = [];\n      for (_i = 0, _len = targets.length; _i < _len; _i++) {\n        target = targets[_i];\n        if (target.isQuery) {\n          hash = target.hash();\n          if (querySubs[hash]) {\n            delete querySubs[hash];\n            delete liveQueries[hash];\n            newTargets.push(target);\n          }\n        } else {\n          _ref1 = expandPath(target);\n          for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {\n            path = _ref1[_j];\n            if (!pathSubs[path]) {\n              continue;\n            }\n            delete pathSubs[path];\n            newTargets.push(path);\n          }\n        }\n      }\n      if (!newTargets.length) {\n        return callback();\n      }\n      return this._removeSub(newTargets, callback);\n    },\n    _initSubData: function(data) {\n      this.emit('subInit', data);\n      return this._initData(data);\n    },\n    _initData: function(data) {\n      var memory, path, value, ver, _i, _len, _ref1, _ref2;\n      memory = this._memory;\n      _ref1 = data.data;\n      for (_i = 0, _len = _ref1.length; _i < _len; _i++) {\n        _ref2 = _ref1[_i], path = _ref2[0], value = _ref2[1], ver = _ref2[2];\n        memory.set(path, value, ver);\n      }\n    },\n    _fetch: function(targets, callback) {\n      if (!this.connected) {\n        return callback('disconnected');\n      }\n      return this.socket.emit('fetch', targets, callback);\n    },\n    _addSub: function(targets, callback) {\n      if (!this.connected) {\n        return callback('disconnected');\n      }\n      return this.socket.emit('addSub', targets, callback);\n    },\n    _removeSub: function(targets, callback) {\n      if (!this.connected) {\n        return callback('disconnected');\n      }\n      return this.socket.emit('removeSub', targets, callback);\n    },\n    _subs: function() {\n      var query, subs, _, _ref1;\n      subs = Object.keys(this._pathSubs);\n      _ref1 = this._querySubs;\n      for (_ in _ref1) {\n        query = _ref1[_];\n        subs.push(query);\n      }\n      return subs;\n    }\n  },\n  server: {\n    _fetch: function(targets, callback) {\n      var store;\n      store = this.store;\n      return this._clientIdPromise.on(function(err, clientId) {\n        if (err) {\n          return callback(err);\n        }\n        return store.fetch(clientId, targets, callback);\n      });\n    },\n    _addSub: function(targets, callback) {\n      var _this = this;\n      return this._clientIdPromise.on(function(err, clientId) {\n        if (err) {\n          return callback(err);\n        }\n        return _this.store.subscribe(clientId, targets, callback);\n      });\n    },\n    _removeSub: function(targets, callback) {\n      var store;\n      store = this.store;\n      return this._clientIdPromise.on(function(err, clientId) {\n        if (err) {\n          return callback(err);\n        }\n        return store.unsubscribe(clientId, targets, callback);\n      });\n    }\n  }\n};\n\n//@ sourceURL=/node_modules/racer/lib/pubSub/pubSub.Model.js"
));

require.define("/node_modules/racer/lib/pubSub/LiveQuery.js", Function(
    [ 'require', 'module', 'exports', '__dirname', '__filename' ],
    "// Generated by CoffeeScript 1.3.1\nvar LiveQuery, compileDocFilter, compileSortComparator, deepEqual, deepIndexOf, evalToTrue, indexOf, lookup, transaction, _ref,\n  __slice = [].slice;\n\nlookup = require('../path').lookup;\n\ntransaction = require('../transaction');\n\n_ref = require('../util'), indexOf = _ref.indexOf, deepIndexOf = _ref.deepIndexOf, deepEqual = _ref.deepEqual;\n\nmodule.exports = LiveQuery = function(query) {\n  var args, method, _i, _len, _ref1, _ref2;\n  this.query = query;\n  this._predicates = [];\n  _ref1 = query._calls;\n  for (_i = 0, _len = _ref1.length; _i < _len; _i++) {\n    _ref2 = _ref1[_i], method = _ref2[0], args = _ref2[1];\n    this[method].apply(this, args);\n  }\n};\n\nLiveQuery.prototype = {\n  from: function(namespace) {\n    this.namespace = namespace;\n    this._predicates.push(function(doc, channel) {\n      var docNs;\n      docNs = channel.slice(0, channel.indexOf('.'));\n      return namespace === docNs;\n    });\n    return this;\n  },\n  testWithoutPaging: function(doc, channel) {\n    this.testWithoutPaging = compileDocFilter(this._predicates);\n    return this.testWithoutPaging(doc, channel);\n  },\n  test: function(doc, channel) {\n    return this.testWithoutPaging(doc, channel);\n  },\n  byKey: function(keyVal) {\n    this._predicates.push(function(doc, channel) {\n      var id, ns, _ref1;\n      _ref1 = channel.split('.'), ns = _ref1[0], id = _ref1[1];\n      return id === keyVal;\n    });\n    return this;\n  },\n  where: function(_currProp) {\n    this._currProp = _currProp;\n    return this;\n  },\n  equals: function(val) {\n    var currProp;\n    currProp = this._currProp;\n    this._predicates.push(function(doc) {\n      var currVal;\n      currVal = lookup(currProp, doc);\n      if (typeof currVal === 'object') {\n        return deepEqual(currVal, val);\n      }\n      return currVal === val;\n    });\n    return this;\n  },\n  notEquals: function(val) {\n    var currProp;\n    currProp = this._currProp;\n    this._predicates.push(function(doc) {\n      return lookup(currProp, doc) !== val;\n    });\n    return this;\n  },\n  gt: function(val) {\n    var currProp;\n    currProp = this._currProp;\n    this._predicates.push(function(doc) {\n      return lookup(currProp, doc) > val;\n    });\n    return this;\n  },\n  gte: function(val) {\n    var currProp;\n    currProp = this._currProp;\n    this._predicates.push(function(doc) {\n      return lookup(currProp, doc) >= val;\n    });\n    return this;\n  },\n  lt: function(val) {\n    var currProp;\n    currProp = this._currProp;\n    this._predicates.push(function(doc) {\n      return lookup(currProp, doc) < val;\n    });\n    return this;\n  },\n  lte: function(val) {\n    var currProp;\n    currProp = this._currProp;\n    this._predicates.push(function(doc) {\n      return lookup(currProp, doc) <= val;\n    });\n    return this;\n  },\n  within: function(list) {\n    var currProp;\n    currProp = this._currProp;\n    this._predicates.push(function(doc) {\n      return -1 !== list.indexOf(lookup(currProp, doc));\n    });\n    return this;\n  },\n  contains: function(list) {\n    var currProp;\n    currProp = this._currProp;\n    this._predicates.push(function(doc) {\n      var docList, x, _i, _len;\n      docList = lookup(currProp, doc);\n      if (docList === void 0) {\n        if (list.length) {\n          return false;\n        }\n        return true;\n      }\n      for (_i = 0, _len = list.length; _i < _len; _i++) {\n        x = list[_i];\n        if (x.constructor === Object) {\n          if (-1 === deepIndexOf(docList, x)) {\n            return false;\n          }\n        } else {\n          if (-1 === docList.indexOf(x)) {\n            return false;\n          }\n        }\n      }\n      return true;\n    });\n    return this;\n  },\n  only: function() {\n    var path, paths, _i, _len;\n    paths = 1 <= arguments.length ? __slice.call(arguments, 0) : [];\n    if (this._except) {\n      throw new Error(\"You cannot specify both query(...).except(...) and query(...).only(...)\");\n    }\n    this._only || (this._only = {});\n    for (_i = 0, _len = paths.length; _i < _len; _i++) {\n      path = paths[_i];\n      this._only[path] = 1;\n    }\n    return this;\n  },\n  except: function() {\n    var path, paths, _i, _len;\n    paths = 1 <= arguments.length ? __slice.call(arguments, 0) : [];\n    if (this._only) {\n      throw new Error(\"You cannot specify both query(...).except(...) and query(...).only(...)\");\n    }\n    this._except || (this._except = {});\n    for (_i = 0, _len = paths.length; _i < _len; _i++) {\n      path = paths[_i];\n      this._except[path] = 1;\n    }\n    return this;\n  },\n  limit: function(_limit) {\n    this._limit = _limit;\n    this.isPaginated = true;\n    this._paginatedCache || (this._paginatedCache = []);\n    return this;\n  },\n  skip: function(skip) {\n    this.isPaginated = true;\n    this._paginatedCache || (this._paginatedCache = []);\n    return this;\n  },\n  sort: function() {\n    var params;\n    params = 1 <= arguments.length ? __slice.call(arguments, 0) : [];\n    if (this._sort && this._sort.length) {\n      this._sort = this._sort.concat(params);\n    } else {\n      this._sort = params;\n    }\n    this._comparator = compileSortComparator(this._sort);\n    return this;\n  },\n  beforeOrAfter: function(doc) {\n    var comparator;\n    comparator = this._comparator;\n    if (-1 === comparator(doc, this._paginatedCache[0])) {\n      return 'before';\n    }\n    if (1 === comparator(doc, this._paginatedCache[this._paginatedCache.length - 1])) {\n      return 'after';\n    }\n    return 'curr';\n  },\n  updateCache: function(store, callback) {\n    var cache,\n      _this = this;\n    cache = this._paginatedCache;\n    return store.query(this.query, function(err, found, ver) {\n      var added, removed, x, _i, _j, _len, _len1;\n      if (err) {\n        return callback(err);\n      }\n      removed = [];\n      added = [];\n      for (_i = 0, _len = cache.length; _i < _len; _i++) {\n        x = cache[_i];\n        if (-1 === indexOf(found, x, function(y, z) {\n          return y.id === z.id;\n        })) {\n          removed.push(x);\n        }\n      }\n      for (_j = 0, _len1 = found.length; _j < _len1; _j++) {\n        x = found[_j];\n        if (-1 === indexOf(cache, x, function(y, z) {\n          return y.id === z.id;\n        })) {\n          added.push(x);\n        }\n      }\n      _this._paginatedCache = found;\n      return callback(null, added, removed, ver);\n    });\n  },\n  isCacheImpactedByTxn: function(txn) {\n    var cache, id, ns, x, _i, _len, _ref1;\n    _ref1 = transaction.getPath(txn).split('.'), ns = _ref1[0], id = _ref1[1];\n    if (ns !== this.namespace) {\n      return false;\n    }\n    cache = this._paginatedCache;\n    for (_i = 0, _len = cache.length; _i < _len; _i++) {\n      x = cache[_i];\n      if (x.id === id) {\n        return true;\n      }\n    }\n    return false;\n  }\n};\n\nevalToTrue = function() {\n  return true;\n};\n\ncompileDocFilter = function(predicates) {\n  switch (predicates.length) {\n    case 0:\n      return evalToTrue;\n    case 1:\n      return predicates[0];\n  }\n  return function(doc, channel) {\n    var pred, _i, _len;\n    if (doc === void 0) {\n      return false;\n    }\n    for (_i = 0, _len = predicates.length; _i < _len; _i++) {\n      pred = predicates[_i];\n      if (!pred(doc, channel)) {\n        return false;\n      }\n    }\n    return true;\n  };\n};\n\ncompileSortComparator = function(sortParams) {\n  return function(a, b) {\n    var aVal, bVal, factor, i, path, _i, _len, _step;\n    for (i = _i = 0, _len = sortParams.length, _step = 2; _i < _len; i = _i += _step) {\n      path = sortParams[i];\n      factor = (function() {\n        switch (sortParams[i + 1]) {\n          case 'asc':\n            return 1;\n          case 'desc':\n            return -1;\n          default:\n            throw new Error('Must be \"asc\" or \"desc\"');\n        }\n      })();\n      aVal = lookup(path, a);\n      bVal = lookup(path, b);\n      if (aVal < bVal) {\n        return -1 * factor;\n      } else if (aVal > bVal) {\n        return factor;\n      }\n    }\n    return 0;\n  };\n};\n\n//@ sourceURL=/node_modules/racer/lib/pubSub/LiveQuery.js"
));

require.define("/node_modules/racer/lib/pubSub/Query.js", Function(
    [ 'require', 'module', 'exports', '__dirname', '__filename' ],
    "// Generated by CoffeeScript 1.3.1\nvar ABBREVS, Query, callsComparator, method, _fn, _i, _len, _ref,\n  __slice = [].slice;\n\nABBREVS = {\n  equals: '$eq',\n  notEquals: '$ne',\n  gt: '$gt',\n  gte: '$gte',\n  lt: '$lt',\n  lte: '$lte',\n  within: '$w',\n  contains: '$c'\n};\n\nQuery = module.exports = function(namespace) {\n  this._calls = [];\n  this._json = {};\n  if (namespace) {\n    this.from(namespace);\n  }\n};\n\nQuery.prototype = {\n  isQuery: true,\n  toJSON: function() {\n    return this._calls;\n  },\n  hash: function() {\n    var arg, args, byKeyHash, calls, group, groups, hash, i, limitHash, method, path, pathCalls, selectHash, sep, skipHash, sortHash, _i, _j, _k, _l, _len, _len1, _len2, _len3, _len4, _len5, _m, _n, _ref, _ref1, _step;\n    sep = ':';\n    groups = [];\n    calls = this._calls;\n    for (_i = 0, _len = calls.length; _i < _len; _i++) {\n      _ref = calls[_i], method = _ref[0], args = _ref[1];\n      switch (method) {\n        case 'from':\n          continue;\n        case 'byKey':\n          byKeyHash = '$k' + sep + JSON.stringify(args[0]);\n          break;\n        case 'where':\n          group = {\n            path: args[0]\n          };\n          pathCalls = group.calls = [];\n          groups.push(group);\n          break;\n        case 'equals':\n        case 'notEquals':\n        case 'gt':\n        case 'gte':\n        case 'lt':\n        case 'lte':\n          pathCalls.push([ABBREVS[method], JSON.stringify(args)]);\n          break;\n        case 'within':\n        case 'contains':\n          args[0].sort();\n          pathCalls.push([ABBREVS[method], args]);\n          break;\n        case 'only':\n        case 'except':\n          selectHash = method === 'only' ? '$o' : '$e';\n          for (_j = 0, _len1 = args.length; _j < _len1; _j++) {\n            path = args[_j];\n            selectHash += sep + path;\n          }\n          break;\n        case 'sort':\n          sortHash = '$s' + sep;\n          for (i = _k = 0, _len2 = args.length, _step = 2; _k < _len2; i = _k += _step) {\n            path = args[i];\n            sortHash += path + sep;\n            sortHash += (function() {\n              switch (args[i + 1]) {\n                case 'asc':\n                  return '^';\n                case 'desc':\n                  return 'v';\n              }\n            })();\n          }\n          break;\n        case 'skip':\n          skipHash = '$sk' + sep + args[0];\n          break;\n        case 'limit':\n          limitHash = '$L' + sep + args[0];\n      }\n    }\n    hash = this.namespace;\n    if (byKeyHash) {\n      hash += sep + byKeyHash;\n    }\n    if (sortHash) {\n      hash += sep + sortHash;\n    }\n    if (selectHash) {\n      hash += sep + selectHash;\n    }\n    if (skipHash) {\n      hash += sep + skipHash;\n    }\n    if (limitHash) {\n      hash += sep + limitHash;\n    }\n    groups = groups.map(function(group) {\n      group.calls = group.calls.sort(callsComparator);\n      return group;\n    });\n    groups.sort(function(groupA, groupB) {\n      var pathA, pathB;\n      pathA = groupA.path;\n      pathB = groupB.path;\n      if (pathA < pathB) {\n        return -1;\n      }\n      if (pathA === pathB) {\n        return 0;\n      }\n      return 1;\n    });\n    for (_l = 0, _len3 = groups.length; _l < _len3; _l++) {\n      group = groups[_l];\n      hash += sep + sep + group.path;\n      calls = group.calls;\n      for (_m = 0, _len4 = calls.length; _m < _len4; _m++) {\n        _ref1 = calls[_m], method = _ref1[0], args = _ref1[1];\n        hash += sep + method;\n        for (_n = 0, _len5 = args.length; _n < _len5; _n++) {\n          arg = args[_n];\n          hash += sep + JSON.stringify(arg);\n        }\n      }\n    }\n    return hash;\n  },\n  from: function(namespace) {\n    this.namespace = namespace;\n    this._calls.push(['from', [this.namespace]]);\n    return this;\n  },\n  skip: function() {\n    var args;\n    args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];\n    this.isPaginated = true;\n    this._calls.push(['skip', args]);\n    return this;\n  },\n  limit: function() {\n    var args;\n    args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];\n    this.isPaginated = true;\n    this._calls.push(['limit', args]);\n    return this;\n  }\n};\n\n_ref = ['byKey', 'where', 'equals', 'notEquals', 'gt', 'gte', 'lt', 'lte', 'within', 'contains', 'only', 'except', 'sort'];\n_fn = function(method) {\n  return Query.prototype[method] = function() {\n    var args;\n    args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];\n    this._calls.push([method, args]);\n    return this;\n  };\n};\nfor (_i = 0, _len = _ref.length; _i < _len; _i++) {\n  method = _ref[_i];\n  _fn(method);\n}\n\nQuery.deserialize = function(calls) {\n  var args, query, _j, _len1, _ref1;\n  query = new Query;\n  for (_j = 0, _len1 = calls.length; _j < _len1; _j++) {\n    _ref1 = calls[_j], method = _ref1[0], args = _ref1[1];\n    query[method].apply(query, args);\n  }\n  return query;\n};\n\ncallsComparator = function(_arg, _arg1) {\n  var methodA, methodB;\n  methodA = _arg[0];\n  methodB = _arg1[0];\n  if (methodA < methodB) {\n    return -1;\n  }\n  if (methodA === methodB) {\n    return 0;\n  }\n  return 1;\n};\n\n//@ sourceURL=/node_modules/racer/lib/pubSub/Query.js"
));

require.define("/node_modules/racer/lib/txns/index.js", Function(
    [ 'require', 'module', 'exports', '__dirname', '__filename' ],
    "// Generated by CoffeeScript 1.3.1\nvar exports, mixinModel, mixinStore;\n\nmixinModel = require('./txns.Model');\n\nmixinStore = __dirname + '/txns.Store';\n\nexports = module.exports = function(racer) {\n  return racer.mixin(mixinModel, mixinStore);\n};\n\nexports.useWith = {\n  server: true,\n  browser: true\n};\n\n//@ sourceURL=/node_modules/racer/lib/txns/index.js"
));

require.define("/node_modules/racer/lib/txns/txns.Model.js", Function(
    [ 'require', 'module', 'exports', '__dirname', '__filename' ],
    "// Generated by CoffeeScript 1.3.1\nvar Memory, Promise, RESEND_INTERVAL, SEND_TIMEOUT, Serializer, arrayMutator, isPrivate, mergeTxn, specCreate, transaction,\n  __slice = [].slice;\n\nMemory = require('../Memory');\n\nPromise = require('../util/Promise');\n\nSerializer = require('../Serializer');\n\ntransaction = require('../transaction');\n\nisPrivate = require('../path').isPrivate;\n\nspecCreate = require('../util/speculative').create;\n\nmergeTxn = require('./diff').mergeTxn;\n\narrayMutator = null;\n\nmodule.exports = {\n  type: 'Model',\n  \"static\": {\n    SEND_TIMEOUT: SEND_TIMEOUT = 10000,\n    RESEND_INTERVAL: RESEND_INTERVAL = 2000\n  },\n  events: {\n    mixin: function(Model) {\n      return arrayMutator = Model.arrayMutator, Model;\n    },\n    init: function(model) {\n      var after, before, bundlePromises, memory, specCache, txnQueue, txns;\n      if (bundlePromises = model._bundlePromises) {\n        bundlePromises.push(model._txnsPromise = new Promise);\n      }\n      model._specCache = specCache = {\n        invalidate: function() {\n          delete this.data;\n          return delete this.lastTxnId;\n        }\n      };\n      model._count.txn = 0;\n      model._txns = txns = {};\n      model._txnQueue = txnQueue = [];\n      model._removeTxn = function(txnId) {\n        var i;\n        delete txns[txnId];\n        if (~(i = txnQueue.indexOf(txnId))) {\n          txnQueue.splice(i, 1);\n          specCache.invalidate();\n        }\n      };\n      memory = model._memory;\n      before = new Memory;\n      after = new Memory;\n      return model._onTxn = function(txn) {\n        var isLocal, txnQ, ver;\n        if (txn == null) {\n          return;\n        }\n        if (txnQ = txns[transaction.getId(txn)]) {\n          txn.callback = txnQ.callback;\n          txn.emitted = txnQ.emitted;\n        }\n        isLocal = 'callback' in txn;\n        ver = transaction.getVer(txn);\n        if (ver > memory.version || ver === -1) {\n          model._applyTxn(txn, isLocal);\n        }\n      };\n    },\n    bundle: function(model) {\n      model._txnsPromise.on(function(err) {\n        var clientId, store;\n        if (err) {\n          throw err;\n        }\n        store = model.store;\n        clientId = model._clientId;\n        store._unregisterLocalModel(clientId);\n        return store._startTxnBuffer(clientId);\n      });\n      model._specModel();\n      if (model._txnQueue.length) {\n        model.__removeTxn__ || (model.__removeTxn__ = model._removeTxn);\n        model._removeTxn = function(txnId) {\n          var len;\n          model.__removeTxn__(txnId);\n          len = model._txnQueue.length;\n          model._specModel();\n          if (len) {\n            return;\n          }\n          return process.nextTick(function() {\n            return model._txnsPromise.resolve();\n          });\n        };\n        return;\n      }\n      return model._txnsPromise.resolve();\n    },\n    socket: function(model, socket) {\n      var addRemoteTxn, commit, memory, onTxn, removeTxn, resend, resendInterval, setupResendInterval, teardownResendInterval, txnApplier, txnQueue, txns;\n      memory = model._memory, txns = model._txns, txnQueue = model._txnQueue, removeTxn = model._removeTxn, onTxn = model._onTxn;\n      socket.on('snapshotUpdate:replace', function(data, num) {\n        var toReplay, txn, txnId, _i, _len;\n        toReplay = (function() {\n          var _i, _len, _results;\n          _results = [];\n          for (_i = 0, _len = txnQueue.length; _i < _len; _i++) {\n            txnId = txnQueue[_i];\n            _results.push(txns[txnId]);\n          }\n          return _results;\n        })();\n        txnQueue.length = 0;\n        model._txns = txns = {};\n        model._specCache.invalidate();\n        txnApplier.clearPending();\n        if (num != null) {\n          txnApplier.setIndex(num + 1);\n        }\n        memory.eraseNonPrivate();\n        model._initData(data);\n        model.emit('reInit');\n        for (_i = 0, _len = toReplay.length; _i < _len; _i++) {\n          txn = toReplay[_i];\n          model[transaction.getMethod(txn)].apply(model, transaction.getArgs(txn));\n        }\n      });\n      socket.on('snapshotUpdate:newTxns', function(newTxns, num) {\n        var id, txn, _i, _j, _len, _len1;\n        for (_i = 0, _len = newTxns.length; _i < _len; _i++) {\n          txn = newTxns[_i];\n          onTxn(txn);\n        }\n        txnApplier.clearPending();\n        if (num != null) {\n          txnApplier.setIndex(num + 1);\n        }\n        for (_j = 0, _len1 = txnQueue.length; _j < _len1; _j++) {\n          id = txnQueue[_j];\n          commit(txns[id]);\n        }\n      });\n      txnApplier = new Serializer({\n        withEach: onTxn,\n        onTimeout: function() {\n          if (!model.connected) {\n            return;\n          }\n          return socket.emit('fetchCurrSnapshot', memory.version + 1, model._startId, model._subs());\n        }\n      });\n      resendInterval = null;\n      resend = function() {\n        var id, now, txn, _i, _len;\n        now = +(new Date);\n        for (_i = 0, _len = txnQueue.length; _i < _len; _i++) {\n          id = txnQueue[_i];\n          txn = txns[id];\n          if (!txn || txn.timeout > now) {\n            return;\n          }\n          commit(txn);\n        }\n      };\n      setupResendInterval = function() {\n        return resendInterval || (resendInterval = setInterval(resend, RESEND_INTERVAL));\n      };\n      teardownResendInterval = function() {\n        if (resendInterval) {\n          clearInterval(resendInterval);\n        }\n        return resendInterval = null;\n      };\n      if (model.connected) {\n        setupResendInterval();\n      } else {\n        model.once('connect', function() {\n          return setupResendInterval();\n        });\n      }\n      socket.on('disconnect', function() {\n        return teardownResendInterval();\n      });\n      model._addRemoteTxn = addRemoteTxn = function(txn, num) {\n        if (num != null) {\n          return txnApplier.add(txn, num);\n        } else {\n          return onTxn(txn);\n        }\n      };\n      socket.on('txn', addRemoteTxn);\n      socket.on('txnOk', function(txnId, ver, num) {\n        var txn;\n        if (!(txn = txns[txnId])) {\n          return;\n        }\n        transaction.setVer(txn, ver);\n        return addRemoteTxn(txn, num);\n      });\n      socket.on('txnErr', function(err, txnId) {\n        var callback, callbackArgs, txn;\n        txn = txns[txnId];\n        if (txn && (callback = txn.callback)) {\n          if (transaction.isCompound(txn)) {\n            callbackArgs = transaction.ops(txn);\n          } else {\n            callbackArgs = transaction.copyArgs(txn);\n          }\n          callbackArgs.unshift(err);\n          callback.apply(null, callbackArgs);\n        }\n        return removeTxn(txnId);\n      });\n      return model._commit = commit = function(txn) {\n        if (txn.isPrivate) {\n          return;\n        }\n        txn.timeout = +(new Date) + SEND_TIMEOUT;\n        if (!model.connected) {\n          return;\n        }\n        return socket.emit('txn', txn, model._startId);\n      };\n    }\n  },\n  server: {\n    _commit: function(txn) {\n      var _this = this;\n      if (txn.isPrivate) {\n        return;\n      }\n      return this.store._commit(txn, function(err, txn) {\n        if (err) {\n          return _this._removeTxn(transaction.getId(txn));\n        }\n        return _this._onTxn(txn);\n      });\n    }\n  },\n  proto: {\n    force: function() {\n      return Object.create(this, {\n        _force: {\n          value: true\n        }\n      });\n    },\n    _commit: function() {},\n    _asyncCommit: function(txn, callback) {\n      var id;\n      if (!this.connected) {\n        return callback('disconnected');\n      }\n      txn.callback = callback;\n      id = transaction.getId(txn);\n      this._txns[id] = txn;\n      return this._commit(txn);\n    },\n    _nextTxnId: function() {\n      return this._clientId + '.' + this._count.txn++;\n    },\n    _queueTxn: function(txn, callback) {\n      var id;\n      txn.callback = callback;\n      id = transaction.getId(txn);\n      this._txns[id] = txn;\n      return this._txnQueue.push(id);\n    },\n    _getVersion: function() {\n      if (this._force) {\n        return null;\n      } else {\n        return this._memory.version;\n      }\n    },\n    _addOpAsTxn: function(method, args, callback) {\n      var arr, id, out, path, txn, ver;\n      this.emit('beforeTxn', method, args);\n      if ((path = args[0]) == null) {\n        return;\n      }\n      ver = this._getVersion();\n      id = this._nextTxnId();\n      txn = transaction.create({\n        ver: ver,\n        id: id,\n        method: method,\n        args: args\n      });\n      txn.isPrivate = isPrivate(path);\n      txn.emitted = args.cancelEmit;\n      if (method === 'pop') {\n        txn.push((arr = this.get(path) || null) && (arr.length - 1));\n      } else if (method === 'unshift') {\n        txn.push((this.get(path) || null) && 0);\n      }\n      this._queueTxn(txn, callback);\n      out = this._specModel().$out;\n      if (method === 'push') {\n        txn.push(out - args.length + 1);\n      }\n      args = args.slice();\n      if (!txn.emitted) {\n        this.emit(method, args, out, true, this._pass);\n        txn.emitted = true;\n      }\n      this._commit(txn);\n      return out;\n    },\n    _applyTxn: function(txn, isLocal) {\n      var callback, data, doEmit, isCompound, op, ops, out, txnId, ver, _i, _len;\n      if (txnId = transaction.getId(txn)) {\n        this._removeTxn(txnId);\n      }\n      data = this._memory._data;\n      doEmit = !txn.emitted;\n      ver = Math.floor(transaction.getVer(txn));\n      if (isCompound = transaction.isCompound(txn)) {\n        ops = transaction.ops(txn);\n        for (_i = 0, _len = ops.length; _i < _len; _i++) {\n          op = ops[_i];\n          this._applyMutation(transaction.op, op, ver, data, doEmit, isLocal);\n        }\n      } else {\n        out = this._applyMutation(transaction, txn, ver, data, doEmit, isLocal);\n      }\n      if (callback = txn.callback) {\n        if (isCompound) {\n          callback.apply(null, [null].concat(__slice.call(transaction.ops(txn))));\n        } else {\n          callback.apply(null, [null].concat(__slice.call(transaction.getArgs(txn)), [out]));\n        }\n      }\n      return out;\n    },\n    _applyMutation: function(extractor, txn, ver, data, doEmit, isLocal) {\n      var args, method, out, patch, _i, _len, _ref, _ref1;\n      method = extractor.getMethod(txn);\n      if (method === 'get') {\n        return;\n      }\n      args = extractor.getArgs(txn);\n      out = (_ref = this._memory)[method].apply(_ref, __slice.call(args).concat([ver], [data]));\n      if (doEmit) {\n        if (patch = txn.patch) {\n          for (_i = 0, _len = patch.length; _i < _len; _i++) {\n            _ref1 = patch[_i], method = _ref1.method, args = _ref1.args;\n            this.emit(method, args, null, isLocal, this._pass);\n          }\n        } else {\n          this.emit(method, args, out, isLocal, this._pass);\n          txn.emitted = true;\n        }\n      }\n      return out;\n    },\n    _specModel: function() {\n      var cache, data, i, lastTxnId, len, op, ops, out, replayFrom, txn, txnQueue, txns, _i, _len;\n      txns = this._txns;\n      txnQueue = this._txnQueue;\n      while ((txn = txns[txnQueue[0]]) && txn.isPrivate) {\n        out = this._applyTxn(txn, true);\n      }\n      if (!(len = txnQueue.length)) {\n        data = this._memory._data;\n        data.$out = out;\n        return data;\n      }\n      cache = this._specCache;\n      if (lastTxnId = cache.lastTxnId) {\n        if (cache.lastTxnId === txnQueue[len - 1]) {\n          return cache.data;\n        }\n        data = cache.data;\n        replayFrom = 1 + txnQueue.indexOf(cache.lastTxnId);\n      } else {\n        replayFrom = 0;\n      }\n      if (!data) {\n        data = cache.data = specCreate(this._memory._data);\n      }\n      i = replayFrom;\n      while (i < len) {\n        txn = txns[txnQueue[i++]];\n        if (transaction.isCompound(txn)) {\n          ops = transaction.ops(txn);\n          for (_i = 0, _len = ops.length; _i < _len; _i++) {\n            op = ops[_i];\n            this._applyMutation(transaction.op, op, null, data);\n          }\n        } else {\n          out = this._applyMutation(transaction, txn, null, data);\n        }\n      }\n      cache.data = data;\n      cache.lastTxnId = transaction.getId(txn);\n      data.$out = out;\n      return data;\n    }\n  }\n};\n\n//@ sourceURL=/node_modules/racer/lib/txns/txns.Model.js"
));

require.define("/node_modules/racer/lib/Serializer.js", Function(
    [ 'require', 'module', 'exports', '__dirname', '__filename' ],
    "// Generated by CoffeeScript 1.3.1\nvar DEFAULT_EXPIRY, Serializer;\n\nDEFAULT_EXPIRY = 1000;\n\nmodule.exports = Serializer = function(_arg) {\n  var init;\n  this.withEach = _arg.withEach, this.onTimeout = _arg.onTimeout, this.expiry = _arg.expiry, init = _arg.init;\n  if (this.onTimeout) {\n    if (this.expiry == null) {\n      this.expiry = DEFAULT_EXPIRY;\n    }\n  }\n  this._pending = {};\n  this._index = init != null ? init : 1;\n};\n\nSerializer.prototype = {\n  _setWaiter: function() {\n    var _this = this;\n    if (!this.onTimeout || this._waiter) {\n      return;\n    }\n    return this._waiter = setTimeout(function() {\n      _this.onTimeout();\n      return _this._clearWaiter();\n    }, this.expiry);\n  },\n  _clearWaiter: function() {\n    if (!this.onTimeout) {\n      return;\n    }\n    if (this._waiter) {\n      clearTimeout(this._waiter);\n      return delete this._waiter;\n    }\n  },\n  add: function(msg, msgIndex, arg) {\n    var pending;\n    if (msgIndex > this._index) {\n      this._pending[msgIndex] = msg;\n      this._setWaiter();\n      return true;\n    }\n    if (msgIndex < this._index) {\n      return false;\n    }\n    this.withEach(msg, this._index++, arg);\n    this._clearWaiter();\n    pending = this._pending;\n    while (msg = pending[this._index]) {\n      this.withEach(msg, this._index, arg);\n      delete pending[this._index++];\n    }\n    return true;\n  },\n  setIndex: function(_index) {\n    this._index = _index;\n  },\n  clearPending: function() {\n    var i, index, pending, _results;\n    index = this._index;\n    pending = this._pending;\n    _results = [];\n    for (i in pending) {\n      if (i < index) {\n        _results.push(delete pending[i]);\n      } else {\n        _results.push(void 0);\n      }\n    }\n    return _results;\n  }\n};\n\n//@ sourceURL=/node_modules/racer/lib/Serializer.js"
));

require.define("/node_modules/racer/lib/txns/diff.js", Function(
    [ 'require', 'module', 'exports', '__dirname', '__filename' ],
    "// Generated by CoffeeScript 1.3.1\nvar deepCopy, diffArrays, eventRegExp, lookup, transaction, txnEffect, _ref;\n\ndiffArrays = require('../diffMatchPatch').diffArrays;\n\n_ref = require('../path'), eventRegExp = _ref.eventRegExp, lookup = _ref.lookup;\n\ndeepCopy = require('../util').deepCopy;\n\ntransaction = require('../transaction');\n\nmodule.exports = {\n  txnEffect: txnEffect = function(txn, method, args) {\n    var ins, num, rem;\n    switch (method) {\n      case 'push':\n        ins = transaction.getMeta(txn);\n        num = args.length - 1;\n        break;\n      case 'unshift':\n        ins = 0;\n        num = args.length - 1;\n        break;\n      case 'insert':\n        ins = args[1];\n        num = args.length - 2;\n        break;\n      case 'pop':\n        rem = transaction.getMeta(txn);\n        num = 1;\n        break;\n      case 'shift':\n        rem = 0;\n        num = 1;\n        break;\n      case 'remove':\n        rem = args[1];\n        num = args[2];\n        break;\n      case 'move':\n        ins = args[1];\n        rem = args[2];\n        num = 1;\n    }\n    return [ins, rem, num];\n  },\n  mergeTxn: function(txn, txns, txnQueue, arrayMutator, memory, before, after) {\n    var afterData, args, argsQ, arr, arrPath, arraySubPath, beforeData, diff, i, id, ins, isArrayMutator, item, match, method, methodQ, num, op, parent, parentPath, patch, patchConcat, path, pathQ, prop, rem, remainder, resetPaths, root, txnQ, _i, _j, _k, _l, _len, _len1, _len2, _len3, _ref1, _ref2, _results;\n    path = transaction.getPath(txn);\n    method = transaction.getMethod(txn);\n    args = transaction.getArgs(txn);\n    if (isArrayMutator = arrayMutator[method]) {\n      _ref1 = txnEffect(txn, method, args), ins = _ref1[0], rem = _ref1[1], num = _ref1[2];\n      arraySubPath = eventRegExp(\"(\" + path + \".(\\\\d+)).*\");\n    }\n    beforeData = before._data;\n    afterData = after._data;\n    resetPaths = [];\n    patchConcat = [];\n    for (_i = 0, _len = txnQueue.length; _i < _len; _i++) {\n      id = txnQueue[_i];\n      txnQ = txns[id];\n      if (txnQ.callback) {\n        continue;\n      }\n      pathQ = transaction.getPath(txnQ);\n      if (!transaction.pathConflict(path, pathQ)) {\n        continue;\n      }\n      methodQ = transaction.getMethod(txnQ);\n      if (isArrayMutator || arrayMutator[methodQ]) {\n        if (!arrPath) {\n          if (isArrayMutator) {\n            arrPath = path;\n          } else {\n            arraySubPath = eventRegExp(\"(\" + pathQ + \".\\\\d+).*\");\n            if ((match = arraySubPath.exec(path)) && (typeof memory.get(match[1]) === 'object')) {\n              continue;\n            }\n            arrPath = pathQ;\n          }\n          arr = memory.get(arrPath);\n          before.set(arrPath, arr && arr.slice(), 1, beforeData);\n          after.set(arrPath, arr && arr.slice(), 1, afterData);\n          after[method].apply(after, args.concat(1, afterData));\n        }\n        argsQ = deepCopy(transaction.getArgs(txnQ));\n        if (arraySubPath && (match = arraySubPath.exec(pathQ))) {\n          parentPath = match[1];\n          i = +match[2];\n          if (i >= ins) {\n            i += num;\n          }\n          if (i >= rem) {\n            i -= num;\n          }\n          if (typeof before.get(parentPath) === 'object') {\n            resetPaths.push([\"\" + path + \".\" + i, match[3]]);\n            patchConcat.push({\n              method: methodQ,\n              args: argsQ\n            });\n            continue;\n          }\n        }\n        before[methodQ].apply(before, argsQ.concat(1, beforeData));\n        after[methodQ].apply(after, argsQ.concat(1, afterData));\n      } else {\n        txnQ.emitted = false;\n      }\n    }\n    if (arrPath) {\n      txn.patch = patch = [];\n      diff = diffArrays(before.get(arrPath), after.get(arrPath));\n      for (_j = 0, _len1 = diff.length; _j < _len1; _j++) {\n        op = diff[_j];\n        method = op[0];\n        op[0] = arrPath;\n        patch.push({\n          method: method,\n          args: op\n        });\n      }\n      for (_k = 0, _len2 = resetPaths.length; _k < _len2; _k++) {\n        _ref2 = resetPaths[_k], root = _ref2[0], remainder = _ref2[1];\n        i = remainder.indexOf('.');\n        prop = ~i ? remainder.substr(0, i) : remainder;\n        if ((parent = after.get(root)) && (prop in parent)) {\n          patch.push({\n            method: 'set',\n            args: [\"\" + root + \".\" + remainder, lookup(remainder, parent)]\n          });\n        } else {\n          patch.push({\n            method: 'del',\n            args: [\"\" + root + \".\" + prop]\n          });\n        }\n      }\n      _results = [];\n      for (_l = 0, _len3 = patchConcat.length; _l < _len3; _l++) {\n        item = patchConcat[_l];\n        _results.push(patch.push(item));\n      }\n      return _results;\n    }\n  }\n};\n\n//@ sourceURL=/node_modules/racer/lib/txns/diff.js"
));

require.define("/node_modules/racer/lib/racer.browser.js", Function(
    [ 'require', 'module', 'exports', '__dirname', '__filename' ],
    "// Generated by CoffeeScript 1.3.1\nvar exports, isReady, mergeAll, model;\n\nmergeAll = require('./util').mergeAll;\n\nisReady = model = null;\n\nexports = module.exports = function(racer) {\n  return mergeAll(racer, {\n    init: function(_arg, socket) {\n      var clientId, count, ioUri, item, memory, method, onLoad, startId, _i, _len;\n      clientId = _arg[0], memory = _arg[1], count = _arg[2], onLoad = _arg[3], startId = _arg[4], ioUri = _arg[5];\n      model = new racer[\"protected\"].Model;\n      model._clientId = clientId;\n      model._startId = startId;\n      model._memory.init(memory);\n      model._count = count;\n      for (_i = 0, _len = onLoad.length; _i < _len; _i++) {\n        item = onLoad[_i];\n        method = item.shift();\n        model[method].apply(model, item);\n      }\n      racer.emit('init', model);\n      model._setSocket(socket || io.connect(ioUri, {\n        'reconnection delay': 100,\n        'max reconnection attempts': 20,\n        query: 'clientId=' + clientId\n      }));\n      isReady = true;\n      racer.emit('ready', model);\n      return racer;\n    },\n    ready: function(onready) {\n      return function() {\n        if (isReady) {\n          return onready(model);\n        }\n        return racer.on('ready', onready);\n      };\n    }\n  });\n};\n\nexports.useWith = {\n  server: false,\n  browser: true\n};\n\n//@ sourceURL=/node_modules/racer/lib/racer.browser.js"
));

require.define("/node_modules/tracks/package.json", Function(
    [ 'require', 'module', 'exports', '__dirname', '__filename' ],
    "module.exports = {\"main\":\"./lib/index.js\",\"browserify\":{\"main\":\"./lib/browser.js\"}}\n//@ sourceURL=/node_modules/tracks/package.json"
));

require.define("/node_modules/tracks/lib/browser.js", Function(
    [ 'require', 'module', 'exports', '__dirname', '__filename' ],
    "// This is a hack to get browserify to ignore mime, which is included by express\nrequire.modules.mime = function() {}\n\nvar Route = require('express/lib/router/route')\n  , History = require('./History')\n  , router = module.exports = require('./router')\n\nrouter.setup = setup\n\nfunction setup(app, createPage, onRoute) {\n  var routes = {\n        queue: {}\n      , transitional: {}\n      }\n    , page = createPage()\n    , history = page._history = app.history = new History(page)\n  page.redirect = redirect\n  page._routes = routes\n\n  ;['get', 'post', 'put', 'del'].forEach(function(method) {\n    var queue = routes.queue[method] = []\n      , transitional = routes.transitional[method] = []\n\n    app[method] = function(pattern, callback, callback2) {\n      var callbacks = {onRoute: onRoute}\n\n      if (typeof pattern === 'object') {\n        var from = pattern.from\n          , to = pattern.to\n          , forward = pattern.forward || callback.forward || callback\n          , back = pattern.back || callback.back || callback2 || forward\n          , backCallbacks = {onRoute: onRoute, callback: back}\n          , forwardCallbacks = {onRoute: onRoute, callback: forward}\n          , fromRoute = new Route(method, from, backCallbacks)\n          , toRoute = new Route(method, to, forwardCallbacks)\n        transitional.push({\n          from: fromRoute\n        , to: toRoute\n        }, {\n          from: toRoute\n        , to: fromRoute\n        })\n        callbacks.forward = forward\n        callbacks.from = from\n        queue.push(new Route(method, to, callbacks))\n        return app\n      }\n\n      callbacks.callback = callback\n      queue.push(new Route(method, pattern, callbacks))\n      return app\n    }\n  })\n}\n\nfunction redirect(url) {\n  if (url === 'back') return this._history.back()\n  // TODO: Add support for `basepath` option like Express\n  if (url === 'home') url = '\\\\'\n  this._history.replace(url, true)\n}\n\n//@ sourceURL=/node_modules/tracks/lib/browser.js"
));

require.define("/node_modules/express/lib/router/route.js", Function(
    [ 'require', 'module', 'exports', '__dirname', '__filename' ],
    "\n/**\n * Module dependencies.\n */\n\nvar utils = require('../utils');\n\n/**\n * Expose `Route`.\n */\n\nmodule.exports = Route;\n\n/**\n * Initialize `Route` with the given HTTP `method`, `path`,\n * and an array of `callbacks` and `options`.\n *\n * Options:\n *\n *   - `sensitive`    enable case-sensitive routes\n *   - `strict`       enable strict matching for trailing slashes\n *\n * @param {String} method\n * @param {String} path\n * @param {Array} callbacks\n * @param {Object} options.\n * @api private\n */\n\nfunction Route(method, path, callbacks, options) {\n  options = options || {};\n  this.path = path;\n  this.method = method;\n  this.callbacks = callbacks;\n  this.regexp = utils.pathRegexp(path\n    , this.keys = []\n    , options.sensitive\n    , options.strict);\n}\n\n/**\n * Check if this route matches `path`, if so\n * populate `.params`.\n *\n * @param {String} path\n * @return {Boolean}\n * @api private\n */\n\nRoute.prototype.match = function(path){\n  var keys = this.keys\n    , params = this.params = []\n    , m = this.regexp.exec(path);\n\n  if (!m) return false;\n\n  for (var i = 1, len = m.length; i < len; ++i) {\n    var key = keys[i - 1];\n\n    var val = 'string' == typeof m[i]\n      ? decodeURIComponent(m[i])\n      : m[i];\n\n    if (key) {\n      params[key.name] = val;\n    } else {\n      params.push(val);\n    }\n  }\n\n  return true;\n};\n\n//@ sourceURL=/node_modules/express/lib/router/route.js"
));

require.define("/node_modules/express/lib/utils.js", Function(
    [ 'require', 'module', 'exports', '__dirname', '__filename' ],
    "\n/**\n * Module dependencies.\n */\n\nvar mime = require('mime');\n\n/**\n * Make `locals()` bound to the given `obj`.\n *  \n * This is used for `app.locals` and `res.locals`. \n *\n * @param {Object} obj\n * @return {Function}\n * @api private\n */\n\nexports.locals = function(obj){\n  obj.viewCallbacks = obj.viewCallbacks || [];\n\n  function locals(obj){\n    for (var key in obj) locals[key] = obj[key];\n    return obj;\n  };\n\n  locals.use = function(fn){\n    if (3 == fn.length) {\n      obj.viewCallbacks.push(fn);\n    } else {\n      obj.viewCallbacks.push(function(req, res, done){\n        fn(req, res);\n        done();\n      });\n    }\n    return obj;\n  };\n\n  return locals;\n};\n\n/**\n * Check if `path` looks absolute.\n *\n * @param {String} path\n * @return {Boolean}\n * @api private\n */\n\nexports.isAbsolute = function(path){\n  if ('/' == path[0]) return true;\n  if (':' == path[1] && '\\\\' == path[2]) return true;\n};\n\n/**\n * Flatten the given `arr`.\n *\n * @param {Array} arr\n * @return {Array}\n * @api private\n */\n\nexports.flatten = function(arr, ret){\n  var ret = ret || []\n    , len = arr.length;\n  for (var i = 0; i < len; ++i) {\n    if (Array.isArray(arr[i])) {\n      exports.flatten(arr[i], ret);\n    } else {\n      ret.push(arr[i]);\n    }\n  }\n  return ret;\n};\n\n/**\n * Normalize the given `type`, for example \"html\" becomes \"text/html\".\n *\n * @param {String} type\n * @return {String}\n * @api private\n */\n\nexports.normalizeType = function(type){\n  return ~type.indexOf('/') ? type : mime.lookup(type);\n};\n\n/**\n * Normalize `types`, for example \"html\" becomes \"text/html\".\n *\n * @param {Array} types\n * @return {Array}\n * @api private\n */\n\nexports.normalizeTypes = function(types){\n  var ret = [];\n\n  for (var i = 0; i < types.length; ++i) {\n    ret.push(~types[i].indexOf('/')\n      ? types[i]\n      : mime.lookup(types[i]));\n  }\n\n  return ret;\n};\n\n/**\n * Return the acceptable type in `types`, if any.\n *\n * @param {Array} types\n * @param {String} str\n * @return {String}\n * @api private\n */\n\nexports.acceptsArray = function(types, str){\n  // accept anything when Accept is not present\n  if (!str) return types[0];\n\n  // parse\n  var accepted = exports.parseAccept(str)\n    , normalized = exports.normalizeTypes(types)\n    , len = accepted.length;\n\n  for (var i = 0; i < len; ++i) {\n    for (var j = 0, jlen = types.length; j < jlen; ++j) {\n      if (exports.accept(normalized[j].split('/'), accepted[i])) {\n        return types[j];\n      }\n    }\n  }\n};\n\n/**\n * Check if `type(s)` are acceptable based on\n * the given `str`.\n *\n * @param {String|Array} type(s)\n * @param {String} str\n * @return {Boolean|String}\n * @api private\n */\n\nexports.accepts = function(type, str){\n  if ('string' == typeof type) type = type.split(/ *, */);\n  return exports.acceptsArray(type, str);\n};\n\n/**\n * Check if `type` array is acceptable for `other`.\n *\n * @param {Array} type\n * @param {Object} other\n * @return {Boolean}\n * @api private\n */\n\nexports.accept = function(type, other){\n  return (type[0] == other.type || '*' == other.type)\n    && (type[1] == other.subtype || '*' == other.subtype);\n};\n\n/**\n * Parse accept `str`, returning\n * an array objects containing\n * `.type` and `.subtype` along\n * with the values provided by\n * `parseQuality()`.\n *\n * @param {Type} name\n * @return {Type}\n * @api private\n */\n\nexports.parseAccept = function(str){\n  return exports\n    .parseQuality(str)\n    .map(function(obj){\n      var parts = obj.value.split('/');\n      obj.type = parts[0];\n      obj.subtype = parts[1];\n      return obj;\n    });\n};\n\n/**\n * Parse quality `str`, returning an\n * array of objects with `.value` and\n * `.quality`.\n *\n * @param {Type} name\n * @return {Type}\n * @api private\n */\n\nexports.parseQuality = function(str){\n  return str\n    .split(/ *, */)\n    .map(quality)\n    .filter(function(obj){\n      return obj.quality;\n    })\n    .sort(function(a, b){\n      return b.quality - a.quality;\n    });\n};\n\n/**\n * Parse quality `str` returning an\n * object with `.value` and `.quality`.\n *\n * @param {String} str\n * @return {Object}\n * @api private\n */\n\nfunction quality(str) {\n  var parts = str.split(/ *; */)\n    , val = parts[0];\n\n  var q = parts[1]\n    ? parseFloat(parts[1].split(/ *= */)[1])\n    : 1;\n\n  return { value: val, quality: q };\n}\n\n/**\n * Escape special characters in the given string of html.\n *\n * @param  {String} html\n * @return {String}\n * @api private\n */\n\nexports.escape = function(html) {\n  return String(html)\n    .replace(/&/g, '&amp;')\n    .replace(/\"/g, '&quot;')\n    .replace(/</g, '&lt;')\n    .replace(/>/g, '&gt;');\n};\n\n/**\n * Normalize the given path string,\n * returning a regular expression.\n *\n * An empty array should be passed,\n * which will contain the placeholder\n * key names. For example \"/user/:id\" will\n * then contain [\"id\"].\n *\n * @param  {String|RegExp|Array} path\n * @param  {Array} keys\n * @param  {Boolean} sensitive\n * @param  {Boolean} strict\n * @return {RegExp}\n * @api private\n */\n\nexports.pathRegexp = function(path, keys, sensitive, strict) {\n  if (path instanceof RegExp) return path;\n  if (Array.isArray(path)) path = '(' + path.join('|') + ')';\n  path = path\n    .concat(strict ? '' : '/?')\n    .replace(/\\/\\(/g, '(?:/')\n    .replace(/(\\/)?(\\.)?:(\\w+)(?:(\\(.*?\\)))?(\\?)?/g, function(_, slash, format, key, capture, optional){\n      keys.push({ name: key, optional: !! optional });\n      slash = slash || '';\n      return ''\n        + (optional ? '' : slash)\n        + '(?:'\n        + (optional ? slash : '')\n        + (format || '') + (capture || (format && '([^/.]+?)' || '([^/]+?)')) + ')'\n        + (optional || '');\n    })\n    .replace(/([\\/.])/g, '\\\\$1')\n    .replace(/\\*/g, '(.*)');\n  return new RegExp('^' + path + '$', sensitive ? '' : 'i');\n}\n//@ sourceURL=/node_modules/express/lib/utils.js"
));

require.define("/node_modules/tracks/lib/History.js", Function(
    [ 'require', 'module', 'exports', '__dirname', '__filename' ],
    "var qs = require('qs')\n  , url = require('url')\n  , parseUrl = url.parse\n  , resolveUrl = url.resolve\n  , renderRoute = require('./router').render\n  , win = window\n  , winHistory = win.history\n  , winLocation = win.location\n  , doc = win.document\n  , currentPath = winLocation.pathname\n\n// Replace the initial state with the current URL immediately,\n// so that it will be rendered if the state is later popped\nif (winHistory.replaceState) {\n  winHistory.replaceState({\n    $render: true,\n    $method: 'get'\n  }, null, winLocation.href)\n}\n\nmodule.exports = History\n\nfunction History(page) {\n  this.page = page\n  if (winHistory.pushState) {\n    addListeners(this, page)\n  } else {\n    // TODO: Calling push, replace, and refresh should update\n    // window.location when pushState is not supported\n    this.push = this.replace = this.refresh = function() {}\n  }\n}\n\nHistory.prototype = {\n  push: function(url, render, state, e) {\n    this._update('pushState', url, render, state, e)\n  }\n\n, replace: function(url, render, state, e) {\n    this._update('replaceState', url, render, state, e)\n  }\n\n  // Rerender the current url locally\n, refresh: function() {\n    var path = routePath(winLocation.href)\n    renderRoute(this.page, {url: path, method: 'get'})\n  }\n\n, back: function() {\n    winHistory.back()\n  }\n\n, forward: function() {\n    winHistory.forward()\n  }\n\n, go: function(i) {\n    winHistory.go(i)\n  }\n\n, _update: function(historyMethod, relativeUrl, render, state, e) {\n    var url = resolveUrl(winLocation.href, relativeUrl)\n      , path = routePath(url)\n      , options\n\n    // TODO: history.push should set the window.location with external urls\n    if (!path) return\n    if (render == null) render = true\n    if (state == null) state = {}\n\n    // Update the URL\n    options = renderOptions(e, path)\n    state.$render = true\n    state.$method = options.method\n    winHistory[historyMethod](state, null, url)\n    currentPath = winLocation.pathname\n    if (render) renderRoute(this.page, options, e)\n  }\n}\n\n// Get the pathname if it is on the same protocol and domain\nfunction routePath(url) {\n  var match = parseUrl(url)\n  return match &&\n    match.protocol === winLocation.protocol &&\n    match.host === winLocation.host &&\n    match.pathname + (match.search || '')\n}\n\nfunction renderOptions(e, path) {\n  var form, elements, query, name, value, override, method, body\n\n  // If this is a form submission, extract the form data and\n  // append it to the url for a get or params.body for a post\n  if (e && e.type === 'submit') {\n    form = e.target\n    elements = form.elements\n    query = []\n    for (var i = 0, len = elements.length, el; i < len; i++) {\n      el = elements[i]\n      if (name = el.name) {\n        value = el.value\n        query.push(encodeURIComponent(name) + '=' + encodeURIComponent(value))\n        if (name === '_method') {\n          override = value.toLowerCase()\n          if (override === 'delete') {\n            override = 'del'\n          }\n        }\n      }\n    }\n    query = query.join('&')\n    if (form.method.toLowerCase() === 'post') {\n      method = override || 'post'\n      body = qs.parse(query)\n    } else {\n      method = 'get'\n      path += '?' + query\n    }\n  } else {\n    method = 'get'\n  }\n  return {\n    method: method\n  , url: path\n  , previous: winLocation.pathname\n  , body: body\n  , form: form\n  }\n}\n\nfunction addListeners(history, page) {\n  function onClick(e) {\n    // Detect clicks on links\n    // Ignore command click, control click, and non-left click\n    if (e.target.href && !e.metaKey && e.which === 1) {\n      var url = e.target.href\n        , hashIndex = url.indexOf('#')\n      // Ignore hash links to the same page\n      if (~hashIndex && url.slice(0, hashIndex) === winLocation.href.replace(/#.*/, '')) {\n        return\n      }\n      history.push(url, true, null, e)\n    }\n  }\n\n  function onSubmit(e) {\n    var target = e.target\n      , url\n    if (target.tagName.toLowerCase() === 'form') {\n      url = target.action\n      if (!url || target._forceSubmit || target.enctype === 'multipart/form-data') {\n        return\n      }\n      history.push(url, true, null, e)\n    }\n  }\n\n  function onPopState(e) {\n    var previous = currentPath\n      , state = e.state\n      , options\n    currentPath = winLocation.pathname\n\n    options = {\n      previous: previous\n    , url: currentPath\n    }\n\n    if (state) {\n      if (!state.$render) return\n      options.method = state.$method\n      // Note that the post body is only sent on the initial reqest\n      // and it is empty if the state is later popped\n      return renderRoute(page, options)\n    }\n\n    // The state object will be null for states created by jump links.\n    // window.location.hash cannot be used, because it returns nothing\n    // if the url ends in just a hash character\n    var url = winLocation.href\n      , hashIndex = url.indexOf('#')\n      , el, id\n    if (~hashIndex && currentPath !== previous) {\n      options.method = 'get'\n      renderRoute(page, options)\n      id = url.slice(hashIndex + 1)\n      if (el = doc.getElementById(id) || doc.getElementsByName(id)[0]) {\n        el.scrollIntoView()\n      }\n    }\n  }\n\n  doc.addEventListener('click', onClick, false)\n  doc.addEventListener('submit', onSubmit, false)\n  win.addEventListener('popstate', onPopState, false)\n}\n\n//@ sourceURL=/node_modules/tracks/lib/History.js"
));

require.define("/node_modules/qs/package.json", Function(
    [ 'require', 'module', 'exports', '__dirname', '__filename' ],
    "module.exports = {\"main\":\"index\"}\n//@ sourceURL=/node_modules/qs/package.json"
));

require.define("/node_modules/qs/index.js", Function(
    [ 'require', 'module', 'exports', '__dirname', '__filename' ],
    "\nmodule.exports = require('./lib/querystring');\n//@ sourceURL=/node_modules/qs/index.js"
));

require.define("/node_modules/qs/lib/querystring.js", Function(
    [ 'require', 'module', 'exports', '__dirname', '__filename' ],
    "\n/**\n * Object#toString() ref for stringify().\n */\n\nvar toString = Object.prototype.toString;\n\n/**\n * Cache non-integer test regexp.\n */\n\nvar isint = /^[0-9]+$/;\n\nfunction promote(parent, key) {\n  if (parent[key].length == 0) return parent[key] = {};\n  var t = {};\n  for (var i in parent[key]) t[i] = parent[key][i];\n  parent[key] = t;\n  return t;\n}\n\nfunction parse(parts, parent, key, val) {\n  var part = parts.shift();\n  // end\n  if (!part) {\n    if (Array.isArray(parent[key])) {\n      parent[key].push(val);\n    } else if ('object' == typeof parent[key]) {\n      parent[key] = val;\n    } else if ('undefined' == typeof parent[key]) {\n      parent[key] = val;\n    } else {\n      parent[key] = [parent[key], val];\n    }\n    // array\n  } else {\n    var obj = parent[key] = parent[key] || [];\n    if (']' == part) {\n      if (Array.isArray(obj)) {\n        if ('' != val) obj.push(val);\n      } else if ('object' == typeof obj) {\n        obj[Object.keys(obj).length] = val;\n      } else {\n        obj = parent[key] = [parent[key], val];\n      }\n      // prop\n    } else if (~part.indexOf(']')) {\n      part = part.substr(0, part.length - 1);\n      if (!isint.test(part) && Array.isArray(obj)) obj = promote(parent, key);\n      parse(parts, obj, part, val);\n      // key\n    } else {\n      if (!isint.test(part) && Array.isArray(obj)) obj = promote(parent, key);\n      parse(parts, obj, part, val);\n    }\n  }\n}\n\n/**\n * Merge parent key/val pair.\n */\n\nfunction merge(parent, key, val){\n  if (~key.indexOf(']')) {\n    var parts = key.split('[')\n      , len = parts.length\n      , last = len - 1;\n    parse(parts, parent, 'base', val);\n    // optimize\n  } else {\n    if (!isint.test(key) && Array.isArray(parent.base)) {\n      var t = {};\n      for (var k in parent.base) t[k] = parent.base[k];\n      parent.base = t;\n    }\n    set(parent.base, key, val);\n  }\n\n  return parent;\n}\n\n/**\n * Parse the given obj.\n */\n\nfunction parseObject(obj){\n  var ret = { base: {} };\n  Object.keys(obj).forEach(function(name){\n    merge(ret, name, obj[name]);\n  });\n  return ret.base;\n}\n\n/**\n * Parse the given str.\n */\n\nfunction parseString(str){\n  return String(str)\n    .split('&')\n    .reduce(function(ret, pair){\n      try{\n        pair = decodeURIComponent(pair.replace(/\\+/g, ' '));\n      } catch(e) {\n        // ignore\n      }\n\n      var eql = pair.indexOf('=')\n        , brace = lastBraceInKey(pair)\n        , key = pair.substr(0, brace || eql)\n        , val = pair.substr(brace || eql, pair.length)\n        , val = val.substr(val.indexOf('=') + 1, val.length);\n\n      // ?foo\n      if ('' == key) key = pair, val = '';\n\n      return merge(ret, key, val);\n    }, { base: {} }).base;\n}\n\n/**\n * Parse the given query `str` or `obj`, returning an object.\n *\n * @param {String} str | {Object} obj\n * @return {Object}\n * @api public\n */\n\nexports.parse = function(str){\n  if (null == str || '' == str) return {};\n  return 'object' == typeof str\n    ? parseObject(str)\n    : parseString(str);\n};\n\n/**\n * Turn the given `obj` into a query string\n *\n * @param {Object} obj\n * @return {String}\n * @api public\n */\n\nvar stringify = exports.stringify = function(obj, prefix) {\n  if (Array.isArray(obj)) {\n    return stringifyArray(obj, prefix);\n  } else if ('[object Object]' == toString.call(obj)) {\n    return stringifyObject(obj, prefix);\n  } else if ('string' == typeof obj) {\n    return stringifyString(obj, prefix);\n  } else {\n    return prefix + '=' + obj;\n  }\n};\n\n/**\n * Stringify the given `str`.\n *\n * @param {String} str\n * @param {String} prefix\n * @return {String}\n * @api private\n */\n\nfunction stringifyString(str, prefix) {\n  if (!prefix) throw new TypeError('stringify expects an object');\n  return prefix + '=' + encodeURIComponent(str);\n}\n\n/**\n * Stringify the given `arr`.\n *\n * @param {Array} arr\n * @param {String} prefix\n * @return {String}\n * @api private\n */\n\nfunction stringifyArray(arr, prefix) {\n  var ret = [];\n  if (!prefix) throw new TypeError('stringify expects an object');\n  for (var i = 0; i < arr.length; i++) {\n    ret.push(stringify(arr[i], prefix + '['+i+']'));\n  }\n  return ret.join('&');\n}\n\n/**\n * Stringify the given `obj`.\n *\n * @param {Object} obj\n * @param {String} prefix\n * @return {String}\n * @api private\n */\n\nfunction stringifyObject(obj, prefix) {\n  var ret = []\n    , keys = Object.keys(obj)\n    , key;\n\n  for (var i = 0, len = keys.length; i < len; ++i) {\n    key = keys[i];\n    ret.push(stringify(obj[key], prefix\n      ? prefix + '[' + encodeURIComponent(key) + ']'\n      : encodeURIComponent(key)));\n  }\n\n  return ret.join('&');\n}\n\n/**\n * Set `obj`'s `key` to `val` respecting\n * the weird and wonderful syntax of a qs,\n * where \"foo=bar&foo=baz\" becomes an array.\n *\n * @param {Object} obj\n * @param {String} key\n * @param {String} val\n * @api private\n */\n\nfunction set(obj, key, val) {\n  var v = obj[key];\n  if (undefined === v) {\n    obj[key] = val;\n  } else if (Array.isArray(v)) {\n    v.push(val);\n  } else {\n    obj[key] = [v, val];\n  }\n}\n\n/**\n * Locate last brace in `str` within the key.\n *\n * @param {String} str\n * @return {Number}\n * @api private\n */\n\nfunction lastBraceInKey(str) {\n  var len = str.length\n    , brace\n    , c;\n  for (var i = 0; i < len; ++i) {\n    c = str[i];\n    if (']' == c) brace = false;\n    if ('[' == c) brace = true;\n    if ('=' == c && !brace) return i;\n  }\n}\n\n//@ sourceURL=/node_modules/qs/lib/querystring.js"
));

require.define("url", Function(
    [ 'require', 'module', 'exports', '__dirname', '__filename' ],
    "var punycode = { encode : function (s) { return s } };\n\nexports.parse = urlParse;\nexports.resolve = urlResolve;\nexports.resolveObject = urlResolveObject;\nexports.format = urlFormat;\n\nfunction arrayIndexOf(array, subject) {\n    for (var i = 0, j = array.length; i < j; i++) {\n        if(array[i] == subject) return i;\n    }\n    return -1;\n}\n\nvar objectKeys = Object.keys || function objectKeys(object) {\n    if (object !== Object(object)) throw new TypeError('Invalid object');\n    var keys = [];\n    for (var key in object) if (object.hasOwnProperty(key)) keys[keys.length] = key;\n    return keys;\n}\n\n// Reference: RFC 3986, RFC 1808, RFC 2396\n\n// define these here so at least they only have to be\n// compiled once on the first module load.\nvar protocolPattern = /^([a-z0-9.+-]+:)/i,\n    portPattern = /:[0-9]+$/,\n    // RFC 2396: characters reserved for delimiting URLs.\n    delims = ['<', '>', '\"', '`', ' ', '\\r', '\\n', '\\t'],\n    // RFC 2396: characters not allowed for various reasons.\n    unwise = ['{', '}', '|', '\\\\', '^', '~', '[', ']', '`'].concat(delims),\n    // Allowed by RFCs, but cause of XSS attacks.  Always escape these.\n    autoEscape = ['\\''],\n    // Characters that are never ever allowed in a hostname.\n    // Note that any invalid chars are also handled, but these\n    // are the ones that are *expected* to be seen, so we fast-path\n    // them.\n    nonHostChars = ['%', '/', '?', ';', '#']\n      .concat(unwise).concat(autoEscape),\n    nonAuthChars = ['/', '@', '?', '#'].concat(delims),\n    hostnameMaxLen = 255,\n    hostnamePartPattern = /^[a-zA-Z0-9][a-z0-9A-Z_-]{0,62}$/,\n    hostnamePartStart = /^([a-zA-Z0-9][a-z0-9A-Z_-]{0,62})(.*)$/,\n    // protocols that can allow \"unsafe\" and \"unwise\" chars.\n    unsafeProtocol = {\n      'javascript': true,\n      'javascript:': true\n    },\n    // protocols that never have a hostname.\n    hostlessProtocol = {\n      'javascript': true,\n      'javascript:': true\n    },\n    // protocols that always have a path component.\n    pathedProtocol = {\n      'http': true,\n      'https': true,\n      'ftp': true,\n      'gopher': true,\n      'file': true,\n      'http:': true,\n      'ftp:': true,\n      'gopher:': true,\n      'file:': true\n    },\n    // protocols that always contain a // bit.\n    slashedProtocol = {\n      'http': true,\n      'https': true,\n      'ftp': true,\n      'gopher': true,\n      'file': true,\n      'http:': true,\n      'https:': true,\n      'ftp:': true,\n      'gopher:': true,\n      'file:': true\n    },\n    querystring = require('querystring');\n\nfunction urlParse(url, parseQueryString, slashesDenoteHost) {\n  if (url && typeof(url) === 'object' && url.href) return url;\n\n  if (typeof url !== 'string') {\n    throw new TypeError(\"Parameter 'url' must be a string, not \" + typeof url);\n  }\n\n  var out = {},\n      rest = url;\n\n  // cut off any delimiters.\n  // This is to support parse stuff like \"<http://foo.com>\"\n  for (var i = 0, l = rest.length; i < l; i++) {\n    if (arrayIndexOf(delims, rest.charAt(i)) === -1) break;\n  }\n  if (i !== 0) rest = rest.substr(i);\n\n\n  var proto = protocolPattern.exec(rest);\n  if (proto) {\n    proto = proto[0];\n    var lowerProto = proto.toLowerCase();\n    out.protocol = lowerProto;\n    rest = rest.substr(proto.length);\n  }\n\n  // figure out if it's got a host\n  // user@server is *always* interpreted as a hostname, and url\n  // resolution will treat //foo/bar as host=foo,path=bar because that's\n  // how the browser resolves relative URLs.\n  if (slashesDenoteHost || proto || rest.match(/^\\/\\/[^@\\/]+@[^@\\/]+/)) {\n    var slashes = rest.substr(0, 2) === '//';\n    if (slashes && !(proto && hostlessProtocol[proto])) {\n      rest = rest.substr(2);\n      out.slashes = true;\n    }\n  }\n\n  if (!hostlessProtocol[proto] &&\n      (slashes || (proto && !slashedProtocol[proto]))) {\n    // there's a hostname.\n    // the first instance of /, ?, ;, or # ends the host.\n    // don't enforce full RFC correctness, just be unstupid about it.\n\n    // If there is an @ in the hostname, then non-host chars *are* allowed\n    // to the left of the first @ sign, unless some non-auth character\n    // comes *before* the @-sign.\n    // URLs are obnoxious.\n    var atSign = arrayIndexOf(rest, '@');\n    if (atSign !== -1) {\n      // there *may be* an auth\n      var hasAuth = true;\n      for (var i = 0, l = nonAuthChars.length; i < l; i++) {\n        var index = arrayIndexOf(rest, nonAuthChars[i]);\n        if (index !== -1 && index < atSign) {\n          // not a valid auth.  Something like http://foo.com/bar@baz/\n          hasAuth = false;\n          break;\n        }\n      }\n      if (hasAuth) {\n        // pluck off the auth portion.\n        out.auth = rest.substr(0, atSign);\n        rest = rest.substr(atSign + 1);\n      }\n    }\n\n    var firstNonHost = -1;\n    for (var i = 0, l = nonHostChars.length; i < l; i++) {\n      var index = arrayIndexOf(rest, nonHostChars[i]);\n      if (index !== -1 &&\n          (firstNonHost < 0 || index < firstNonHost)) firstNonHost = index;\n    }\n\n    if (firstNonHost !== -1) {\n      out.host = rest.substr(0, firstNonHost);\n      rest = rest.substr(firstNonHost);\n    } else {\n      out.host = rest;\n      rest = '';\n    }\n\n    // pull out port.\n    var p = parseHost(out.host);\n    var keys = objectKeys(p);\n    for (var i = 0, l = keys.length; i < l; i++) {\n      var key = keys[i];\n      out[key] = p[key];\n    }\n\n    // we've indicated that there is a hostname,\n    // so even if it's empty, it has to be present.\n    out.hostname = out.hostname || '';\n\n    // validate a little.\n    if (out.hostname.length > hostnameMaxLen) {\n      out.hostname = '';\n    } else {\n      var hostparts = out.hostname.split(/\\./);\n      for (var i = 0, l = hostparts.length; i < l; i++) {\n        var part = hostparts[i];\n        if (!part) continue;\n        if (!part.match(hostnamePartPattern)) {\n          var newpart = '';\n          for (var j = 0, k = part.length; j < k; j++) {\n            if (part.charCodeAt(j) > 127) {\n              // we replace non-ASCII char with a temporary placeholder\n              // we need this to make sure size of hostname is not\n              // broken by replacing non-ASCII by nothing\n              newpart += 'x';\n            } else {\n              newpart += part[j];\n            }\n          }\n          // we test again with ASCII char only\n          if (!newpart.match(hostnamePartPattern)) {\n            var validParts = hostparts.slice(0, i);\n            var notHost = hostparts.slice(i + 1);\n            var bit = part.match(hostnamePartStart);\n            if (bit) {\n              validParts.push(bit[1]);\n              notHost.unshift(bit[2]);\n            }\n            if (notHost.length) {\n              rest = '/' + notHost.join('.') + rest;\n            }\n            out.hostname = validParts.join('.');\n            break;\n          }\n        }\n      }\n    }\n\n    // hostnames are always lower case.\n    out.hostname = out.hostname.toLowerCase();\n\n    // IDNA Support: Returns a puny coded representation of \"domain\".\n    // It only converts the part of the domain name that\n    // has non ASCII characters. I.e. it dosent matter if\n    // you call it with a domain that already is in ASCII.\n    var domainArray = out.hostname.split('.');\n    var newOut = [];\n    for (var i = 0; i < domainArray.length; ++i) {\n      var s = domainArray[i];\n      newOut.push(s.match(/[^A-Za-z0-9_-]/) ?\n          'xn--' + punycode.encode(s) : s);\n    }\n    out.hostname = newOut.join('.');\n\n    out.host = (out.hostname || '') +\n        ((out.port) ? ':' + out.port : '');\n    out.href += out.host;\n  }\n\n  // now rest is set to the post-host stuff.\n  // chop off any delim chars.\n  if (!unsafeProtocol[lowerProto]) {\n\n    // First, make 100% sure that any \"autoEscape\" chars get\n    // escaped, even if encodeURIComponent doesn't think they\n    // need to be.\n    for (var i = 0, l = autoEscape.length; i < l; i++) {\n      var ae = autoEscape[i];\n      var esc = encodeURIComponent(ae);\n      if (esc === ae) {\n        esc = escape(ae);\n      }\n      rest = rest.split(ae).join(esc);\n    }\n\n    // Now make sure that delims never appear in a url.\n    var chop = rest.length;\n    for (var i = 0, l = delims.length; i < l; i++) {\n      var c = arrayIndexOf(rest, delims[i]);\n      if (c !== -1) {\n        chop = Math.min(c, chop);\n      }\n    }\n    rest = rest.substr(0, chop);\n  }\n\n\n  // chop off from the tail first.\n  var hash = arrayIndexOf(rest, '#');\n  if (hash !== -1) {\n    // got a fragment string.\n    out.hash = rest.substr(hash);\n    rest = rest.slice(0, hash);\n  }\n  var qm = arrayIndexOf(rest, '?');\n  if (qm !== -1) {\n    out.search = rest.substr(qm);\n    out.query = rest.substr(qm + 1);\n    if (parseQueryString) {\n      out.query = querystring.parse(out.query);\n    }\n    rest = rest.slice(0, qm);\n  } else if (parseQueryString) {\n    // no query string, but parseQueryString still requested\n    out.search = '';\n    out.query = {};\n  }\n  if (rest) out.pathname = rest;\n  if (slashedProtocol[proto] &&\n      out.hostname && !out.pathname) {\n    out.pathname = '/';\n  }\n\n  //to support http.request\n  if (out.pathname || out.search) {\n    out.path = (out.pathname ? out.pathname : '') +\n               (out.search ? out.search : '');\n  }\n\n  // finally, reconstruct the href based on what has been validated.\n  out.href = urlFormat(out);\n  return out;\n}\n\n// format a parsed object into a url string\nfunction urlFormat(obj) {\n  // ensure it's an object, and not a string url.\n  // If it's an obj, this is a no-op.\n  // this way, you can call url_format() on strings\n  // to clean up potentially wonky urls.\n  if (typeof(obj) === 'string') obj = urlParse(obj);\n\n  var auth = obj.auth || '';\n  if (auth) {\n    auth = auth.split('@').join('%40');\n    for (var i = 0, l = nonAuthChars.length; i < l; i++) {\n      var nAC = nonAuthChars[i];\n      auth = auth.split(nAC).join(encodeURIComponent(nAC));\n    }\n    auth += '@';\n  }\n\n  var protocol = obj.protocol || '',\n      host = (obj.host !== undefined) ? auth + obj.host :\n          obj.hostname !== undefined ? (\n              auth + obj.hostname +\n              (obj.port ? ':' + obj.port : '')\n          ) :\n          false,\n      pathname = obj.pathname || '',\n      query = obj.query &&\n              ((typeof obj.query === 'object' &&\n                objectKeys(obj.query).length) ?\n                 querystring.stringify(obj.query) :\n                 '') || '',\n      search = obj.search || (query && ('?' + query)) || '',\n      hash = obj.hash || '';\n\n  if (protocol && protocol.substr(-1) !== ':') protocol += ':';\n\n  // only the slashedProtocols get the //.  Not mailto:, xmpp:, etc.\n  // unless they had them to begin with.\n  if (obj.slashes ||\n      (!protocol || slashedProtocol[protocol]) && host !== false) {\n    host = '//' + (host || '');\n    if (pathname && pathname.charAt(0) !== '/') pathname = '/' + pathname;\n  } else if (!host) {\n    host = '';\n  }\n\n  if (hash && hash.charAt(0) !== '#') hash = '#' + hash;\n  if (search && search.charAt(0) !== '?') search = '?' + search;\n\n  return protocol + host + pathname + search + hash;\n}\n\nfunction urlResolve(source, relative) {\n  return urlFormat(urlResolveObject(source, relative));\n}\n\nfunction urlResolveObject(source, relative) {\n  if (!source) return relative;\n\n  source = urlParse(urlFormat(source), false, true);\n  relative = urlParse(urlFormat(relative), false, true);\n\n  // hash is always overridden, no matter what.\n  source.hash = relative.hash;\n\n  if (relative.href === '') {\n    source.href = urlFormat(source);\n    return source;\n  }\n\n  // hrefs like //foo/bar always cut to the protocol.\n  if (relative.slashes && !relative.protocol) {\n    relative.protocol = source.protocol;\n    //urlParse appends trailing / to urls like http://www.example.com\n    if (slashedProtocol[relative.protocol] &&\n        relative.hostname && !relative.pathname) {\n      relative.path = relative.pathname = '/';\n    }\n    relative.href = urlFormat(relative);\n    return relative;\n  }\n\n  if (relative.protocol && relative.protocol !== source.protocol) {\n    // if it's a known url protocol, then changing\n    // the protocol does weird things\n    // first, if it's not file:, then we MUST have a host,\n    // and if there was a path\n    // to begin with, then we MUST have a path.\n    // if it is file:, then the host is dropped,\n    // because that's known to be hostless.\n    // anything else is assumed to be absolute.\n    if (!slashedProtocol[relative.protocol]) {\n      relative.href = urlFormat(relative);\n      return relative;\n    }\n    source.protocol = relative.protocol;\n    if (!relative.host && !hostlessProtocol[relative.protocol]) {\n      var relPath = (relative.pathname || '').split('/');\n      while (relPath.length && !(relative.host = relPath.shift()));\n      if (!relative.host) relative.host = '';\n      if (!relative.hostname) relative.hostname = '';\n      if (relPath[0] !== '') relPath.unshift('');\n      if (relPath.length < 2) relPath.unshift('');\n      relative.pathname = relPath.join('/');\n    }\n    source.pathname = relative.pathname;\n    source.search = relative.search;\n    source.query = relative.query;\n    source.host = relative.host || '';\n    source.auth = relative.auth;\n    source.hostname = relative.hostname || relative.host;\n    source.port = relative.port;\n    //to support http.request\n    if (source.pathname !== undefined || source.search !== undefined) {\n      source.path = (source.pathname ? source.pathname : '') +\n                    (source.search ? source.search : '');\n    }\n    source.slashes = source.slashes || relative.slashes;\n    source.href = urlFormat(source);\n    return source;\n  }\n\n  var isSourceAbs = (source.pathname && source.pathname.charAt(0) === '/'),\n      isRelAbs = (\n          relative.host !== undefined ||\n          relative.pathname && relative.pathname.charAt(0) === '/'\n      ),\n      mustEndAbs = (isRelAbs || isSourceAbs ||\n                    (source.host && relative.pathname)),\n      removeAllDots = mustEndAbs,\n      srcPath = source.pathname && source.pathname.split('/') || [],\n      relPath = relative.pathname && relative.pathname.split('/') || [],\n      psychotic = source.protocol &&\n          !slashedProtocol[source.protocol];\n\n  // if the url is a non-slashed url, then relative\n  // links like ../.. should be able\n  // to crawl up to the hostname, as well.  This is strange.\n  // source.protocol has already been set by now.\n  // Later on, put the first path part into the host field.\n  if (psychotic) {\n\n    delete source.hostname;\n    delete source.port;\n    if (source.host) {\n      if (srcPath[0] === '') srcPath[0] = source.host;\n      else srcPath.unshift(source.host);\n    }\n    delete source.host;\n    if (relative.protocol) {\n      delete relative.hostname;\n      delete relative.port;\n      if (relative.host) {\n        if (relPath[0] === '') relPath[0] = relative.host;\n        else relPath.unshift(relative.host);\n      }\n      delete relative.host;\n    }\n    mustEndAbs = mustEndAbs && (relPath[0] === '' || srcPath[0] === '');\n  }\n\n  if (isRelAbs) {\n    // it's absolute.\n    source.host = (relative.host || relative.host === '') ?\n                      relative.host : source.host;\n    source.hostname = (relative.hostname || relative.hostname === '') ?\n                      relative.hostname : source.hostname;\n    source.search = relative.search;\n    source.query = relative.query;\n    srcPath = relPath;\n    // fall through to the dot-handling below.\n  } else if (relPath.length) {\n    // it's relative\n    // throw away the existing file, and take the new path instead.\n    if (!srcPath) srcPath = [];\n    srcPath.pop();\n    srcPath = srcPath.concat(relPath);\n    source.search = relative.search;\n    source.query = relative.query;\n  } else if ('search' in relative) {\n    // just pull out the search.\n    // like href='?foo'.\n    // Put this after the other two cases because it simplifies the booleans\n    if (psychotic) {\n      source.hostname = source.host = srcPath.shift();\n      //occationaly the auth can get stuck only in host\n      //this especialy happens in cases like\n      //url.resolveObject('mailto:local1@domain1', 'local2@domain2')\n      var authInHost = source.host && arrayIndexOf(source.host, '@') > 0 ?\n                       source.host.split('@') : false;\n      if (authInHost) {\n        source.auth = authInHost.shift();\n        source.host = source.hostname = authInHost.shift();\n      }\n    }\n    source.search = relative.search;\n    source.query = relative.query;\n    //to support http.request\n    if (source.pathname !== undefined || source.search !== undefined) {\n      source.path = (source.pathname ? source.pathname : '') +\n                    (source.search ? source.search : '');\n    }\n    source.href = urlFormat(source);\n    return source;\n  }\n  if (!srcPath.length) {\n    // no path at all.  easy.\n    // we've already handled the other stuff above.\n    delete source.pathname;\n    //to support http.request\n    if (!source.search) {\n      source.path = '/' + source.search;\n    } else {\n      delete source.path;\n    }\n    source.href = urlFormat(source);\n    return source;\n  }\n  // if a url ENDs in . or .., then it must get a trailing slash.\n  // however, if it ends in anything else non-slashy,\n  // then it must NOT get a trailing slash.\n  var last = srcPath.slice(-1)[0];\n  var hasTrailingSlash = (\n      (source.host || relative.host) && (last === '.' || last === '..') ||\n      last === '');\n\n  // strip single dots, resolve double dots to parent dir\n  // if the path tries to go above the root, `up` ends up > 0\n  var up = 0;\n  for (var i = srcPath.length; i >= 0; i--) {\n    last = srcPath[i];\n    if (last == '.') {\n      srcPath.splice(i, 1);\n    } else if (last === '..') {\n      srcPath.splice(i, 1);\n      up++;\n    } else if (up) {\n      srcPath.splice(i, 1);\n      up--;\n    }\n  }\n\n  // if the path is allowed to go above the root, restore leading ..s\n  if (!mustEndAbs && !removeAllDots) {\n    for (; up--; up) {\n      srcPath.unshift('..');\n    }\n  }\n\n  if (mustEndAbs && srcPath[0] !== '' &&\n      (!srcPath[0] || srcPath[0].charAt(0) !== '/')) {\n    srcPath.unshift('');\n  }\n\n  if (hasTrailingSlash && (srcPath.join('/').substr(-1) !== '/')) {\n    srcPath.push('');\n  }\n\n  var isAbsolute = srcPath[0] === '' ||\n      (srcPath[0] && srcPath[0].charAt(0) === '/');\n\n  // put the host back\n  if (psychotic) {\n    source.hostname = source.host = isAbsolute ? '' :\n                                    srcPath.length ? srcPath.shift() : '';\n    //occationaly the auth can get stuck only in host\n    //this especialy happens in cases like\n    //url.resolveObject('mailto:local1@domain1', 'local2@domain2')\n    var authInHost = source.host && arrayIndexOf(source.host, '@') > 0 ?\n                     source.host.split('@') : false;\n    if (authInHost) {\n      source.auth = authInHost.shift();\n      source.host = source.hostname = authInHost.shift();\n    }\n  }\n\n  mustEndAbs = mustEndAbs || (source.host && srcPath.length);\n\n  if (mustEndAbs && !isAbsolute) {\n    srcPath.unshift('');\n  }\n\n  source.pathname = srcPath.join('/');\n  //to support request.http\n  if (source.pathname !== undefined || source.search !== undefined) {\n    source.path = (source.pathname ? source.pathname : '') +\n                  (source.search ? source.search : '');\n  }\n  source.auth = relative.auth || source.auth;\n  source.slashes = source.slashes || relative.slashes;\n  source.href = urlFormat(source);\n  return source;\n}\n\nfunction parseHost(host) {\n  var out = {};\n  var port = portPattern.exec(host);\n  if (port) {\n    port = port[0];\n    out.port = port.substr(1);\n    host = host.substr(0, host.length - port.length);\n  }\n  if (host) out.hostname = host;\n  return out;\n}\n\n//@ sourceURL=url"
));

require.define("querystring", Function(
    [ 'require', 'module', 'exports', '__dirname', '__filename' ],
    "var isArray = typeof Array.isArray === 'function'\n    ? Array.isArray\n    : function (xs) {\n        return Object.prototype.toString.call(xs) === '[object Array]'\n    };\n\nvar objectKeys = Object.keys || function objectKeys(object) {\n    if (object !== Object(object)) throw new TypeError('Invalid object');\n    var keys = [];\n    for (var key in object) if (object.hasOwnProperty(key)) keys[keys.length] = key;\n    return keys;\n}\n\n\n/*!\n * querystring\n * Copyright(c) 2010 TJ Holowaychuk <tj@vision-media.ca>\n * MIT Licensed\n */\n\n/**\n * Library version.\n */\n\nexports.version = '0.3.1';\n\n/**\n * Object#toString() ref for stringify().\n */\n\nvar toString = Object.prototype.toString;\n\n/**\n * Cache non-integer test regexp.\n */\n\nvar notint = /[^0-9]/;\n\n/**\n * Parse the given query `str`, returning an object.\n *\n * @param {String} str\n * @return {Object}\n * @api public\n */\n\nexports.parse = function(str){\n  if (null == str || '' == str) return {};\n\n  function promote(parent, key) {\n    if (parent[key].length == 0) return parent[key] = {};\n    var t = {};\n    for (var i in parent[key]) t[i] = parent[key][i];\n    parent[key] = t;\n    return t;\n  }\n\n  return String(str)\n    .split('&')\n    .reduce(function(ret, pair){\n      try{ \n        pair = decodeURIComponent(pair.replace(/\\+/g, ' '));\n      } catch(e) {\n        // ignore\n      }\n\n      var eql = pair.indexOf('=')\n        , brace = lastBraceInKey(pair)\n        , key = pair.substr(0, brace || eql)\n        , val = pair.substr(brace || eql, pair.length)\n        , val = val.substr(val.indexOf('=') + 1, val.length)\n        , parent = ret;\n\n      // ?foo\n      if ('' == key) key = pair, val = '';\n\n      // nested\n      if (~key.indexOf(']')) {\n        var parts = key.split('[')\n          , len = parts.length\n          , last = len - 1;\n\n        function parse(parts, parent, key) {\n          var part = parts.shift();\n\n          // end\n          if (!part) {\n            if (isArray(parent[key])) {\n              parent[key].push(val);\n            } else if ('object' == typeof parent[key]) {\n              parent[key] = val;\n            } else if ('undefined' == typeof parent[key]) {\n              parent[key] = val;\n            } else {\n              parent[key] = [parent[key], val];\n            }\n          // array\n          } else {\n            obj = parent[key] = parent[key] || [];\n            if (']' == part) {\n              if (isArray(obj)) {\n                if ('' != val) obj.push(val);\n              } else if ('object' == typeof obj) {\n                obj[objectKeys(obj).length] = val;\n              } else {\n                obj = parent[key] = [parent[key], val];\n              }\n            // prop\n            } else if (~part.indexOf(']')) {\n              part = part.substr(0, part.length - 1);\n              if(notint.test(part) && isArray(obj)) obj = promote(parent, key);\n              parse(parts, obj, part);\n            // key\n            } else {\n              if(notint.test(part) && isArray(obj)) obj = promote(parent, key);\n              parse(parts, obj, part);\n            }\n          }\n        }\n\n        parse(parts, parent, 'base');\n      // optimize\n      } else {\n        if (notint.test(key) && isArray(parent.base)) {\n          var t = {};\n          for(var k in parent.base) t[k] = parent.base[k];\n          parent.base = t;\n        }\n        set(parent.base, key, val);\n      }\n\n      return ret;\n    }, {base: {}}).base;\n};\n\n/**\n * Turn the given `obj` into a query string\n *\n * @param {Object} obj\n * @return {String}\n * @api public\n */\n\nvar stringify = exports.stringify = function(obj, prefix) {\n  if (isArray(obj)) {\n    return stringifyArray(obj, prefix);\n  } else if ('[object Object]' == toString.call(obj)) {\n    return stringifyObject(obj, prefix);\n  } else if ('string' == typeof obj) {\n    return stringifyString(obj, prefix);\n  } else {\n    return prefix;\n  }\n};\n\n/**\n * Stringify the given `str`.\n *\n * @param {String} str\n * @param {String} prefix\n * @return {String}\n * @api private\n */\n\nfunction stringifyString(str, prefix) {\n  if (!prefix) throw new TypeError('stringify expects an object');\n  return prefix + '=' + encodeURIComponent(str);\n}\n\n/**\n * Stringify the given `arr`.\n *\n * @param {Array} arr\n * @param {String} prefix\n * @return {String}\n * @api private\n */\n\nfunction stringifyArray(arr, prefix) {\n  var ret = [];\n  if (!prefix) throw new TypeError('stringify expects an object');\n  for (var i = 0; i < arr.length; i++) {\n    ret.push(stringify(arr[i], prefix + '[]'));\n  }\n  return ret.join('&');\n}\n\n/**\n * Stringify the given `obj`.\n *\n * @param {Object} obj\n * @param {String} prefix\n * @return {String}\n * @api private\n */\n\nfunction stringifyObject(obj, prefix) {\n  var ret = []\n    , keys = objectKeys(obj)\n    , key;\n  for (var i = 0, len = keys.length; i < len; ++i) {\n    key = keys[i];\n    ret.push(stringify(obj[key], prefix\n      ? prefix + '[' + encodeURIComponent(key) + ']'\n      : encodeURIComponent(key)));\n  }\n  return ret.join('&');\n}\n\n/**\n * Set `obj`'s `key` to `val` respecting\n * the weird and wonderful syntax of a qs,\n * where \"foo=bar&foo=baz\" becomes an array.\n *\n * @param {Object} obj\n * @param {String} key\n * @param {String} val\n * @api private\n */\n\nfunction set(obj, key, val) {\n  var v = obj[key];\n  if (undefined === v) {\n    obj[key] = val;\n  } else if (isArray(v)) {\n    v.push(val);\n  } else {\n    obj[key] = [v, val];\n  }\n}\n\n/**\n * Locate last brace in `str` within the key.\n *\n * @param {String} str\n * @return {Number}\n * @api private\n */\n\nfunction lastBraceInKey(str) {\n  var len = str.length\n    , brace\n    , c;\n  for (var i = 0; i < len; ++i) {\n    c = str[i];\n    if (']' == c) brace = false;\n    if ('[' == c) brace = true;\n    if ('=' == c && !brace) return i;\n  }\n}\n\n//@ sourceURL=querystring"
));

require.define("/node_modules/tracks/lib/router.js", Function(
    [ 'require', 'module', 'exports', '__dirname', '__filename' ],
    "var qs = require('qs')\n  , settings = {}\n\nexports.render = render\nexports._mapRoute = mapRoute\nexports.settings = settings\nexports.set = function(setting, value) {\n  this.settings[setting] = value\n  return this\n}\nexports.get = function(setting) {\n  return settings[setting]\n}\n\nfunction mapRoute(from, params) {\n  var i, path, queryString, url\n  url = params.url\n  queryString = ~(i = url.indexOf('?')) ? url.slice(i) : ''\n  i = 0\n  path = from.replace(/(?:(?:\\:([^?\\/:*]+))|\\*)\\??/g, function(match, key) {\n    if (key) return params[key]\n    return params[i++]\n  })\n  return path + queryString\n}\n\nfunction cancelRender(url, form, e) {\n  // Don't do anything if this is the result of an event, since the\n  // appropriate action will happen by default\n  if (e) return\n  // Otherwise, manually perform appropriate action\n  if (form) {\n    form._forceSubmit = true\n    return form.submit()\n  } else {\n    return window.location = url\n  }\n}\n\nfunction render(page, options, e) {\n  var routes = page._routes\n    , url = options.url.replace(/#.*/, '')\n    , querySplit = url.split('?')\n    , path = querySplit[0]\n    , queryString = querySplit[1]\n    , query = queryString ? qs.parse(queryString) : {}\n    , method = options.method\n    , body = options.body || {}\n    , previous = options.previous\n    , form = options.form\n    , transitional = routes.transitional[method]\n    , queue = routes.queue[method]\n\n  function reroute(url) {\n    var path = url.replace(/\\?.*/, '')\n    renderQueued(previous, path, url, form, null, onMatch, transitional, queue, 0)\n  }\n\n  function onMatch(path, url, i, route, renderNext, isTransitional) {\n    // Stop the default browser action, such as clicking a link or submitting a form\n    if (e) e.preventDefault()\n\n    var routeParams = route.params\n      , params = routeParams.slice()\n      , key\n    for (key in routeParams) {\n      params[key] = routeParams[key]\n    }\n    params.url = url\n    params.body = body\n    params.query = query\n\n    function next(err) {\n      if (err != null) return cancelRender(url, form)\n      renderNext(previous, path, url, form, null, onMatch, transitional, queue, i)\n    }\n\n    if (settings.debug) {\n      return run(route, page, params, next, reroute, isTransitional)\n    }\n    try {\n      run(route, page, params, next, reroute, isTransitional)\n    } catch (err) {\n      cancelRender(url, form)\n    }\n  }\n  return renderTransitional(previous, path, url, form, e, onMatch, transitional, queue, 0)\n}\n\nfunction run(route, page, params, next, reroute, isTransitional) {\n  var callbacks = route.callbacks\n    , onRoute = callbacks.onRoute\n\n  if (callbacks.forward) {\n    var render = page.render\n    page.render = function() {\n      onRoute(callbacks.forward, page, params, next, true)\n      page.render = render\n      render.apply(page, arguments)\n    }\n    return reroute(mapRoute(callbacks.from, params))\n  }\n  onRoute(callbacks.callback, page, params, next, isTransitional)\n}\n\nfunction renderTransitional(previous, path, url, form, e, onMatch, transitional, queue, i) {\n  var item\n  while (item = transitional[i++]) {\n    if (!item.to.match(path)) continue\n    if (!item.from.match(previous)) continue\n    return onMatch(path, url, i, item.to, renderTransitional, true)\n  }\n  return renderQueued(previous, path, url, form, e, onMatch, transitional, queue, 0)\n}\n\nfunction renderQueued(previous, path, url, form, e, onMatch, transitional, queue, i) {\n  var route\n  while (route = queue[i++]) {\n    if (!route.match(path)) continue\n    return onMatch(path, url, i, route, renderQueued)\n  }\n  // Cancel rendering by this app if no routes match\n  return cancelRender(url, form, e)\n}\n\n//@ sourceURL=/node_modules/tracks/lib/router.js"
));

require.define("/node_modules/derby/lib/derby.Model.js", Function(
    [ 'require', 'module', 'exports', '__dirname', '__filename' ],
    "var EventDispatcher = require('./EventDispatcher')\n  , PathMap = require('./PathMap')\n  , Model = require('racer')[\"protected\"].Model\n  , arraySlice = [].slice;\n\nexports.init = init;\n\n// Add support for creating a model alias from a DOM node or jQuery object\nModel.prototype.__at = Model.prototype.at;\nModel.prototype.at = function(node, absolute) {\n  var isNode = node && (node.parentNode || node.jquery && (node = node[0]));\n  if (!isNode) return this.__at(node, absolute);\n\n  updateMarkers();\n\n  var blockPaths = this.__blockPaths\n    , pathMap = this.__pathMap\n    , child, i, id, isArray, last, path, pathId, children, len;\n  while (node) {\n    if (node.$derbyMarkerParent) {\n      node = last;\n      while (node = node.previousSibling) {\n        if (!(id = node.$derbyMarkerId)) continue;\n        pathId = blockPaths[id];\n        if (node.$derbyMarkerEnd || !pathId) break;\n\n        path = pathMap.paths[pathId];\n        if (pathMap.arrays[path] && last) {\n          i = 0;\n          while (node = node.nextSibling) {\n            if (node === last) {\n              path = path + '.' + i;\n              break;\n            }\n            i++;\n          }\n        }\n        return this.__at(path, absolute);\n      }\n      last = last.parentNode;\n      node = last.parentNode;\n      continue;\n    }\n    if ((id = node.id) && (pathId = blockPaths[id])) {\n      path = pathMap.paths[pathId];\n      isArray = pathMap.arrays[path] || Array.isArray(this.get(path));\n      if (isArray && last) {\n        children = node.childNodes;\n        for (i = 0, len = children.length; i < len; i++) {\n          child = children[i];\n          if (child === last) {\n            path = path + '.' + i;\n            break;\n          }\n        }\n      }\n      return this.__at(path, absolute);\n    }\n    last = node;\n    node = node.parentNode;\n  }\n\n  // Just return the model if a path can't be found\n  return this;\n}\n\nfunction updateMarkers() {\n  // NodeFilter.SHOW_COMMENT == 128\n  var commentIterator = document.createTreeWalker(document.body, 128, null, false)\n    , comment, id;\n  while (comment = commentIterator.nextNode()) {\n    if (comment.$derbyChecked) continue;\n    comment.$derbyChecked = true;\n    id = comment.data;\n    if (id.charAt(0) !== '$') continue;\n    if (id.charAt(1) === '$') {\n      comment.$derbyMarkerEnd = true;\n      id = id.slice(1);\n    }\n    comment.$derbyMarkerId = id;\n    comment.parentNode.$derbyMarkerParent = true;\n  }\n}\n\nfunction init(model, dom, view) {\n  var pathMap = model.__pathMap = new PathMap;\n  var events = model.__events = new EventDispatcher({\n    onTrigger: function(pathId, listener, type, local, options, value, index, arg) {\n      var id = listener[0]\n        , el = dom.item(id);\n\n      // Fail and remove the listener if the element can't be found\n      if (!el) return false;\n\n      var method = listener[1]\n        , property = listener[2]\n        , partial = listener.partial\n        , path = pathMap.paths[pathId]\n        , triggerId;\n      if (method === 'propPolite' && local) method = 'prop';\n      if (partial) {\n        triggerId = id;\n        if (method === 'html' && type) {\n          // Handle array updates\n          method = type;\n          if (type === 'append') {\n            path += '.' + (index = model.get(path).length - 1);\n            triggerId = null;\n          } else if (type === 'insert') {\n            path += '.' + index;\n            triggerId = null;\n          } else if (type === 'remove') {\n            partial = null;\n          } else if (type === 'move') {\n            partial = null;\n            property = arg;\n          }\n        }\n      }\n      if (listener.getValue) {\n        value = listener.getValue(model, path);\n      }\n      if (partial) {\n        value = partial(listener.ctx, model, path, triggerId, value, index, listener);\n        if (value == null) return;\n      }\n      dom.update(el, method, options && options.ignore, value, property, index);\n    }\n  });\n\n  // Derby's mutator listeners are added via unshift instead of model.on, because\n  // it needs to handle events in the same order that racer applies mutations.\n  // If there is a listener to an event that applies a mutation, event listeners\n  // later in the listeners queues could receive events in a different order\n\n  model.listeners('set').unshift(function(args, out, local, pass) {\n    var arrayPath, i, index, path, value;\n    model.emit('pre:set', args, out, local, pass);\n    path = args[0], value = args[1];\n\n    // For set operations on array items, also emit a remove and insert in case the\n    // array is bound\n    if (/\\.\\d+$/.test(path)) {\n      i = path.lastIndexOf('.');\n      arrayPath = path.slice(0, i);\n      index = path.slice(i + 1);\n      triggerEach(events, pathMap, arrayPath, 'remove', local, pass, index);\n      triggerEach(events, pathMap, arrayPath, 'insert', local, pass, value, index);\n    }\n    return triggerEach(events, pathMap, path, 'html', local, pass, value);\n  });\n\n  model.listeners('del').unshift(function(args, out, local, pass) {\n    model.emit('pre:del', args, out, local, pass);\n    var path = args[0];\n    return triggerEach(events, pathMap, path, 'html', local, pass);\n  });\n\n  model.listeners('push').unshift(function(args, out, local, pass) {\n    model.emit('pre:push', args, out, local, pass);\n    var path = args[0]\n      , values = arraySlice.call(args, 1);\n    for (var i = 0, len = values.length, value; i < len; i++) {\n      value = values[i];\n      triggerEach(events, pathMap, path, 'append', local, pass, value);\n    }\n  });\n\n  model.listeners('move').unshift(function(args, out, local, pass) {\n    model.emit('pre:move', args, out, local, pass);\n    var path = args[0]\n      , from = args[1]\n      , to = args[2]\n      , howMany = args[3]\n      , len = model.get(path).length;\n    from = refIndex(from);\n    to = refIndex(to);\n    if (from < 0) from += len;\n    if (to < 0) to += len;\n    if (from === to) return;\n    // Update indicies in pathMap\n    pathMap.onMove(path, from, to, howMany);\n    triggerEach(events, pathMap, path, 'move', local, pass, from, howMany, to);\n  });\n\n  model.listeners('unshift').unshift(function(args, out, local, pass) {\n    model.emit('pre:unshift', args, out, local, pass);\n    var path = args[0]\n      , values = arraySlice.call(args, 1);\n    insert(events, pathMap, path, 0, values, local, pass);\n  });\n\n  model.listeners('insert').unshift(function(args, out, local, pass) {\n    model.emit('pre:insert', args, out, local, pass);\n    var path = args[0]\n      , index = args[1]\n      , values = arraySlice.call(args, 2);\n    insert(events, pathMap, path, index, values, local, pass);\n  });\n\n  model.listeners('remove').unshift(function(args, out, local, pass) {\n    model.emit('pre:remove', args, out, local, pass);\n    var path = args[0]\n      , start = args[1]\n      , howMany = args[2];\n    remove(events, pathMap, path, start, howMany, local, pass);\n  });\n\n  model.listeners('pop').unshift(function(args, out, local, pass) {\n    model.emit('pre:pop', args, out, local, pass);\n    var path = args[0];\n    remove(events, pathMap, path, model.get(path).length, 1, local, pass);\n  });\n\n  model.listeners('shift').unshift(function(args, out, local, pass) {\n    model.emit('pre:shift', args, out, local, pass);\n    var path = args[0];\n    remove(events, pathMap, path, 0, 1, local, pass);\n  });\n\n  ['connected', 'canConnect'].forEach(function(event) {\n    model.listeners(event).unshift(function(value) {\n      triggerEach(events, pathMap, event, null, true, null, value);\n    });\n  });\n\n  model.on('reInit', function() {\n    view.history.refresh();\n  });\n\n  return model;\n}\n\nfunction triggerEach(events, pathMap, path, arg0, arg1, arg2, arg3, arg4, arg5) {\n  var id = pathMap.ids[path]\n    , segments = path.split('.')\n    , i, pattern;\n\n  // Trigger an event on the path if it has a pathMap ID\n  if (id) events.trigger(id, arg0, arg1, arg2, arg3, arg4, arg5);\n\n  // Also trigger a pattern event for the path and each of its parent paths\n  // This is used by view helper functions to match updates on a path\n  // or any of its child segments\n  i = segments.length + 1;\n  while (--i) {\n    pattern = segments.slice(0, i).join('.') + '*';\n    if (id = pathMap.ids[pattern]) {\n      events.trigger(id, arg0, arg1, arg2, arg3, arg4, arg5);\n    }\n  }\n}\n\n// Get index if event was from refList id object\nfunction refIndex(obj) {\n  return typeof obj === 'object' ? obj.index : +obj;\n}\n\nfunction insert(events, pathMap, path, start, values, local, pass) {\n  start = refIndex(start);\n  // Update indicies in pathMap\n  pathMap.onInsert(path, start, values.length);\n  for (var i = 0, len = values.length, value; i < len; i++) {\n    value = values[i];\n    triggerEach(events, pathMap, path, 'insert', local, pass, value, start + i);\n  }\n}\n\nfunction remove(events, pathMap, path, start, howMany, local, pass) {\n  start = refIndex(start);\n  var end = start + howMany;\n  // Update indicies in pathMap\n  pathMap.onRemove(path, start, howMany);\n  for (var i = start; i < end; i++) {\n    triggerEach(events, pathMap, path, 'remove', local, pass, start);\n  }\n}\n\n//@ sourceURL=/node_modules/derby/lib/derby.Model.js"
));

require.define("/node_modules/derby/lib/EventDispatcher.js", Function(
    [ 'require', 'module', 'exports', '__dirname', '__filename' ],
    "function empty() {}\n\nmodule.exports = EventDispatcher;\n\nfunction EventDispatcher(options) {\n  if (options == null) options = {};\n  this._onTrigger = options.onTrigger || empty;\n  this._onBind = options.onBind || empty;\n  this.clear();\n}\n\nEventDispatcher.prototype = {\n  clear: function() {\n    this.names = {};\n  }\n\n, bind: function(name, listener, arg0) {\n    this._onBind(name, listener, arg0);\n    var names = this.names\n      , obj = names[name] || {};\n    obj[JSON.stringify(listener)] = listener;\n    return names[name] = obj;\n  }\n\n, trigger: function(name, value, arg0, arg1, arg2, arg3, arg4, arg5) {\n    var names = this.names\n      , listeners = names[name]\n      , onTrigger = this._onTrigger\n      , count = 0\n      , key, listener;\n    for (key in listeners) {\n      listener = listeners[key];\n      count++;\n      if (false !== onTrigger(name, listener, value, arg0, arg1, arg2, arg3, arg4, arg5)) {\n        continue;\n      }\n      delete listeners[key];\n      count--;\n    }\n    if (!count) delete names[name];\n    return count;\n  }\n}\n\n//@ sourceURL=/node_modules/derby/lib/EventDispatcher.js"
));

require.define("/node_modules/derby/lib/PathMap.js", Function(
    [ 'require', 'module', 'exports', '__dirname', '__filename' ],
    "module.exports = PathMap\n\nfunction PathMap() {\n  this.clear();\n}\nPathMap.prototype = {\n  clear: function() {\n    this.count = 0;\n    this.ids = {};\n    this.paths = {};\n    this.arrays = {};\n  }\n\n, id: function(path) {\n    var id;\n    // Return the path for an id, or create a new id and index it\n    return this.ids[path] || (\n      id = ++this.count\n    , this.paths[id] = path\n    , this._indexArray(path, id)\n    , this.ids[path] = id\n    );\n  }\n\n, _indexArray: function(path, id) {\n    var arr, index, match, nested, remainder, set, setArrays;\n    while (match = /^(.+)\\.(\\d+)(\\*?(?:\\..+|$))/.exec(path)) {\n      path = match[1];\n      index = +match[2];\n      remainder = match[3];\n      arr = this.arrays[path] || (this.arrays[path] = []);\n      set = arr[index] || (arr[index] = {});\n      if (nested) {\n        setArrays = set.arrays || (set.arrays = {});\n        setArrays[remainder] = true;\n      } else {\n        set[id] = remainder;\n      }\n      nested = true;\n    }\n  }\n\n, _incrItems: function(path, map, start, end, byNum, oldArrays, oldPath) {\n    var arrayMap, arrayPath, arrayPathTo, i, id, ids, itemPath, remainder;\n    if (oldArrays == null) oldArrays = {};\n\n    for (i = start; i < end; i++) {\n      ids = map[i];\n      if (!ids) continue;\n\n      for (id in ids) {\n        remainder = ids[id];\n        if (id === 'arrays') {\n          for (remainder in ids[id]) {\n            arrayPath = (oldPath || path) + '.' + i + remainder;\n            arrayMap = oldArrays[arrayPath] || this.arrays[arrayPath];\n            if (arrayMap) {\n              arrayPathTo = path + '.' + (i + byNum) + remainder;\n              this.arrays[arrayPathTo] = arrayMap;\n              this._incrItems(arrayPathTo, arrayMap, 0, arrayMap.length, 0, oldArrays, arrayPath);\n            }\n          }\n          continue;\n        }\n\n        itemPath = path + '.' + (i + byNum) + remainder;\n        this.paths[id] = itemPath;\n        this.ids[itemPath] = +id;\n      }\n    }\n  }\n\n, _delItems: function(path, map, start, end, len, oldArrays) {\n    var arrayLen, arrayMap, arrayPath, i, id, ids, itemPath, remainder;\n    if (oldArrays == null) oldArrays = {};\n\n    for (i = start; i < len; i++) {\n      ids = map[i];\n      if (!ids) continue;\n\n      for (id in ids) {\n        if (id === 'arrays') {\n          for (remainder in ids[id]) {\n            arrayPath = path + '.' + i + remainder;\n            if (arrayMap = this.arrays[arrayPath]) {\n              arrayLen = arrayMap.length;\n              this._delItems(arrayPath, arrayMap, 0, arrayLen, arrayLen, oldArrays);\n              oldArrays[arrayPath] = arrayMap;\n              delete this.arrays[arrayPath];\n            }\n          }\n          continue;\n        }\n\n        itemPath = this.paths[id];\n        delete this.ids[itemPath];\n        if (i > end) continue;\n        delete this.paths[id];\n      }\n    }\n\n    return oldArrays;\n  }\n\n, onRemove: function(path, start, howMany) {\n    var map = this.arrays[path]\n      , end, len, oldArrays;\n    if (!map) return;\n    end = start + howMany;\n    len = map.length;\n    // Delete indicies for removed items\n    oldArrays = this._delItems(path, map, start, end + 1, len);\n    // Decrement indicies of later items\n    this._incrItems(path, map, end, len, -howMany, oldArrays);\n    map.splice(start, howMany);\n  }\n\n, onInsert: function(path, start, howMany) {\n    var map = this.arrays[path]\n      , end, len, oldArrays;\n    if (!map) return;\n    end = start + howMany;\n    len = map.length;\n    // Delete indicies for items in inserted positions\n    oldArrays = this._delItems(path, map, start, end + 1, len);\n    // Increment indicies of later items\n    this._incrItems(path, map, start, len, howMany, oldArrays);\n    while (howMany--) {\n      map.splice(start, 0, {});\n    }\n  }\n\n, onMove: function(path, from, to, howMany) {\n    var map = this.arrays[path]\n      , afterFrom, afterTo, items, oldArrays;\n    if (!map) return;\n    afterFrom = from + howMany;\n    afterTo = to + howMany;\n    // Adjust paths for items between from and to\n    if (from > to) {\n      oldArrays = this._delItems(path, map, to, afterFrom, afterFrom);\n      this._incrItems(path, map, to, from, howMany, oldArrays);\n    } else {\n      oldArrays = this._delItems(path, map, from, afterTo, afterTo);\n      this._incrItems(path, map, afterFrom, afterTo, -howMany, oldArrays);\n    }\n    // Adjust paths for the moved item(s)\n    this._incrItems(path, map, from, afterFrom, to - from, oldArrays);\n    // Fix the array index\n    items = map.splice(from, howMany);\n    map.splice.apply(map, [to, 0].concat(items));\n  }\n}\n\n//@ sourceURL=/node_modules/derby/lib/PathMap.js"
));

require.define("/node_modules/derby/lib/Dom.js", Function(
    [ 'require', 'module', 'exports', '__dirname', '__filename' ],
    "var racer = require('racer')\n  , domShim = require('dom-shim')\n  , lookup = require('racer/lib/path').lookup\n  , EventDispatcher = require('./EventDispatcher')\n  , escapeHtml = require('html-util').escapeHtml\n  , merge = racer.util.merge\n  , win = window\n  , doc = document\n  , markers = {}\n  , elements = {\n      $_win: win\n    , $_doc: doc\n    }\n  , addListener, removeListener;\n\nmodule.exports = Dom;\n\nfunction Dom(model, appExports) {\n  var dom = this\n    , fns = this.fns\n\n      // Map dom event name -> true\n    , listenerAdded = {}\n    , captureListenerAdded = {};\n\n\n  // DOM listener capturing allows blur and focus to be delegated\n  // http://www.quirksmode.org/blog/archives/2008/04/delegating_the.html\n\n  var events = this._events = new EventDispatcher({\n    onTrigger: onTrigger\n  , onBind: function(name, listener, eventName) {\n      if (!listenerAdded[eventName]) {\n        addListener(doc, eventName, trigger, true);\n        listenerAdded[eventName] = true;\n      }\n    }\n  });\n\n  var captureEvents = this._captureEvents = new EventDispatcher({\n    onTrigger: function(name, listener, e) {\n      var el = doc.getElementById(id)\n        , id = listener.id;\n      if (el.tagName === 'HTML' || el.contains(e.target)) {\n        onTrigger(name, listener, id, e, el);\n      }\n    }\n  , onBind: function(name, listener) {\n      if (!captureListenerAdded[name]) {\n        addListener(doc, name, captureTrigger, true);\n        captureListenerAdded[name] = true;\n      }\n    }\n  });\n\n  function onTrigger(name, listener, id, e, el, next) {\n    var fn = listener.fn\n      , delay = listener.delay\n      , finish;\n\n    if (fn != null) {\n      finish = fns[fn] || appExports[fn] || lookup(fn, appExports);\n      if (!finish) return;\n\n    } else {\n      // Update the model when the element's value changes\n      finish = function() {\n        var value = dom.getMethods[listener.method](el, listener.property)\n          , setValue = listener.setValue;\n\n        // Allow the listener to override the setting function\n        if (setValue) {\n          setValue(model, value);\n          return;\n        }\n\n        // Remove this listener if its path id is no longer registered\n        var path = model.__pathMap.paths[listener.pathId];\n        if (!path) return false;\n\n        // Set the value if changed\n        if (model.get(path) === value) return;\n        model.pass(e).set(path, value);\n      }\n    }\n\n    if (delay != null) {\n      setTimeout(finish, delay, e, el, next, dom);\n    } else {\n      finish(e, el, next, dom);\n    }\n  }\n\n  function trigger(e, el, noBubble, continued) {\n    if (!el) el = e.target;\n    var prefix = e.type + ':'\n      , id;\n\n    // Next can be called from a listener to continue bubbling\n    function next() {\n      trigger(e, el.parentNode, false, true);\n    }\n    next.firstTrigger = !continued;\n    if (noBubble && (id = el.id)) {\n      return events.trigger(prefix + id, id, e, el, next);\n    }\n    while (true) {\n      while (!(id = el.id)) {\n        if (!(el = el.parentNode)) return;\n      }\n      // Stop bubbling once the event is handled\n      if (events.trigger(prefix + id, id, e, el, next)) return;\n      if (!(el = el.parentNode)) return;\n    }\n  }\n\n  function captureTrigger(e) {\n    captureEvents.trigger(e.type, e);\n  }\n\n  this.trigger = trigger;\n  this.captureTrigger = captureTrigger;\n  this.addListener = addListener;\n  this.removeListener = removeListener;\n}\n\nDom.prototype = {\n  clear: function() {\n    this._events.clear();\n    this._captureEvents.clear();\n    markers = {};\n  }\n\n, bind: function(eventName, id, listener) {\n    if (listener.capture) {\n      listener.id = id;\n      this._captureEvents.bind(eventName, listener);\n    } else {\n      this._events.bind(\"\" + eventName + \":\" + id, listener, eventName);\n    }\n  }\n\n, update: function(el, method, ignore, value, property, index) {\n    // Don't do anything if the element is already up to date\n    if (value === this.getMethods[method](el, property)) return;\n    this.setMethods[method](el, ignore, value, property, index);\n  }\n\n, item: function(id) {\n    return doc.getElementById(id) || elements[id] || getRange(id);\n  }\n\n, getMethods: {\n    attr: getAttr\n  , prop: getProp\n  , propPolite: getProp\n  , html: getHtml\n    // These methods return NaN, because it never equals anything else. Thus,\n    // when compared against the new value, the new value will always be set\n  , append: getNaN\n  , insert: getNaN\n  , remove: getNaN\n  , move: getNaN\n  }\n\n, setMethods: {\n    attr: setAttr\n  , prop: setProp\n  , propPolite: setProp\n  , html: setHtml\n  , append: setAppend\n  , insert: setInsert\n  , remove: setRemove\n  , move: setMove\n  }\n\n, fns: {\n    $forChildren: forChildren\n  , $forName: forName\n  }\n}\n\n\nfunction getAttr(el, attr) {\n  return el.getAttribute(attr);\n}\nfunction getProp(el, prop) {\n  return el[prop];\n}\nfunction getHtml(el) {\n  return el.innerHTML;\n}\nfunction getNaN() {\n  return NaN;\n}\n\nfunction setAttr(el, ignore, value, attr) {\n  if (ignore && el.id === ignore) return;\n  el.setAttribute(attr, value);\n}\nfunction setProp(el, ignore, value, prop) {\n  if (ignore && el.id === ignore) return;\n  el[prop] = value;\n}\nfunction propPolite(el, ignore, value, prop) {\n  if (ignore && el.id === ignore) return;\n  if (el !== doc.activeElement || !doc.hasFocus()) {\n    el[prop] = value;\n  }\n}\nfunction setHtml(obj, ignore, value, escape) {\n  if (escape) value = escapeHtml(value);\n  if (obj.nodeType) {\n    // Element\n    if (ignore && obj.id === ignore) return;\n    obj.innerHTML = value;\n  } else {\n    // Range\n    obj.deleteContents();\n    obj.insertNode(obj.createContextualFragment(value));\n  }\n}\nfunction setAppend(obj, ignore, value, escape) {\n  if (escape) value = escapeHtml(value);\n  if (obj.nodeType) {\n    // Element\n    obj.insertAdjacentHTML('beforeend', value);\n  } else {\n    // Range\n    var el = obj.endContainer\n      , ref = el.childNodes[obj.endOffset];\n    el.insertBefore(obj.createContextualFragment(value), ref);\n  }\n}\nfunction setInsert(obj, ignore, value, escape, index) {\n  if (escape) value = escapeHtml(value);\n  if (obj.nodeType) {\n    // Element\n    if (ref = obj.childNodes[index]) {\n      ref.insertAdjacentHTML('beforebegin', value);\n    } else {\n      obj.insertAdjacentHTML('beforeend', value);\n    }\n  } else {\n    // Range\n    var el = obj.startContainer\n      , ref = el.childNodes[obj.startOffset + index];\n    el.insertBefore(obj.createContextualFragment(value), ref);\n  }\n}\nfunction setRemove(el, ignore, index) {\n  if (!el.nodeType) {\n    // Range\n    index += el.startOffset;\n    el = el.startContainer;\n  }\n  var child = el.childNodes[index];\n  if (child) el.removeChild(child);\n}\nfunction setMove(el, ignore, from, to, howMany) {\n  var child, fragment, nextChild, offset, ref, toEl;\n  if (!el.nodeType) {\n    offset = el.startOffset;\n    from += offset;\n    to += offset;\n    el = el.startContainer;\n  }\n  child = el.childNodes[from];\n\n  // Don't move if the item at the destination is passed as the ignore\n  // option, since this indicates the intended item was already moved\n  // Also don't move if the child to move matches the ignore option\n  if (!child || ignore && (toEl = el.childNodes[to]) &&\n      toEl.id === ignore || child.id === ignore) return;\n\n  ref = el.childNodes[to > from ? to + howMany : to];\n  if (howMany > 1) {\n    fragment = document.createDocumentFragment();\n    while (howMany--) {\n      nextChild = child.nextSibling;\n      fragment.appendChild(child);\n      if (!(child = nextChild)) break;\n    }\n    el.insertBefore(fragment, ref);\n    return;\n  }\n  el.insertBefore(child, ref);\n}\n\nfunction forChildren(e, el, next, dom) {\n  // Prevent infinte emission\n  if (!next.firstTrigger) return;\n\n  // Re-trigger the event on all child elements\n  var children = el.childNodes;\n  for (var i = 0, len = children.length, child; i < len; i++) {\n    child = children[i];\n    if (child.nodeType !== 1) continue;  // Node.ELEMENT_NODE\n    dom.trigger(e, child, true, true);\n    forChildren(e, child, next, dom);\n  }\n}\n\nfunction forName(e, el, next, dom) {\n  // Prevent infinte emission\n  if (!next.firstTrigger) return;\n\n  var name = el.getAttribute('name');\n  if (!name) return;\n\n  // Re-trigger the event on all other elements with\n  // the same 'name' attribute\n  var elements = doc.getElementsByName(name)\n    , len = elements.length;\n  if (!(len > 1)) return;\n  for (var i = 0, element; i < len; i++) {\n    element = elements[i];\n    if (element === el) continue;\n    dom.trigger(e, element, false, true);\n  }\n}\n\nfunction getRange(name) {\n  var start = markers[name]\n    , end = markers['$' + name]\n    , comment, commentIterator, range;\n\n  if (!(start && end)) {\n    // NodeFilter.SHOW_COMMENT == 128\n    commentIterator = doc.createTreeWalker(doc.body, 128, null, false);\n    while (comment = commentIterator.nextNode()) {\n      markers[comment.data] = comment;\n    }\n    start = markers[name];\n    end = markers['$' + name];\n    if (!(start && end)) return;\n  }\n\n  // Comment nodes may continue to exist even if they have been removed from\n  // the page. Thus, make sure they are still somewhere in the page body\n  if (!doc.body.contains(start)) {\n    delete markers[name];\n    delete markers['$' + name];\n    return;\n  }\n  range = doc.createRange();\n  range.setStartAfter(start);\n  range.setEndBefore(end);\n  return range;\n}\n\nif (doc.addEventListener) {\n  addListener = function(el, name, callback, captures) {\n    el.addEventListener(name, callback, captures || false);\n  };\n  removeListener = function(el, name, callback, captures) {\n    el.removeEventListener(name, callback, captures || false);\n  };\n\n} else if (doc.attachEvent) {\n  addListener = function(el, name, callback) {\n    function listener() {\n      if (!event.target) event.target = event.srcElement;\n      callback(event);\n    }\n    callback.$derbyListener = listener;\n    el.attachEvent('on' + name, listener);\n  };\n  removeListener = function(el, name, callback) {\n    el.detachEvent('on' + name, callback.$derbyListener);\n  };\n}\n\n//@ sourceURL=/node_modules/derby/lib/Dom.js"
));

require.define("/node_modules/dom-shim/package.json", Function(
    [ 'require', 'module', 'exports', '__dirname', '__filename' ],
    "module.exports = {\"main\":\"./lib/index.js\"}\n//@ sourceURL=/node_modules/dom-shim/package.json"
));

require.define("/node_modules/dom-shim/lib/index.js", Function(
    [ 'require', 'module', 'exports', '__dirname', '__filename' ],
    "var doc = document\n  , elementProto = HTMLElement.prototype\n  , nodeProto = Node.prototype\n\n// Add support for Node.contains for Firefox < 9\nif (!doc.contains) {\n  nodeProto.contains = function(node) {\n    return !!(this.compareDocumentPosition(node) & 16)\n  }\n}\n\n// Add support for insertAdjacentHTML for Firefox < 8\n// Based on insertAdjacentHTML.js by Eli Grey, http://eligrey.com\nif (!doc.body.insertAdjacentHTML) {\n  elementProto.insertAdjacentHTML = function(position, html) {\n    var position = position.toLowerCase()\n      , ref = this\n      , parent = ref.parentNode\n      , container = doc.createElement(parent.tagName)\n      , firstChild, nextSibling, node\n\n    container.innerHTML = html\n    if (position === 'beforeend') {\n      while (node = container.firstChild) {\n        ref.appendChild(node)\n      }\n    } else if (position === 'beforebegin') {\n      while (node = container.firstChild) {\n        parent.insertBefore(node, ref)\n      }\n    } else if (position === 'afterend') {\n      nextSibling = ref.nextSibling\n      while (node = container.lastChild) {\n        nextSibling = parent.insertBefore(node, nextSibling)\n      }\n    } else if (position === 'afterbegin') {\n      firstChild = ref.firstChild\n      while (node = container.lastChild) {\n        firstChild = ref.insertBefore(node, firstChild)\n      }\n    }\n  }\n}\n\n//@ sourceURL=/node_modules/dom-shim/lib/index.js"
));

require.define("/node_modules/html-util/package.json", Function(
    [ 'require', 'module', 'exports', '__dirname', '__filename' ],
    "module.exports = {\"main\":\"./lib/index.js\"}\n//@ sourceURL=/node_modules/html-util/package.json"
));

require.define("/node_modules/html-util/lib/index.js", Function(
    [ 'require', 'module', 'exports', '__dirname', '__filename' ],
    "var entityCode = require('./entityCode')\n  , parse = require('./parse')\n\nmodule.exports = {\n  parse: parse\n, escapeHtml: escapeHtml\n, escapeAttribute: escapeAttribute\n, unescapeEntities: unescapeEntities\n, isVoid: isVoid\n, conditionalComment: conditionalComment\n, trimLeading: trimLeading\n, trimTag: trimTag\n, minify: minify\n}\n\nfunction escapeHtml(value) {\n  if (value == null) return ''\n\n  return value\n    .toString()\n    .replace(/&(?!\\s)|</g, function(match) {\n      return match === '&' ? '&amp;' : '&lt;'\n    })\n}\n\nfunction escapeAttribute(value) {\n  if (value == null || value === '') return '\"\"'\n\n  value = value\n    .toString()\n    .replace(/&(?!\\s)|\"/g, function(match) {\n      return match === '&' ? '&amp;' : '&quot;'\n    })\n  return /[ =<>']/.test(value) ? '\"' + value + '\"' : value\n}\n\n// Based on:\n// http://code.google.com/p/jslibs/wiki/JavascriptTips#Escape_and_unescape_HTML_entities\nfunction unescapeEntities(html) {\n  return html.replace(/&([^;]+);/g, function(match, entity) {\n    var charCode = entity.charAt(0) === '#'\n          ? entity.charAt(1) === 'x'\n            ? entity.slice(2, 17)\n            : entity.slice(1)\n          : entityCode[entity]\n    return String.fromCharCode(charCode)\n  })\n}\n\nvar voidElement = {\n  area: 1\n, base: 1\n, br: 1\n, col: 1\n, command: 1\n, embed: 1\n, hr: 1\n, img: 1\n, input: 1\n, keygen: 1\n, link: 1\n, meta: 1\n, param: 1\n, source: 1\n, track: 1\n, wbr: 1\n}\nfunction isVoid(name) {\n  return name in voidElement\n}\n\n// Assume any HTML comment that starts with `<!--[` or ends with `]-->`\n// is a conditional comment. This can also be used to keep comments in\n// minified HTML, such as `<!--[ Copyright John Doe, MIT Licensed ]-->`\nfunction conditionalComment(tag) {\n  return /(?:^<!--\\[)|(?:\\]-->$)/.test(tag)\n}\n\n// Remove leading whitespace and newlines from a string. Note that trailing\n// whitespace is not removed in case whitespace is desired between lines\nfunction trimLeading(text) {\n  return text ? text.replace(/\\n\\s*/g, '') : ''\n}\n\n// Within a tag, remove leading whitespace. Keep a linebreak, since this\n// could be the separator between attributes\nfunction trimTag(tag) {\n  return tag.replace(/(?:\\n\\s*)+/g, '\\n')\n}\n\n// Remove linebreaks, leading space, and comments. Maintain a linebreak between\n// HTML tag attributes and maintain conditional comments.\nfunction minify(html) {\n  var minified = ''\n    , minifyContent = true\n\n  parse(html, {\n    start: function(tag, tagName, attrs) {\n      minifyContent = !('x-no-minify' in attrs)\n      minified += trimTag(tag)\n    }\n  , end: function(tag) {\n      minified += trimTag(tag)\n    }\n  , text: function(text) {\n      minified += minifyContent ? trimLeading(text) : text\n    }\n  , comment: function(tag) {\n      if (conditionalComment(tag)) minified += tag\n    }\n  , other: function(tag) {\n      minified += tag\n    }\n  })\n  return minified\n}\n\n//@ sourceURL=/node_modules/html-util/lib/index.js"
));

require.define("/node_modules/html-util/lib/entityCode.js", Function(
    [ 'require', 'module', 'exports', '__dirname', '__filename' ],
    "module.exports = {\n  quot: 0x0022\n, amp: 0x0026\n, apos: 0x0027\n, lpar: 0x0028\n, rpar: 0x0029\n, lt: 0x003C\n, gt: 0x003E\n, nbsp: 0x00A0\n, iexcl: 0x00A1\n, cent: 0x00A2\n, pound: 0x00A3\n, curren: 0x00A4\n, yen: 0x00A5\n, brvbar: 0x00A6\n, sect: 0x00A7\n, uml: 0x00A8\n, copy: 0x00A9\n, ordf: 0x00AA\n, laquo: 0x00AB\n, not: 0x00AC\n, shy: 0x00AD\n, reg: 0x00AE\n, macr: 0x00AF\n, deg: 0x00B0\n, plusmn: 0x00B1\n, sup2: 0x00B2\n, sup3: 0x00B3\n, acute: 0x00B4\n, micro: 0x00B5\n, para: 0x00B6\n, middot: 0x00B7\n, cedil: 0x00B8\n, sup1: 0x00B9\n, ordm: 0x00BA\n, raquo: 0x00BB\n, frac14: 0x00BC\n, frac12: 0x00BD\n, frac34: 0x00BE\n, iquest: 0x00BF\n, Agrave: 0x00C0\n, Aacute: 0x00C1\n, Acirc: 0x00C2\n, Atilde: 0x00C3\n, Auml: 0x00C4\n, Aring: 0x00C5\n, AElig: 0x00C6\n, Ccedil: 0x00C7\n, Egrave: 0x00C8\n, Eacute: 0x00C9\n, Ecirc: 0x00CA\n, Euml: 0x00CB\n, Igrave: 0x00CC\n, Iacute: 0x00CD\n, Icirc: 0x00CE\n, Iuml: 0x00CF\n, ETH: 0x00D0\n, Ntilde: 0x00D1\n, Ograve: 0x00D2\n, Oacute: 0x00D3\n, Ocirc: 0x00D4\n, Otilde: 0x00D5\n, Ouml: 0x00D6\n, times: 0x00D7\n, Oslash: 0x00D8\n, Ugrave: 0x00D9\n, Uacute: 0x00DA\n, Ucirc: 0x00DB\n, Uuml: 0x00DC\n, Yacute: 0x00DD\n, THORN: 0x00DE\n, szlig: 0x00DF\n, agrave: 0x00E0\n, aacute: 0x00E1\n, acirc: 0x00E2\n, atilde: 0x00E3\n, auml: 0x00E4\n, aring: 0x00E5\n, aelig: 0x00E6\n, ccedil: 0x00E7\n, egrave: 0x00E8\n, eacute: 0x00E9\n, ecirc: 0x00EA\n, euml: 0x00EB\n, igrave: 0x00EC\n, iacute: 0x00ED\n, icirc: 0x00EE\n, iuml: 0x00EF\n, eth: 0x00F0\n, ntilde: 0x00F1\n, ograve: 0x00F2\n, oacute: 0x00F3\n, ocirc: 0x00F4\n, otilde: 0x00F5\n, ouml: 0x00F6\n, divide: 0x00F7\n, oslash: 0x00F8\n, ugrave: 0x00F9\n, uacute: 0x00FA\n, ucirc: 0x00FB\n, uuml: 0x00FC\n, yacute: 0x00FD\n, thorn: 0x00FE\n, yuml: 0x00FF\n, OElig: 0x0152\n, oelig: 0x0153\n, Scaron: 0x0160\n, scaron: 0x0161\n, Yuml: 0x0178\n, fnof: 0x0192\n, circ: 0x02C6\n, tilde: 0x02DC\n, Alpha: 0x0391\n, Beta: 0x0392\n, Gamma: 0x0393\n, Delta: 0x0394\n, Epsilon: 0x0395\n, Zeta: 0x0396\n, Eta: 0x0397\n, Theta: 0x0398\n, Iota: 0x0399\n, Kappa: 0x039A\n, Lambda: 0x039B\n, Mu: 0x039C\n, Nu: 0x039D\n, Xi: 0x039E\n, Omicron: 0x039F\n, Pi: 0x03A0\n, Rho: 0x03A1\n, Sigma: 0x03A3\n, Tau: 0x03A4\n, Upsilon: 0x03A5\n, Phi: 0x03A6\n, Chi: 0x03A7\n, Psi: 0x03A8\n, Omega: 0x03A9\n, alpha: 0x03B1\n, beta: 0x03B2\n, gamma: 0x03B3\n, delta: 0x03B4\n, epsilon: 0x03B5\n, zeta: 0x03B6\n, eta: 0x03B7\n, theta: 0x03B8\n, iota: 0x03B9\n, kappa: 0x03BA\n, lambda: 0x03BB\n, mu: 0x03BC\n, nu: 0x03BD\n, xi: 0x03BE\n, omicron: 0x03BF\n, pi: 0x03C0\n, rho: 0x03C1\n, sigmaf: 0x03C2\n, sigma: 0x03C3\n, tau: 0x03C4\n, upsilon: 0x03C5\n, phi: 0x03C6\n, chi: 0x03C7\n, psi: 0x03C8\n, omega: 0x03C9\n, thetasym: 0x03D1\n, upsih: 0x03D2\n, piv: 0x03D6\n, ensp: 0x2002\n, emsp: 0x2003\n, thinsp: 0x2009\n, zwnj: 0x200C\n, zwj: 0x200D\n, lrm: 0x200E\n, rlm: 0x200F\n, ndash: 0x2013\n, mdash: 0x2014\n, lsquo: 0x2018\n, rsquo: 0x2019\n, sbquo: 0x201A\n, ldquo: 0x201C\n, rdquo: 0x201D\n, bdquo: 0x201E\n, dagger: 0x2020\n, Dagger: 0x2021\n, bull: 0x2022\n, hellip: 0x2026\n, permil: 0x2030\n, prime: 0x2032\n, Prime: 0x2033\n, lsaquo: 0x2039\n, rsaquo: 0x203A\n, oline: 0x203E\n, frasl: 0x2044\n, euro: 0x20AC\n, image: 0x2111\n, weierp: 0x2118\n, real: 0x211C\n, trade: 0x2122\n, alefsym: 0x2135\n, larr: 0x2190\n, uarr: 0x2191\n, rarr: 0x2192\n, darr: 0x2193\n, harr: 0x2194\n, crarr: 0x21B5\n, lArr: 0x21D0\n, uArr: 0x21D1\n, rArr: 0x21D2\n, dArr: 0x21D3\n, hArr: 0x21D4\n, forall: 0x2200\n, part: 0x2202\n, exist: 0x2203\n, empty: 0x2205\n, nabla: 0x2207\n, isin: 0x2208\n, notin: 0x2209\n, ni: 0x220B\n, prod: 0x220F\n, sum: 0x2211\n, minus: 0x2212\n, lowast: 0x2217\n, radic: 0x221A\n, prop: 0x221D\n, infin: 0x221E\n, ang: 0x2220\n, and: 0x2227\n, or: 0x2228\n, cap: 0x2229\n, cup: 0x222A\n, int: 0x222B\n, there4: 0x2234\n, sim: 0x223C\n, cong: 0x2245\n, asymp: 0x2248\n, ne: 0x2260\n, equiv: 0x2261\n, le: 0x2264\n, ge: 0x2265\n, sub: 0x2282\n, sup: 0x2283\n, nsub: 0x2284\n, sube: 0x2286\n, supe: 0x2287\n, oplus: 0x2295\n, otimes: 0x2297\n, perp: 0x22A5\n, sdot: 0x22C5\n, lceil: 0x2308\n, rceil: 0x2309\n, lfloor: 0x230A\n, rfloor: 0x230B\n, lang: 0x2329\n, rang: 0x232A\n, loz: 0x25CA\n, spades: 0x2660\n, clubs: 0x2663\n, hearts: 0x2665\n, diams: 0x2666\n}\n\n//@ sourceURL=/node_modules/html-util/lib/entityCode.js"
));

require.define("/node_modules/html-util/lib/parse.js", Function(
    [ 'require', 'module', 'exports', '__dirname', '__filename' ],
    "var startTag = /^<([^\\s=\\/!>]+)((?:\\s+[^\\s=\\/>]+(?:\\s*=\\s*(?:(?:\"[^\"]*\")|(?:'[^']*')|[^>\\s]+)?)?)*)\\s*(\\/?)\\s*>/\n  , endTag = /^<\\/([^\\s=\\/!>]+)[^>]*>/\n  , comment = /^<!--([\\s\\S]*?)-->/\n  , other = /^<([\\s\\S]*?)>/\n  , attr = /([^\\s=]+)(?:\\s*(=)\\s*(?:(?:\"((?:\\\\.|[^\"])*)\")|(?:'((?:\\\\.|[^'])*)')|([^>\\s]+))?)?/g\n  , rawTagsDefault = /^(style|script)$/i\n\nfunction empty() {}\n\nfunction matchEndDefault(tagName) {\n  return new RegExp('</' + tagName, 'i')\n}\n\nfunction onStartTag(html, match, handler) {\n  var attrs = {}\n    , tag = match[0]\n    , tagName = match[1]\n    , remainder = match[2]\n  html = html.slice(tag.length)\n\n  remainder.replace(attr, function(match, name, equals, attr0, attr1, attr2) {\n    attrs[name.toLowerCase()] = attr0 || attr1 || attr2 || (equals ? '' : null)\n  })\n  handler(tag, tagName.toLowerCase(), attrs, html)\n\n  return html\n}\n\nfunction onTag(html, match, handler) {\n  var tag = match[0]\n    , data = match[1]\n  html = html.slice(tag.length)\n\n  handler(tag, data, html)\n\n  return html\n}\n\nfunction onText(html, index, isRawText, handler) {\n  var text\n  if (~index) {\n    text = html.slice(0, index)\n    html = html.slice(index)\n  } else {\n    text = html\n    html = ''\n  }\n\n  if (text) handler(text, isRawText, html)\n\n  return html\n}\n\nmodule.exports = function(html, options) {\n  if (options == null) options = {}\n\n  if (!html) return\n\n  var startHandler = options.start || empty\n    , endHandler = options.end || empty\n    , textHandler = options.text || empty\n    , commentHandler = options.comment || empty\n    , otherHandler = options.other || empty\n    , matchEnd = options.matchEnd || matchEndDefault\n    , errorHandler = options.error\n    , rawTags = options.rawTags || rawTagsDefault\n    , index, last, match, tagName, err\n\n  while (html) {\n    if (html === last) {\n      err = new Error('HTML parse error: ' + html)\n      if (errorHandler) {\n        errorHandler(err)\n      } else {\n        throw err\n      }\n    }\n    last = html\n\n    if (html[0] === '<') {\n      if (match = html.match(startTag)) {\n        html = onStartTag(html, match, startHandler)\n\n        tagName = match[1]\n        if (rawTags.test(tagName)) {\n          index = html.search(matchEnd(tagName))\n          html = onText(html, index, true, textHandler)\n        }\n        continue\n      }\n\n      if (match = html.match(endTag)) {\n        match[1] = match[1].toLowerCase()  // tagName\n        html = onTag(html, match, endHandler)\n        continue\n      }\n\n      if (match = html.match(comment)) {\n        html = onTag(html, match, commentHandler)\n        continue\n      }\n\n      if (match = html.match(other)) {\n        html = onTag(html, match, otherHandler)\n        continue\n      }\n    }\n\n    index = html.indexOf('<')\n    html = onText(html, index, false, textHandler)\n  }\n}\n\n//@ sourceURL=/node_modules/html-util/lib/parse.js"
));

require.define("/node_modules/derby/lib/View.js", Function(
    [ 'require', 'module', 'exports', '__dirname', '__filename' ],
    "var htmlUtil = require('html-util')\n  , parseHtml = htmlUtil.parse\n  , trimLeading = htmlUtil.trimLeading\n  , unescapeEntities = htmlUtil.unescapeEntities\n  , escapeHtml = htmlUtil.escapeHtml\n  , escapeAttribute = htmlUtil.escapeAttribute\n  , isVoid = htmlUtil.isVoid\n  , conditionalComment = htmlUtil.conditionalComment\n  , markup = require('./markup')\n  , viewPath = require('./viewPath')\n  , wrapRemainder = viewPath.wrapRemainder\n  , ctxPath = viewPath.ctxPath\n  , extractPlaceholder = viewPath.extractPlaceholder\n  , dataValue = viewPath.dataValue\n  , pathFnArgs = viewPath.pathFnArgs;\n\nmodule.exports = View;\n\nfunction empty() {\n  return '';\n}\n\nfunction notFound(name, ns) {\n  if (ns) name = ns + ':' + name;\n  throw new Error(\"Can't find view: \" + name);\n}\n\nvar defaultCtx = {\n  $depth: 0\n, $aliases: {}\n, $paths: []\n, $indices: []\n};\n\nvar defaultGetFns = {\n  equal: function(a, b) {\n    return a === b;\n  }\n, not: function(value) {\n    return !value;\n  }\n};\n\nvar defaultSetFns = {\n  equal: function(value, a) {\n    return value ? [a] : [];\n  }\n, not: function(value) {\n    return [!value];\n  }\n};\n\nfunction View() {\n  this.clear();\n  this.getFns = Object.create(defaultGetFns);\n  this.setFns = Object.create(defaultSetFns);\n  this._componentNamespaces = {app: true};\n  this._nonvoidComponents = {};\n}\n\nView.prototype = {\n  clear: function() {\n    this._views = Object.create(this.defaultViews);\n    this._made = {};\n    this._renders = {};\n    this._inline = '';\n    return this._idCount = 0;\n  }\n\n  // All automatically created ids start with a dollar sign\n, _uniqueId: function() {\n    return '$' + (this._idCount++).toString(36);\n  }\n\n, defaultViews: {\n    doctype: function() {\n      return '<!DOCTYPE html>';\n    }\n  , root: empty\n  , charset: function() {\n      return '<meta charset=utf-8>';\n    }\n  , title$s: empty\n  , head: empty\n  , header: empty\n  , body: empty\n  , footer: empty\n  , scripts: empty\n  , tail: empty\n  }\n\n, make: function(name, template, options, templatePath, boundMacro) {\n    var view = this\n      , onBind, renderer, render, matchTitle, ns, isString;\n    // Cache any templates that are made so that they can be\n    // re-parsed with different items bound when using macros\n    this._made[name] = [template, options, templatePath];\n    if (options && 'nonvoid' in options) {\n      this._nonvoidComponents[name] = true;\n    }\n\n    if (templatePath && (render = this._renders[templatePath])) {\n      this._views[name] = render;\n      return\n    }\n\n    name = name.toLowerCase();\n    matchTitle = /(?:^|\\:)title(\\$s)?$/.exec(name);\n    if (matchTitle) {\n      isString = !!matchTitle[1];\n      if (isString) {\n        onBind = function(events, name) {\n          var macro = false;\n          return bindEvents(events, macro, name, render, ['$_doc', 'prop', 'title']);\n        };\n      } else {\n        this.make(name + '$s', template, options, templatePath);\n      }\n    }\n\n    renderer = function(ctx) {\n      renderer = parse(view, name, template, isString, onBind, boundMacro);\n      return renderer(ctx);\n    }\n    render = function(ctx) {\n      return renderer(ctx);\n    }\n\n    this._views[name] = render;\n    if (templatePath) this._renders[templatePath] = render;\n  }\n\n, _makeAll: function(templates, instances) {\n    var name, instance, options, templatePath;\n    for (name in instances) {\n      instance = instances[name];\n      templatePath = instance[0];\n      options = instance[1];\n      this.make(name, templates[templatePath], options, templatePath);\n    }\n  }\n\n, _findItem: function(name, ns, prop) {\n    var items = this[prop]\n      , item, last, i, segments, testNs;\n    if (ns) {\n      ns = ns.toLowerCase();\n      item = items[ns + ':' + name];\n      if (item) return item;\n\n      segments = ns.split(':');\n      last = segments.length - 1;\n      if (last > 0) {\n        for (i = last; i--;) {\n          testNs = segments.slice(0, i).join(':');\n          item = items[testNs + ':' + name];\n          if (item) return item;\n        }\n      }\n    }\n    return items[name];\n  }\n\n, _find: function(name, ns, boundMacro) {\n    var hash, hashedName, out, item, template, options, templatePath;\n    if (boundMacro && (hash = keyHash(boundMacro))) {\n      hash = '$b:' + hash;\n      hashedName = name + hash;\n      out = this._findItem(hashedName, ns, '_views');\n      if (out) return out;\n\n      item = this._findItem(name, ns, '_made') || notFound(name, ns);\n      template = item[0];\n      options = item[1];\n      templatePath = item[2] + hash;\n      this.make(hashedName, template, options, templatePath, boundMacro);\n      return this._find(hashedName, ns);\n    }\n    return this._findItem(name, ns, '_views') || notFound(name, ns);\n  }\n\n, get: function(name, ns, ctx) {\n    if (typeof ns === 'object') {\n      ctx = ns;\n      ns = '';\n    }\n    ctx = ctx ? extend(ctx, defaultCtx) : Object.create(defaultCtx);\n    return this._find(name, ns)(ctx);\n  }\n\n, inline: empty\n\n, fn: function(name, fn) {\n    var get, set;\n    if (typeof fn === 'object') {\n      get = fn.get;\n      set = fn.set;\n    } else {\n      get = fn;\n    }\n    this.getFns[name] = get;\n    if (set) this.setFns[name] = set;\n  }\n\n, render: function(model, ns, ctx, silent) {\n    if (typeof ns === 'object') {\n      silent = ctx;\n      ctx = ns;\n      ns = '';\n    }\n    this.model = model;\n    this._idCount = 0;\n    this.model.__pathMap.clear();\n    this.model.__events.clear();\n    this.model.__blockPaths = {};\n    this.dom.clear();\n\n    var title = this.get('title$s', ns, ctx)\n      , rootHtml = this.get('root', ns, ctx)\n      , bodyHtml = this.get('header', ns, ctx) +\n          this.get('body', ns, ctx) +\n          this.get('footer', ns, ctx);\n    if (silent) return;\n\n    var doc = document\n      , documentElement = doc.documentElement\n      , attrs = documentElement.attributes\n      , i, attr, fakeRoot, body;\n\n    // Remove all current attributes on the documentElement and replace\n    // them with the attributes in the rendered rootHtml\n    for (i = attrs.length; i--;) {\n      attr = attrs[i];\n      documentElement.removeAttribute(attr.name);\n    }\n    // Using the DOM to get the attributes on an <html> tag would require\n    // some sort of iframe hack until DOMParser has better browser support.\n    // String parsing the html should be simpler and more efficient\n    parseHtml(rootHtml, {\n      start: function(tag, tagName, attrs) {\n        if (tagName !== 'html') return;\n        for (var attr in attrs) {\n          documentElement.setAttribute(attr, attrs[attr]);\n        }\n      }\n    });\n\n    fakeRoot = doc.createElement('html');\n    fakeRoot.innerHTML = bodyHtml;\n    body = fakeRoot.getElementsByTagName('body')[0];\n    documentElement.replaceChild(body, doc.body);\n    doc.title = title;\n  }\n\n, escapeHtml: escapeHtml\n, escapeAttribute: escapeAttribute\n}\n\nfunction keyHash(obj) {\n  var keys = []\n    , key;\n  for (key in obj) {\n    keys.push(key);\n  }\n  return keys.sort().join(',');\n}\n\nfunction extend(parent, obj) {\n  var out = Object.create(parent)\n    , key;\n  if (typeof obj !== 'object' || Array.isArray(obj)) {\n    return out;\n  }\n  for (key in obj) {\n    out[key] = obj[key];\n  }\n  return out;\n}\n\nfunction modelListener(params, triggerId, blockPaths, pathId, partial, ctx) {\n  var listener = typeof params === 'function'\n    ? params(triggerId, blockPaths, pathId)\n    : params;\n  listener.partial = partial;\n  listener.ctx = ctx.$stringCtx || ctx;\n  return listener;\n}\n\nfunction bindEvents(events, macro, name, partial, params) {\n  if (~name.indexOf('(')) {\n    var args = pathFnArgs(name);\n    if (!args.length) return;\n    events.push(function(ctx, modelEvents, dom, pathMap, view, blockPaths, triggerId) {\n      var listener = modelListener(params, triggerId, blockPaths, null, partial, ctx)\n        , path, pathId, i;\n      listener.getValue = function(model, triggerPath) {\n        patchCtx(ctx, triggerPath);\n        return dataValue(view, ctx, model, name, macro);\n      }\n      for (i = args.length; i--;) {\n        path = ctxPath(ctx, args[i], macro);\n        pathId = pathMap.id(path + '*');\n        modelEvents.bind(pathId, listener);\n      }\n    });\n    return;\n  }\n\n  var match = /(\\.*)(.*)/.exec(name)\n    , prefix = match[1] || ''\n    , relativeName = match[2] || ''\n    , segments = relativeName.split('.')\n    , bindName, i;\n  for (i = segments.length; i; i--) {\n    bindName = prefix + segments.slice(0, i).join('.');\n    (function(bindName) {\n      events.push(function(ctx, modelEvents, dom, pathMap, view, blockPaths, triggerId) {\n        var path = ctxPath(ctx, name, macro)\n          , listener, pathId;\n        if (!path) return;\n        pathId = pathMap.id(path);\n        listener = modelListener(params, triggerId, blockPaths, pathId, partial, ctx);\n        if (name !== bindName) {\n          path = ctxPath(ctx, bindName, macro);\n          pathId = pathMap.id(path);\n          listener.getValue = function(model, triggerPath) {\n            patchCtx(ctx, triggerPath);\n            return dataValue(view, ctx, model, name, macro);\n          };\n        }\n        modelEvents.bind(pathId, listener);\n      });\n    })(bindName);\n  }\n}\n\nfunction bindEventsById(events, macro, name, partial, attrs, method, prop, isBlock) {\n  function params(triggerId, blockPaths, pathId) {\n    var id = attrs._id || attrs.id;\n    if (isBlock && pathId) blockPaths[id] = pathId;\n    return [id, method, prop];\n  }\n  bindEvents(events, macro, name, partial, params);\n}\n\nfunction bindEventsByIdString(events, macro, name, partial, attrs, method, prop) {\n  function params(triggerId) {\n    var id = triggerId || attrs._id || attrs.id;\n    return [id, method, prop];\n  }\n  bindEvents(events, macro, name, partial, params);\n}\n\nfunction addId(view, attrs) {\n  if (attrs.id == null) {\n    attrs.id = function() {\n      return attrs._id = view._uniqueId();\n    };\n  }\n}\n\nfunction reduceStack(stack) {\n  var html = ['']\n    , i = 0\n    , attrs, bool, item, key, value, j, len;\n\n  function pushValue(value, isAttr) {\n    if (value && value.call) {\n      return i = html.push(value, '') - 1;\n    } else {\n      return html[i] += isAttr ? escapeAttribute(value) : value;\n    }\n  }\n\n  for (j = 0, len = stack.length; j < len; j++) {\n    item = stack[j];\n    switch (item[0]) {\n      case 'start':\n        html[i] += '<' + item[1];\n        attrs = item[2];\n        // Make sure that the id attribute is rendered first\n        if ('id' in attrs) {\n          html[i] += ' id=';\n          pushValue(attrs.id, true);\n        }\n        for (key in attrs) {\n          if (key === 'id') continue;\n          value = attrs[key];\n          if (value != null) {\n            if (bool = value.bool) {\n              pushValue(bool);\n              continue;\n            }\n            html[i] += ' ' + key + '=';\n            pushValue(value, true);\n          } else {\n            html[i] += ' ' + key;\n          }\n        }\n        html[i] += '>';\n        break;\n      case 'text':\n        pushValue(item[1]);\n        break;\n      case 'end':\n        html[i] += '</' + item[1] + '>';\n        break;\n      case 'marker':\n        html[i] += '<!--' + item[1];\n        pushValue(item[2].id);\n        html[i] += '-->';\n    }\n  }\n  return html;\n}\n\nfunction patchCtx(ctx, triggerPath) {\n  var path = ctx.$paths[0];\n  if (!(triggerPath && path)) return;\n\n  var segments = path.split('.')\n    , triggerSegments = triggerPath.replace(/\\*$/, '').split('.')\n    , indices = ctx.$indices.slice()\n    , index = indices.length\n    , i, len, segment, triggerSegment, n;\n  for (i = 0, len = segments.length; i < len; i++) {\n    segment = segments[i];\n    triggerSegment = triggerSegments[i];\n    // `(n = +triggerSegment) === n` will be false only if segment is NaN\n    if (segment === '$#' && (n = +triggerSegment) === n) {\n      indices[--index] = n;\n    } else if (segment !== triggerSegment) {\n      break;\n    }\n  }\n  ctx.$indices = indices;\n}\n\nfunction renderer(view, items, events, onRender) {\n  return function(ctx, model, triggerPath, triggerId) {\n    patchCtx(ctx, triggerPath);\n\n    if (!model) model = view.model;  // Needed, since model parameter is optional\n    var pathMap = model.__pathMap\n      , modelEvents = model.__events\n      , blockPaths = model.__blockPaths\n      , dom = view.dom\n      , html = ''\n      , i, len, item, event;\n\n    if (onRender) ctx = onRender(ctx);\n    for (i = 0, len = items.length; i < len; i++) {\n      item = items[i];\n      html += typeof item === 'function' ? item(ctx, model) || '' : item;\n    }\n    for (i = 0; event = events[i++];) {\n      event(ctx, modelEvents, dom, pathMap, view, blockPaths, triggerId);\n    }\n    return html;\n  }\n}\n\nfunction extendCtx(ctx, value, name, alias, index, isArray) {\n  var path = ctxPath(ctx, name, null, true)\n    , aliases;\n  ctx = extend(ctx, value);\n  ctx[\"this\"] = value;\n  if (alias) {\n    aliases = ctx.$aliases = Object.create(ctx.$aliases);\n    aliases[alias] = ctx.$depth;\n  }\n  if (path) ctx.$paths = [path].concat(ctx.$paths);\n  if (name) ctx.$depth++;\n  if (index != null) {\n    ctx.$indices = [index].concat(ctx.$indices);\n    isArray = true;\n  }\n  if (isArray && ctx.$paths[0]) {\n    ctx.$paths[0] += '.$#';\n  }\n  return ctx;\n}\n\nfunction partialValue(view, ctx, model, name, value, listener, macro) {\n  if (listener) return value;\n  return name ? dataValue(view, ctx, model, name, macro) : true;\n}\n\nfunction partialFn(view, name, type, alias, render, macroCtx, macro) {\n  function conditionalRender(ctx, model, triggerPath, value, index, condition) {\n    if (condition) {\n      var renderCtx = extendCtx(ctx, value, name, alias, index);\n      return render(renderCtx, model, triggerPath);\n    }\n    return '';\n  }\n\n  function withFn(ctx, model, triggerPath, triggerId, value, index, listener) {\n    value = partialValue(view, ctx, model, name, value, listener, macro);\n    return conditionalRender(ctx, model, triggerPath, value, index, true);\n  }\n\n  if (type === 'partial') {\n    return function(ctx, model, triggerPath, triggerId, value, index, listener) {\n      var renderCtx = Object.create(ctx)\n        , parentMacroCtx = ctx.$macroCtx;\n      renderCtx.$macroCtx = parentMacroCtx ? extend(parentMacroCtx, macroCtx) : macroCtx;\n      return render(renderCtx, model, triggerPath);\n    }\n  }\n\n  if (type === 'with' || type === 'else') {\n    return withFn;\n  }\n\n  if (type === 'if' || type === 'else if') {\n    return function(ctx, model, triggerPath, triggerId, value, index, listener) {\n      value = partialValue(view, ctx, model, name, value, listener, macro);\n      var condition = !!(Array.isArray(value) ? value.length : value);\n      return conditionalRender(ctx, model, triggerPath, value, index, condition);\n    }\n  }\n\n  if (type === 'unless') {\n    return function(ctx, model, triggerPath, triggerId, value, index, listener) {\n      value = partialValue(view, ctx, model, name, value, listener, macro);\n      var condition = !(Array.isArray(value) ? value.length : value);\n      return conditionalRender(ctx, model, triggerPath, value, index, condition);\n    }\n  }\n\n  if (type === 'each') {\n    return function(ctx, model, triggerPath, triggerId, value, index, listener) {\n      var indices, isArray, item, out, renderCtx, i, len;\n      value = partialValue(view, ctx, model, name, value, listener, macro);\n      isArray = Array.isArray(value);\n\n      if (listener && !isArray) {\n        return withFn(ctx, model, triggerPath, triggerId, value, index, true);\n      }\n\n      if (!isArray) return '';\n\n      ctx = extendCtx(ctx, null, name, alias, null, true);\n\n      out = '';\n      indices = ctx.$indices;\n      for (i = 0, len = value.length; i < len; i++) {\n        item = value[i];\n        renderCtx = extend(ctx, item);\n        renderCtx[\"this\"] = item;\n        renderCtx.$indices = [i].concat(indices);\n        out += render(renderCtx, model, triggerPath);\n      }\n      return out;\n    }\n  }\n\n  throw new Error('Unknown block type: ' + type);\n}\n\nvar objectToString = Object.prototype.toString;\n\nfunction textFn(view, name, escape, macro) {\n  return function(ctx, model) {\n    var value = dataValue(view, ctx, model, name, macro)\n      , text = typeof value === 'string' ? value\n          : value == null ? ''\n          : value.toString === objectToString ? JSON.stringify(value)\n          : value.toString();\n    return escape ? escape(text) : text;\n  }\n}\n\nfunction sectionFn(view, queue) {\n  var render = renderer(view, reduceStack(queue.stack), queue.events)\n    , block = queue.block;\n  return partialFn(view, block.name, block.type, block.alias, render, null, block.macro);\n}\n\nfunction blockFn(view, sections) {\n  var len = sections.length;\n  if (!len) return;\n  if (len === 1) {\n    return sectionFn(view, sections[0]);\n\n  } else {\n    var fns = []\n      , i;\n    for (i = 0; i < len; i++) {\n      fns.push(sectionFn(view, sections[i]));\n    }\n    return function(ctx, model, triggerPath, triggerId, value, index, listener) {\n      var out, fn;\n      for (i = 0; i < len; i++) {\n        fn = fns[i];\n        out = fn(ctx, model, triggerPath, triggerId, value, index, listener);\n        if (out) return out;\n      }\n      return '';\n    }\n  }\n}\n\nfunction parseMarkup(type, attr, tagName, events, attrs, name) {\n  var parser = markup[type][attr]\n    , anyOut, anyParser, elOut, elParser, out;\n  if (!parser) return;\n  if (anyParser = parser['*']) {\n    anyOut = anyParser(events, attrs, name);\n  }\n  if (elParser = parser[tagName]) {\n    elOut = elParser(events, attrs, name);\n  }\n  out = anyOut ? extend(anyOut, elOut) : elOut;\n  if (out && out.del) delete attrs[attr];\n  return out;\n}\n\nfunction pushText(stack, text) {\n  if (text) stack.push(['text', text]);\n}\n\nfunction pushVarFn(view, stack, fn, name, escapeFn, macro) {\n  if (fn) {\n    pushText(stack, fn);\n  } else {\n    pushText(stack, textFn(view, name, escapeFn, macro));\n  }\n}\n\nfunction boundMacroName(boundMacro, name) {\n  var macroVar = name.split('.')[0];\n  return boundMacro[macroVar];\n}\n\nfunction isBound(boundMacro, match, name) {\n  if (!(name && match.macro)) return match.bound;\n  if (~name.indexOf('(')) {\n    var args = pathFnArgs(name)\n      , i, len;\n    for (i = 0, len = args.length; i < len; i++) {\n      if (boundMacroName(boundMacro, args[i])) return true;\n    }\n    return false;\n  }\n  return boundMacroName(boundMacro, name);\n}\n\nfunction pushVar(view, ns, stack, events, boundMacro, remainder, match, fn) {\n  var name = match.name\n    , partial = match.partial\n    , macro = match.macro\n    , escapeFn = match.escaped && escapeHtml\n    , attr, attrs, boundOut, last, tagName, wrap, render;\n\n  if (partial) {\n    render = view._find(partial, ns, boundMacro);\n    fn = partialFn(view, name, 'partial', match.alias, render, match.macroCtx);\n  }\n\n  if (isBound(boundMacro, match, name)) {\n    last = stack[stack.length - 1];\n    wrap = match.pre ||\n      !last ||\n      (last[0] !== 'start') ||\n      isVoid(tagName = last[1]) ||\n      wrapRemainder(tagName, remainder);\n\n    if (wrap) {\n      stack.push(['marker', '', attrs = {}]);\n    } else {\n      attrs = last[2];\n      for (attr in attrs) {\n        parseMarkup('boundParent', attr, tagName, events, attrs, name);\n      }\n      boundOut = parseMarkup('boundParent', '*', tagName, events, attrs, name);\n      if (boundOut) {\n        bindEventsById(events, macro, name, null, attrs, boundOut.method, boundOut.property);\n      }\n    }\n    addId(view, attrs);\n\n    if (!boundOut) {\n      bindEventsById(events, macro, name, fn, attrs, 'html', !fn && escapeFn, true);\n    }\n  }\n\n  pushVarFn(view, stack, fn, name, escapeFn, macro);\n  if (wrap) {\n    stack.push([\n      'marker'\n    , '$'\n    , { id: function() { return attrs._id } }\n    ]);\n  }\n}\n\nfunction pushVarString(view, ns, stack, events, boundMacro, remainder, match, fn) {\n  var name = match.name\n    , escapeFn = !match.escaped && unescapeEntities;\n  function bindOnce(ctx) {\n    ctx.$onBind(events, name);\n    bindOnce = empty;\n  }\n  if (isBound(boundMacro, match, name)) {\n    events.push(function(ctx) {\n      bindOnce(ctx);\n    });\n  }\n  pushVarFn(view, stack, fn, name, escapeFn, match.macro);\n}\n\nfunction parseMatchError(text, message) {\n  throw new Error(message + '\\n\\n' + text + '\\n');\n}\n\nfunction onBlock(start, end, block, queues, callbacks) {\n  var boundMacro, lastQueue, queue;\n  if (end) {\n    lastQueue = queues.pop();\n    queue = queues.last();\n    queue.sections.push(lastQueue);\n  } else {\n    queue = queues.last();\n  }\n\n  if (start) {\n    boundMacro = Object.create(queue.boundMacro);\n    queues.push(queue = {\n      stack: []\n    , events: []\n    , block: block\n    , sections: []\n    , boundMacro: boundMacro\n    });\n    callbacks.onStart(queue);\n  } else {\n    if (end) {\n      callbacks.onStart(queue);\n      callbacks.onEnd(queue.sections);\n      queue.sections = [];\n    } else {\n      callbacks.onContent(block);\n    }\n  }\n}\n\nfunction parseMatch(text, match, queues, callbacks) {\n  var hash = match.hash\n    , type = match.type\n    , name = match.name\n    , block = queues.last().block\n    , blockType = block && block.type\n    , startBlock, endBlock;\n\n  if (type === 'if' || type === 'unless' || type === 'each' || type === 'with') {\n    if (hash === '#') {\n      startBlock = true;\n    } else if (hash === '/') {\n      endBlock = true;\n    } else {\n      parseMatchError(text, type + ' blocks must begin with a #');\n    }\n\n  } else if (type === 'else' || type === 'else if') {\n    if (hash) {\n      parseMatchError(text, type + ' blocks may not start with ' + hash);\n    }\n    if (blockType !== 'if' && blockType !== 'else if' &&\n        blockType !== 'unless' && blockType !== 'each') {\n      parseMatchError(text, type + ' may only follow `if`, `else if`, `unless`, or `each`');\n    }\n    startBlock = true;\n    endBlock = true;\n\n  } else if (hash === '/') {\n    endBlock = true;\n\n  } else if (hash === '#') {\n    parseMatchError(text, '# must be followed by `if`, `unless`, `each`, or `with`');\n  }\n\n  if (endBlock && !block) {\n    parseMatchError(text, 'Unmatched template end tag');\n  }\n\n  onBlock(startBlock, endBlock, match, queues, callbacks);\n}\n\nfunction parseAttr(view, viewName, events, boundMacro, tagName, attrs, attr, value) {\n  if (typeof value === 'function') return;\n\n  var attrOut = parseMarkup('attr', attr, tagName, events, attrs, value) || {}\n    , boundOut, macro, match, name, render, method, property;\n  if (attrOut.addId) addId(view, attrs);\n\n  if (match = extractPlaceholder(value)) {\n    name = match.name, macro = match.macro;\n\n    if (match.pre || match.post) {\n      // Attributes must be a single string, so create a string partial\n      addId(view, attrs);\n      render = parse(view, viewName, value, true, function(events, name) {\n        bindEventsByIdString(events, macro, name, render, attrs, 'attr', attr);\n      }, boundMacro);\n\n      attrs[attr] = attr === 'id' ? function(ctx, model) {\n        return attrs._id = escapeAttribute(render(ctx, model));\n      } : function(ctx, model) {\n        return escapeAttribute(render(ctx, model));\n      }\n      return;\n    }\n\n    if (isBound(boundMacro, match, name)) {\n      boundOut = parseMarkup('bound', attr, tagName, events, attrs, name) || {};\n      addId(view, attrs);\n      method = boundOut.method || 'attr';\n      property = boundOut.property || attr;\n      bindEventsById(events, macro, name, null, attrs, method, property);\n    }\n\n    if (!attrOut.del) {\n      macro = match.macro;\n      attrs[attr] = attrOut.bool ? {\n        bool: function(ctx, model) {\n          return (dataValue(view, ctx, model, name, macro)) ? ' ' + attr : '';\n        }\n      } : textFn(view, name, escapeAttribute, macro);\n    }\n  }\n}\n\nfunction parsePartialAttr(view, viewName, events, attrs, attr, value) {\n  var bound = false\n    , match = extractPlaceholder(value)\n    , name;\n  if (attr === 'content') {\n    throw new Error('components may not have an attribute named \"content\"');\n  }\n\n  if (match) {\n    if (match.pre || match.post) {\n      throw new Error('unimplemented: blocks in component attributes');\n    }\n\n    name = match.name;\n    bound = match.bound;\n    attrs[attr] = {$macroVar: name};\n\n  } else if (value === 'true') {\n    attrs[attr] = true;\n  } else if (value === 'false') {\n    attrs[attr] = false;\n  } else if (value === 'null') {\n    attrs[attr] = null;\n  } else if (!isNaN(value)) {\n    attrs[attr] = +value;\n  }\n\n  return bound;\n}\n\nfunction partialName(view, tagName) {\n  var i = tagName.indexOf(':')\n    , partial, tagNs\n  if (!~i) return;\n  tagNs = tagName.slice(0, i);\n  if (!view._componentNamespaces[tagNs]) return;\n  return partial = tagName.slice(i + 1);\n}\n\nfunction parse(view, viewName, template, isString, onBind, boundMacro) {\n  if (boundMacro == null) boundMacro = {};\n  var queues, stack, events, onRender, push;\n\n  queues = [{\n    stack: stack = []\n  , events: events = []\n  , sections: []\n  , boundMacro: boundMacro\n  }];\n  queues.last = function() {\n    return queues[queues.length - 1];\n  };\n\n  function onStart(queue) {\n    stack = queue.stack;\n    events = queue.events;\n    boundMacro = queue.boundMacro;\n  }\n\n  if (isString) {\n    push = pushVarString;\n    onRender = function(ctx) {\n      if (ctx.$stringCtx) return ctx;\n      ctx = Object.create(ctx);\n      ctx.$onBind = onBind;\n      ctx.$stringCtx = ctx;\n      return ctx;\n    }\n  } else {\n    push = pushVar;\n  }\n\n  var index = viewName.lastIndexOf(':')\n    , ns = ~index ? viewName.slice(0, index) : ''\n    , minifyContent = true;\n\n  function parseStart(tag, tagName, attrs) {\n    var attr, block, bound, isNonvoid, out, parser, partial, value\n    if ('x-no-minify' in attrs) {\n      delete attrs['x-no-minify'];\n      minifyContent = false;\n    } else {\n      minifyContent = true;\n    }\n\n    if (partial = partialName(view, tagName)) {\n      isNonvoid = view._findItem(partial, ns, '_nonvoidComponents');\n      for (attr in attrs) {\n        value = attrs[attr];\n        bound = parsePartialAttr(view, viewName, events, attrs, attr, value);\n        if (bound) boundMacro[attr] = true;\n      }\n\n      block = {\n        partial: partial\n      , macroCtx: attrs\n      };\n      if (isNonvoid) {\n        onBlock(true, false, block, queues, {onStart: onStart});\n      } else {\n        push(view, ns, stack, events, boundMacro, '', block);\n      }\n      return;\n    }\n\n    if (parser = markup.element[tagName]) {\n      out = parser(events, attrs);\n      if (out != null ? out.addId : void 0) {\n        addId(view, attrs);\n      }\n    }\n\n    for (attr in attrs) {\n      value = attrs[attr];\n      parseAttr(view, viewName, events, boundMacro, tagName, attrs, attr, value);\n    }\n    stack.push(['start', tagName, attrs]);\n  }\n  \n  function parseText(text, isRawText, remainder) {\n    var match = extractPlaceholder(text)\n      , post, pre;\n    if (!match || isRawText) {\n      if (minifyContent) {\n        text = isString ? unescapeEntities(trimLeading(text)) : trimLeading(text);\n      }\n      pushText(stack, text);\n      return;\n    }\n\n    pre = match.pre;\n    post = match.post;\n    if (isString) pre = unescapeEntities(pre);\n    pushText(stack, pre);\n    remainder = post || remainder;\n\n    parseMatch(text, match, queues, {\n      onStart: onStart\n    , onEnd: function(sections) {\n        var fn = blockFn(view, sections);\n        push(view, ns, stack, events, boundMacro, remainder, sections[0].block, fn);\n      }\n    , onContent: function(match) {\n        push(view, ns, stack, events, boundMacro, remainder, match);\n      }\n    });\n\n    if (post) return parseText(post);\n  }\n  \n  function parseEnd(tag, tagName) {\n    var partial = partialName(view, tagName);\n    if (partial) {\n      onBlock(false, true, null, queues, {\n        onStart: onStart\n      , onEnd: function(queues) {\n          var queue = queues[0]\n            , block = queue.block;\n          block.macroCtx.content = renderer(view, reduceStack(queue.stack), queue.events);\n          push(view, ns, stack, events, boundMacro, '', block);\n        }\n      })\n      return;\n    }\n    stack.push(['end', tagName]);\n  }\n\n  if (isString) {\n    parseText(template);\n  } else {\n    parseHtml(template, {\n      start: parseStart\n    , text: parseText\n    , end: parseEnd\n    , comment: function(tag) {\n        if (conditionalComment(tag)) pushText(stack, tag);\n      }\n    , other: function(tag) {\n        pushText(stack, tag);\n      }\n    });\n  }\n  return renderer(view, reduceStack(stack), events, onRender);\n}\n\n//@ sourceURL=/node_modules/derby/lib/View.js"
));

require.define("/node_modules/derby/lib/markup.js", Function(
    [ 'require', 'module', 'exports', '__dirname', '__filename' ],
    "var eventBinding = require('./eventBinding')\n  , splitEvents = eventBinding.splitEvents\n  , containsEvent = eventBinding.containsEvent\n  , addDomEvent = eventBinding.addDomEvent\n  , TEXT_EVENTS = 'keyup,keydown,paste/0,dragover/0,blur'\n  , AUTOCOMPLETE_OFF = {\n      checkbox: true\n    , radio: true\n    }\n  , onBindA, onBindForm;\n\nmodule.exports = {\n  bound: {\n    'value': {\n      'input': function(events, attrs, name) {\n        var eventNames, method;\n        if (attrs.type === 'radio') return;\n        if ('x-blur' in attrs) {\n          // Only update after the element loses focus\n          delete attrs['x-blur'];\n          eventNames = 'change,blur';\n        } else {\n          // By default, update as the user types\n          eventNames = TEXT_EVENTS;\n        }\n        if ('x-ignore-focus' in attrs) {\n          // Update value regardless of focus\n          delete attrs['x-ignore-focus'];\n          method = 'prop';\n        } else {\n          // Update value unless window and element are focused\n          method = 'propPolite';\n        }\n        addDomEvent(events, attrs, eventNames, name, {\n          method: 'prop'\n        , property: 'value'\n        });\n        return {method: method};\n      }\n    }\n\n  , 'checked': {\n      '*': function(events,  attrs, name) {\n        addDomEvent(events, attrs, 'change', name, {\n          method: 'prop'\n        , property: 'checked'\n        });\n        return {method: 'prop'};\n      }\n    }\n\n  , 'selected': {\n      '*': function(events, attrs, name) {\n        addDomEvent(events, attrs, 'change', name, {\n          method: 'prop'\n        , property: 'selected'\n        });\n        return {method: 'prop'};\n      }\n    }\n\n  , 'disabled': {\n      '*': function() {\n        return {method: 'prop'};\n      }\n    }\n  }\n\n, boundParent: {\n    'contenteditable': {\n      '*': function(events, attrs, name) {\n        addDomEvent(events, attrs, TEXT_EVENTS, name, {\n          method: 'html'\n        });\n      }\n    }\n\n  , '*': {\n      'textarea': function(events, attrs, name) {\n        addDomEvent(events, attrs, TEXT_EVENTS, name, {\n          method: 'prop'\n        , property: 'value'\n        });\n        return {method: 'prop', property: 'value'};\n      }\n    }\n  }\n\n, element: {\n    'select': function(events, attrs) {\n      // Distribute change event to child nodes of select elements\n      addDomEvent(events, attrs, 'change:$forChildren');\n      return {addId: true};\n    }\n\n  , 'input': function(events, attrs) {\n      if (AUTOCOMPLETE_OFF[attrs.type] && !('autocomplete' in attrs)) {\n        attrs.autocomplete = 'off';\n      }\n      if (attrs.type === 'radio') {\n        // Distribute change events to other elements with the same name\n        addDomEvent(events, attrs, 'change:$forName');\n      }\n    }\n  }\n\n, attr: {\n    'x-bind': {\n      '*': function(events, attrs, eventNames) {\n        addDomEvent(events, attrs, eventNames);\n        return {addId: true, del: true};\n      }\n\n    , 'a': onBindA = function(events, attrs, eventNames) {\n        if (containsEvent(eventNames, 'click') && !('href' in attrs)) {\n          attrs.href = '#';\n          if (!('onclick' in attrs)) {\n            attrs.onclick = 'return false';\n          }\n        }\n      }\n\n    , 'form': onBindForm = function(events, attrs, eventNames) {\n        if (containsEvent(eventNames, 'submit')) {\n          if (!('onsubmit' in attrs)) {\n            attrs.onsubmit = 'return false';\n          }\n        }\n      }\n    }\n\n  , 'x-capture': {\n      '*': function(events, attrs, eventNames) {\n        addDomEvent(events, attrs, eventNames, null, {capture: true});\n        return {addId: true, del: true};\n      }\n    , 'a': onBindA\n    , 'form': onBindForm\n    }\n\n  , 'checked': {\n      '*': function() {\n        return {bool: true};\n      }\n    }\n\n  , 'selected': {\n      '*': function() {\n        return {bool: true};\n      }\n    }\n\n  , 'disabled': {\n      '*': function() {\n        return {bool: true};\n      }\n    }\n  }\n\n, TEXT_EVENTS: TEXT_EVENTS\n, AUTOCOMPLETE_OFF: AUTOCOMPLETE_OFF\n};\n\n//@ sourceURL=/node_modules/derby/lib/markup.js"
));

require.define("/node_modules/derby/lib/eventBinding.js", Function(
    [ 'require', 'module', 'exports', '__dirname', '__filename' ],
    "var merge = require('racer').util.merge\n  , viewPath = require('./viewPath')\n  , ctxPath = viewPath.ctxPath\n  , pathFnArgs = viewPath.pathFnArgs\n  , setBoundFn = viewPath.setBoundFn;\n\nexports.splitEvents = splitEvents;\nexports.containsEvent = containsEvent;\nexports.addDomEvent = addDomEvent;\n\nfunction splitEvents(eventNames) {\n  var pairs = eventNames.replace(/\\s/g, '').split(',')\n    , eventList = []\n    , pair, segments, name, eventName, delay, fn;\n  for (var i = pairs.length; i--;) {\n    pair = pairs[i];\n    segments = pair.split(':');\n    name = segments[0].split('/');\n    eventName = name[0];\n    delay = name[1];\n    fn = segments[1] || '';\n    eventList.push([eventName, delay, fn]);\n  }\n  return eventList;\n}\n\nfunction containsEvent(eventNames, expected) {\n  var eventList = splitEvents(eventNames)\n    , eventName;\n  for (var i = eventList.length; i--;) {\n    eventName = eventList[i][0];\n    if (eventName === expected) return true;\n  }\n  return false;\n}\n\nfunction addDomEvent(events, attrs, eventNames, name, options) {\n  var eventList = splitEvents(eventNames)\n    , args;\n  if (name) {\n    if (~name.indexOf('(')) {\n      args = pathFnArgs(name);\n      if (!args.length) return;\n\n      events.push(function(ctx, modelEvents, dom, pathMap, view) {\n        var id = attrs._id || attrs.id\n          , paths = []\n          , arg, path, pathId, event, eventName, eventOptions, i, j;\n        options.setValue = function(model, value) {\n          return setBoundFn(view, ctx, model, name, value);\n        }\n        for (i = args.length; i--;) {\n          arg = args[i];\n          path = ctxPath(ctx, arg);\n          paths.push(path);\n          pathId = pathMap.id(path);\n          for (j = eventList.length; j--;) {\n            event = eventList[j];\n            eventName = event[0];\n            eventOptions = merge({pathId: pathId, delay: event[1]}, options);\n            dom.bind(eventName, id, eventOptions);\n          }\n        }\n      });\n      return;\n    }\n\n    events.push(function(ctx, modelEvents, dom, pathMap) {\n      var id = attrs._id || attrs.id\n        , pathId = pathMap.id(ctxPath(ctx, name))\n        , event, eventName, eventOptions, i;\n      for (i = eventList.length; i--;) {\n        event = eventList[i];\n        eventName = event[0];\n        eventOptions = merge({pathId: pathId, delay: event[1]}, options);\n        dom.bind(eventName, id, eventOptions);\n      }\n    });\n    return;\n  }\n\n  events.push(function(ctx, modelEvents, dom) {\n    var id = attrs._id || attrs.id\n      , event, eventName, eventOptions, i;\n    for (i = eventList.length; i--;) {\n      event = eventList[i];\n      eventName = event[0];\n      eventOptions = merge({delay: event[1], fn: event[2]}, options);\n      dom.bind(eventName, id, eventOptions);\n    }\n  });\n}\n\n//@ sourceURL=/node_modules/derby/lib/eventBinding.js"
));

require.define("/node_modules/derby/lib/viewPath.js", Function(
    [ 'require', 'module', 'exports', '__dirname', '__filename' ],
    "var lookup = require('racer/lib/path').lookup\n  , trimLeading = require('html-util').trimLeading;\n\nexports.wrapRemainder = wrapRemainder;\nexports.extractPlaceholder = extractPlaceholder;\nexports.pathFnArgs = pathFnArgs;\nexports.ctxPath = ctxPath;\nexports.dataValue = dataValue;\nexports.setBoundFn = setBoundFn;\n\nfunction wrapRemainder(tagName, remainder) {\n  if (!remainder) return false;\n  return !(new RegExp('^<\\/' + tagName, 'i')).test(remainder);\n}\n\nvar openPlaceholder = /^([\\s\\S]*?)(\\{{1,3})([\\s\\S]*)/\n  , placeholderContent = /^\\s*([\\#\\/]?)(?:(else\\sif|if|else|unless|each|with|unescaped)(?!\\())?\\s*([^\\s(>]*(?:\\s*\\([\\s\\S]*\\))?)(?:\\s+as\\s+:([^\\s>]+))?/;\n\nfunction extractPlaceholder(text) {\n  var match = openPlaceholder.exec(text);\n  if (!match) return;\n  var pre = match[1]\n    , open = match[2]\n    , remainder = match[3]\n    , openLen = open.length\n    , bound = openLen === 1\n    , macro = openLen === 3\n    , end = matchBraces(remainder, openLen, 0, '{', '}')\n    , endInner = end - openLen\n    , inner = remainder.slice(0, endInner)\n    , post = remainder.slice(end)\n    , content = placeholderContent.exec(inner)\n    , escaped, name, type;\n  if (!content) return;\n  type = content[2];\n  escaped = true;\n  if (type === 'unescaped') {\n    escaped = false;\n    type = '';\n  }\n  name = content[3];\n  if (bound) name = name.replace(/\\bthis\\b/, '.');\n  if (macro && name === 'content') escaped = false;\n  return {\n    pre: trimLeading(pre)\n  , post: trimLeading(post)\n  , bound: bound\n  , macro: macro\n  , hash: content[1]\n  , escaped: escaped\n  , type: type\n  , name: name\n  , alias: content[4]\n  };\n}\n\nfunction matchBraces(text, num, i, openChar, closeChar) {\n  var close, hasClose, hasOpen, open;\n  i++;\n  while (num) {\n    close = text.indexOf(closeChar, i);\n    open = text.indexOf(openChar, i);\n    hasClose = ~close;\n    hasOpen = ~open;\n    if (hasClose && (!hasOpen || (close < open))) {\n      i = close + 1;\n      num--;\n      continue;\n    } else if (hasOpen) {\n      i = open + 1;\n      num++;\n      continue;\n    } else {\n      return;\n    }\n  }\n  return i;\n}\n\nvar fnCall = /^([^(]+)\\s*\\(\\s*([\\s\\S]*?)\\s*\\)\\s*$/\n  , argSeparator = /\\s*([,(])\\s*/g\n  , notSeparator = /[^,\\s]/g\n  , notPathArg = /(?:^['\"\\d\\-[{])|(?:^null$)|(?:^true$)|(?:^false$)/;\n\nfunction fnArgs(inner) {\n  var args = []\n    , lastIndex = 0\n    , match, end, last;\n  while (match = argSeparator.exec(inner)) {\n    if (match[1] === '(') {\n      end = matchBraces(inner, 1, argSeparator.lastIndex, '(', ')');\n      args.push(inner.slice(lastIndex, end));\n      notSeparator.lastIndex = end;\n      lastIndex = argSeparator.lastIndex =\n        notSeparator.test(inner) ? notSeparator.lastIndex - 1 : end;\n      continue;\n    }\n    args.push(inner.slice(lastIndex, match.index));\n    lastIndex = argSeparator.lastIndex;\n  }\n  last = inner.slice(lastIndex);\n  if (last) args.push(last);\n  return args;\n}\n\nfunction fnCallError(name) {\n  throw new Error('malformed view function call: ' + name);\n}\n\nfunction fnArgValue(view, ctx, model, name, macro, arg) {\n  if (arg === 'null') return null;\n  if (arg === 'true') return true;\n  if (arg === 'false') return false;\n  var firstChar = arg.charAt(0)\n    , match;\n  if (firstChar === \"'\") {\n    match = /^'(.*)'$/.exec(arg) || fnCallError(name);\n    return match[1];\n  }\n  if (firstChar === '\"') {\n    match = /^\"(.*)\"$/.exec(arg) || fnCallError(name);\n    return match[1];\n  }\n  if (/^[\\d\\-]/.test(firstChar) && !isNaN(arg)) {\n    return +arg;\n  }\n  if (firstChar === '[' || firstChar === '{') {\n    throw new Error('object literals not supported in view function call: ' + name);\n  }\n  return dataValue(view, ctx, model, arg, macro);\n}\n\nfunction fnValue(view, ctx, model, name, macro) {\n  var match = fnCall.exec(name) || fnCallError(name)\n    , fnName = match[1]\n    , args = fnArgs(match[2])\n    , fn, fnName, i;\n  for (i = args.length; i--;) {\n    args[i] = fnArgValue(view, ctx, model, name, macro, args[i]);\n  }\n  if (!(fn = view.getFns[fnName])) {\n    throw new Error('view function \"' + fnName + '\" not found for call: ' + name);\n  }\n  return fn.apply(null, args);\n}\n\nfunction pathFnArgs(name, paths) {\n  var match = fnCall.exec(name) || fnCallError(name)\n    , args = fnArgs(match[2])\n    , i, arg;\n  if (paths == null) paths = [];\n  for (i = args.length; i--;) {\n    arg = args[i];\n    if (notPathArg.test(arg)) continue;\n    if (~arg.indexOf('(')) {\n      pathFnArgs(arg, paths);\n      continue;\n    }\n    paths.push(arg);\n  }\n  return paths;\n}\n\nfunction macroName(ctx, name, noReplace) {\n  var macroCtx = ctx.$macroCtx\n    , path = ctxPath(macroCtx, name, false, noReplace)\n    , segments = path.split('.')\n    , base = segments[0].toLowerCase()\n    , remainder = segments[1]\n    , value = lookup(base, macroCtx)\n    , macroVar = value && value.$macroVar;\n  if (!macroVar) return remainder ? base + '.' + remainder : base;\n  return remainder ?\n    (/\\.+/.test(macroVar) ? macroVar.slice(1) : macroVar) + '.' + remainder :\n    macroVar;\n}\n\nfunction ctxPath(ctx, name, macro, noReplace) {\n  if (macro) name = macroName(ctx, name, noReplace);\n\n  var firstChar = name.charAt(0)\n    , i, aliasName, firstChar, indices;\n  if (firstChar === ':') {\n    if (~(i = name.indexOf('.'))) {\n      aliasName = name.slice(1, i);\n      name = name.slice(i);\n    } else {\n      aliasName = name.slice(1);\n      name = '';\n    }\n    i = ctx.$depth - ctx.$aliases[aliasName];\n    if (i !== i) throw new Error(\"Can't find alias for \" + aliasName);\n  } else if (firstChar === '.') {\n    i = 0;\n    while (name.charAt(i) === '.') {\n      i++;\n    }\n    name = i === name.length ? '' : name.slice(i - 1);\n  }\n  if (i && (name = ctx.$paths[i - 1] + name) && !noReplace) {\n    indices = ctx.$indices;\n    i = indices.length;\n    name = name.replace(/\\$#/g, function() {\n      return indices[--i];\n    });\n  }\n  return name.replace(/\\[([^\\]]+)\\]/g, function(match, name) {\n    return lookup(name, ctx);\n  });\n}\n\nfunction dataValue(view, ctx, model, name, macro) {\n  var path, value;\n  if (~name.indexOf('(')) {\n    return fnValue(view, ctx, model, name, macro);\n  }\n  if (macro) {\n    // Get macro content sections\n    value = lookup(name.toLowerCase(), ctx.$macroCtx);\n    if (value && !value.$macroVar) {\n      return typeof value === 'function' ? value(ctx, model) : value;\n    }\n  }\n  path = ctxPath(ctx, name, macro);\n  value = lookup(path, ctx);\n  if (value !== void 0) return value;\n  value = model.get(path);\n  return value !== void 0 ? value : model[path];\n}\n\nfunction setBoundFn(view, ctx, model, name, value) {\n  var match = fnCall.exec(name) || fnCallError(name)\n    , fnName = match[1]\n    , args = fnArgs(match[2])\n    , get = view.getFns[fnName]\n    , set = view.setFns[fnName]\n    , macro = false\n    , numInputs = set.length - 1\n    , arg, i, inputs, out, path, len;\n\n  if (!(get && set)) {\n    throw new Error('view function \"' + fnName + '\" not found for binding to: ' + name);\n  }\n\n  if (numInputs) {\n    inputs = [value];\n    i = 0;\n    while (i < numInputs) {\n      inputs.push(fnArgValue(view, ctx, model, name, macro, args[i++]));\n    }\n    out = set.apply(null, inputs);\n  } else {\n    out = set(value);\n  }\n  if (!out) return;\n\n  for (i = 0, len = out.length; i < len; i++) {\n    value = out[i];\n    arg = args[i + numInputs];\n    if (~arg.indexOf('(')) {\n      setBoundFn(view, ctx, model, arg, value);\n      continue;\n    }\n    if (value === void 0 || notPathArg.test(arg)) continue;\n    path = ctxPath(ctx, arg);\n    if (model.get(path) === value) continue;\n    model.set(path, value);\n  }\n}\n\n//@ sourceURL=/node_modules/derby/lib/viewPath.js"
));

require.define("/node_modules/derby/lib/refresh.js", Function(
    [ 'require', 'module', 'exports', '__dirname', '__filename' ],
    "exports.errorHtml = errorHtml;\nexports.autoRefresh = autoRefresh;\n\nvar errors = {};\n\nfunction errorHtml(errors) {\n  var text = ''\n    , type, err;\n  for (type in errors) {\n    err = errors[type];\n    text += '<h3>' + type + ' Error</h3><pre>' + err + '</pre>';\n  }\n  if (!text) return;\n  return '<div id=$_derbyError style=\"position:absolute;background:rgba(0,0,0,.7);top:0;left:0;right:0;bottom:0;text-align:center\">' +\n    '<div style=\"background:#fff;padding:20px 40px;margin:60px;display:inline-block;text-align:left\">' +\n    text + '</div></div>';\n}\n\nfunction autoRefresh(view, model, appHash) {\n  var socket = model.socket;\n\n  model.on('connectionStatus', function(connected, canConnect) {\n    if (!canConnect) window.location.reload(true);\n  });\n  socket.on('connect', function() {\n    socket.emit('derbyClient', appHash, function(reload) {\n      if (reload) window.location.reload(true);\n    });\n  });\n\n  socket.on('refreshCss', function(err, css) {\n    var el = document.getElementById('$_css');\n    if (el) el.innerHTML = css;\n    updateError('CSS', err);\n  });\n\n  socket.on('refreshHtml', function(err, templates, instances) {\n    view.clear();\n    view._makeAll(templates, instances);\n    try {\n      view.history.refresh();\n    } catch (_err) {\n      err || (err = _err.stack);\n    }\n    updateError('Template', err);\n  });\n}\n\nfunction updateError(type, err) {\n  if (err) {\n    errors[type] = err;\n  } else {\n    delete errors[type];\n  }\n  var el = document.getElementById('$_derbyError')\n    , html = errorHtml(errors)\n    , fragment, range;\n  if (html) {\n    if (el) {\n      el.outerHTML = html;\n    } else {\n      range = document.createRange();\n      range.selectNode(document.body);\n      fragment = range.createContextualFragment(html);\n      document.body.appendChild(fragment);\n    }\n  } else {\n    if (el) el.parentNode.removeChild(el);\n  }\n}\n\n//@ sourceURL=/node_modules/derby/lib/refresh.js"
));
;(function() {
  require('./index.js').view._makeAll(
    {
  "podzim/index.html:title": "{{roomName}} - {_room.visits} visits",
  "podzim/index.html:header": "<app:alert>",
  "podzim/index.html:body": "<h1>{_room.welcome}</h1><p><label>Welcome message: <input value=\"{_room.welcome}\"></label></p><p>This page has been visted {_room.visits} times. <app:timer></p><p>Let's go <a href=\"/{{randomUrl}}\">somewhere random</a>.</p>",
  "podzim/index.html:timer": "{#if _stopped}<a x-bind=\"click:start\">Start timer</a>{else}You have been here for {_timer} seconds. <a x-bind=\"click:stop\">Stop</a>{/}",
  "podzim/index.html:alert": "<div id=\"alert\">{#unless connected}<p>{#if canConnect}Offline {#if _showReconnect}&ndash; <a x-bind=\"click:connect\">Reconnect</a>{/}{else}Unable to reconnect &ndash; <a x-bind=\"click:reload\">Reload</a>{/}</p>{/}</div>"
}, {
  "undefined": [
    "podzim/index.html:undefined",
    null
  ],
  "title": [
    "podzim/index.html:title",
    {}
  ],
  "header": [
    "podzim/index.html:header",
    {}
  ],
  "body": [
    "podzim/index.html:body",
    {}
  ],
  "timer": [
    "podzim/index.html:timer",
    {}
  ],
  "alert": [
    "podzim/index.html:alert",
    {}
  ]
}
  );
})();