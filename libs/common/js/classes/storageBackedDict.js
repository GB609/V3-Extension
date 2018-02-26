function StorageBackedDict(aStorage, aPrefix = "") {
  var _values = {};
  this.storage = aStorage;
  var _prefix = aPrefix;
  
  function recursiveGet(aKeys, container, aDefault) {
    if(aKeys.length == 0){
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
  
  function analyseKeys(keyString){
  	var splitted = prefixedKey(keyString, true);
  	return {
  		full : [...splitted],
  		first : splitted[0],
  		lastOnly : splitted.pop(),
  		woLast : [...splitted]
  	};
  }

  function prefixedKey(original, asArray = false){
    let key = (_prefix.length > 0 && !original.startsWith(_prefix)) ? _prefix+ "." + original : original;
    return asArray ? key.split(".") : key;
  }
  /**
   * get the given key
   */
  this.get = function(key, aDefault) {
    if (typeof key === "undefined") {
      throw 'key is undefined';
    }

    var keys = (key instanceof Array) ? {first:key[0], full:key} : analyseKeys(key, true);
    key = keys.first;

    if (!_values[key] || (JSON.stringify(_values[key]) != this.storage.getItem(key))) {
      _values[key] = JSON.parse(this.storage.getItem(key), classDeserializer) || null;
    }

    return recursiveGet(keys.full, _values, aDefault);
  };

  this.startTx = function(key){
    this.txKey = prefixedKey(key);
  };
  
  this.endTx = function(){
    if(this.txKey){
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
    
    var keys = analyseKeys(key, true);
    this.get(keys.woLast, {})[keys.lastOnly] = value;

    if(!this.txKey){
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
    if(this.storage.getItem(key) != toSave){
    	this.storage.setItem(key, toSave);
    } else {
    	console.log(window.location.pathname, "avoided redundant call to storage.setItem");
    }
  };
  
  this.clear = function(key){
  	var keys = this.wipeCached(key);

  	if(keys == null){
  		this.storage.clear();
  		return;
  	}

    //only persist existing object if it was a sub-value that has been deleted
    if(keys.first != keys.lastOnly){
    	this.persist(keys.first);
    } else {
    	this.storage.removeItem(keys.first);
    }
  };
  
  this.wipeCached = function(key){
  	if(typeof key == "undefined" && _prefix.length == 0){
 			_values = {};
 			return null;
  	}
  	
  	key = analyseKeys(key || _prefix);
    this.get(key.full, {}); //update to prevent deletion of more than necessary in large dicts
    delete recursiveGet(key.woLast, _values, _values)[key.lastOnly];
    return key;
  };
}