function StorageBackedDict(aStorage, aPrefix = false) {
  var _values = {};
  this.storage = aStorage;
  if (!aPrefix) {
    throw 'Must provide a prefix for StorageBackedDict';
  }
  var _prefix = aPrefix + ':';

  function recursiveGet(aKeys, container, aDefault) {
    if (aKeys.length == 0) {
      return container;
    }
    var currentKey = aKeys.shift();
    var isObject = typeof container[currentKey] === 'object';
    if (typeof container[currentKey] === 'undefined' || container[currentKey] == null) {
      container[currentKey] = aKeys.length > 0 ? {} : aDefault;
    } else if (!isObject && aKeys.length > 0) {
      throw 'Not an object: ' + currentKey;
    }

    if (aKeys.length > 0) {
      return recursiveGet(aKeys, container[currentKey], aDefault);
    }

    return container[currentKey];
  }

  /**
   * When only prefix is given, find all keys belonging to this dict.
   * Otherwise return EXACTLY the key if there is a value for it.
   * If not, empty
   * 
   * @returns String[]
   */
  function getMatchingFirstLevelKeys(key = _prefix) {
    let firstPath = analyseKeyPath(key).first;
    if (firstPath != _prefix) {
      return typeof _values[firstPath] == "undefined" ? [] : [firstPath];
    }

    let result = [];
    Object.keys(_values).forEach(k => {
      if (k.startsWith(firstPath)) {
        result.push(k);
      }
    });
    return result;
  }

  class KeyPath {
    constructor(arr) {
      this.depth = arr.length;
      this.full = [...arr];
      this.first = arr[0];
      this.lastOnly = arr.pop();
      this.woLast = [...arr];
    }
    
    resolveToDeepestParent(valueDict, {}){
      if(this.depth == 1){
        return valueDict;
      }
      
      return recursiveGet(this.woLast, valueDict, {});
    }
  }

  function analyseKeyPath(key) {
    let keyArray = false;

    switch (key.constructor.name) {
      case "String":
        keyArray = prefixedKey(key, true);
        break;

      case "Array":
        if (key.length > 0) {
          key[0] = prefixedKey(key[0]);
          keyArray = [...key];
        }
        break;
    }

    if (!keyArray) {
      throw "empty key";
    }

    return new KeyPath(keyArray);
  }

  function prefixedKey(original, asArray = false) {
    let key = original.startsWith(_prefix) ? original : _prefix + original;
    return asArray ? key.split(".") : key;
  }
  /**
   * get the given key
   */
  this.get = function(key, aDefault) {
    if (typeof key === "undefined") {
      throw 'key is undefined';
    }

    var keys = analyseKeyPath(key, true);
    key = keys.first;

    if (!_values[key] || (JSON.stringify(_values[key]) != this.storage.getItem(key))) {
      _values[key] = JSON.parse(this.storage.getItem(key), classDeserializer) || null;
    }

    return recursiveGet(keys.full, _values, aDefault);
  };

  this.startTx = function(key) {
    this.txKey = prefixedKey(key);
  };

  this.endTx = function() {
    if (this.txKey) {
      this.persist(this.txKey);
      this.txKey = false;
    }
  };
  /**
   * sets the new value in temp store and pushes to localStorage
   */
  this.set = function(key, value) {
    if ((typeof key != "string") || typeof value === "undefined") {
      throw 'invalid key/value combination to save: [' + key + '=' + value + ']';
    }

    let keys = analyseKeyPath(key, true);
    keys.resolveToDeepestParent(_values, {})[keys.lastOnly] = value;

    if (!this.txKey) {
      this.persist(keys.first);
    }
  };

  /**
   * pushes value to this.storage. Does not break down the key hierarchy into levels with ".".
   * 
   * @param key
   *          the property key
   * @param value
   *          data to push, will search in temp if not given
   */
  this.persist = function(key, value) {
    if (typeof key != "string") {
      throw 'key is undefined';
    }

    key = prefixedKey(key);
    var toSave = value || _values[key];

    if (typeof toSave === "undefined") {
      throw 'no value for key [' + key + ']';
    }

    toSave = JSON.stringify(toSave);
    //ignore non-modifications
    if (this.storage.getItem(key) != toSave) {
      this.storage.setItem(key, toSave);
    } else {
      console.log(window.location.pathname, "avoided redundant call to storage.setItem");
    }
  };

  this.clear = function(key = _prefix) {
    getMatchingFirstLevelKeys(key).forEach(found => {
      let keyPath = this.wipeCached(found);

      //only persist existing object if it was a sub-value that has been deleted
      if (keyPath.first != keyPath.lastOnly) {
        this.persist(keyPath.first);
      } else {
        this.storage.removeItem(keyPath.first);
      }
    });
  };

  this.wipeCached = function(key = _prefix) {
    if (key == _prefix) {
      getMatchingFirstLevelKeys(key).forEach(found => {
        delete _values[found];
      });
      return null;
    }

    let keyPath = analyseKeyPath(key);
    this.get(keyPath.full, {}); //update to prevent deletion of more than necessary in large dicts
    delete keyPath.resolveToDeepestParent(_values, _values)[keyPath.lastOnly];
    return keyPath;
  };
}