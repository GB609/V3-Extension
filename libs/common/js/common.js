//console.log("### STARTING PAGELOAD "+window.location.pathname+" ###");

var V3_URL_S = "https://v3.verbranntezone.ch/";
var V3_URL = "http://v3.verbranntezone.ch/";

// #include enhancements/element

// #include utils/dom

// #include classes/widgets

// #include classes/options

function ajax(url, postData, responseHandler, errorHandler = false) {
  url = new URL(url, window.location);
  var request = new XMLHttpRequest();
  request.withCredentials = true;
  request.callback = responseHandler;
  request.errorCallback = errorHandler;

  if (postData != null) {
    request.open('POST', url, true);
    request.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
  } else {
    request.open('GET', url, true);
  }

  request.onreadystatechange = function() {
    if (this.readyState == 4) {
      if (this.status == 200) {
        this.callback(request.responseText);
      } else if (this.errorCallback) {
        this.errorCallback(this);
      }
    }
  };
  if (postData != null) {
    request.send(encodeURI(postData));
  } else {
    request.send();
  }
}

function getAsDom(url, postData, responseHandler, addPara) {
  try {
    var callback = function(responseText) {
      try {
        var doc = new DOMParser().parseFromString(responseText, 'text/html');
        responseHandler(doc, responseText, addPara);
      } catch (e) {
        console.log(e);
      }
    };

    ajax(url, postData, callback);
  } catch (e) {
    console.log(e);
  }
}

function rounded(val) { return Math.floor(val * 100) / 100; }
function intOrZeroFromElement(element) { return parseInt(element.innerText.trim()) || 0; }
function parseResourceName(aTd) { return aTd.innerText.replace(/\(\d\)/, '').trim(); }

function htmlLinkCollectionToDict(aLinkList) {
  var result = {};
  for (var i = 0; i < aLinkList.length; i++) {
    result[aLinkList[i].innerText] = aLinkList[i];
  }
  return result;
}

function checkOption(storageKey, text, className) {
  var input = DOM.input({
    "type" : "checkbox"
  });
  input.storeKey = storageKey;
  input.checked = CFG.get(storageKey, false);

  input.onchange = function() {
    var newValue = this.checked;
    CFG.set(this.storeKey, newValue);
  };

  if (!className) {
    className = "";
  }
  var span = DOM.span({
    "class" : className
  }).add(input).addText(" ");
  if (typeof text === "string") {
    span.addText(text);
  } else {
    span.add(text);
  }
  return span;
}

function populateDropDown(target, data, transform, defaultOption = false) {
	let elements = data();
	if(target.data == elements) return;
	
	target.wipe();
  if (typeof transform != "function") {
  	var idx = 0;
    transform = function(ele) {
      return {value:idx++, label:ele.toString()};
    };
  }
  if (defaultOption) {
    target.add(DOM.option({
      "value" : null,
      "selected":"selected"
    }).addText(defaultOption));
  }
  elements.forEach(function(val) {
  	let entry = transform(val); 
  	target.add(DOM.option({value:entry.value}).addText(entry.label));
  });
}

function injectCss(targetElement, cssSource) {
  var style = DOM.style({
    "type" : "text/css"
  }).addText(cssSource);
  if (targetElement.firstChild) {
    targetElement.insertBefore(style, targetElement.firstChild);
  } else {
    targetElement.add(style);
  }
}

function toggleVisibility(target) {
  if (target.style.display == "block") {
    target.style.display = "none";
  } else {
    target.style.display = "block";
  }
}

// #include classes/storageBackedDict

/**
 * Config tool
 */
var CFG;
// wrapping construction and type declaration/assignment in an anonymous
// function. Visible for eclipse, but not for the
// browser later.
(function() {

  function _CFG() {
    var coordPattern = /provinz=(\d+\/\d+)/;
    this.SYNCABLE_KEY = "CFG_SYNCABLE";
    this.CURRENT_PROV = null;
    var _syncable = {};

    this.updateCurrentProv = function() {
      if (coordPattern.test(window.location.href)) {
        this.CURRENT_PROV = coordPattern.exec(window.location.href)[1];
      } else {
        this.CURRENT_PROV = null;
      }
    };

    this.markSyncable = function(keyList) {
      _syncable = this.get(this.SYNCABLE_KEY, {});
      keyList.forEach(function(key) {
        _syncable[key] = true;
      });
      this.update(this.SYNCABLE_KEY, _syncable);
    };

    this.getSyncData = function() {
      var result = {};
      _syncable = this.get(this.SYNCABLE_KEY, {});
      for ( var key in _syncable) {
        result[key] = this.get(key);
      }
      return result;
    };

    /**
     * in case the an already stored value has been updated directly (object or array types). Will re-push the value
     * associated with the given key to localStorage
     */
    this.update = function(key) {
      this.persist(key);
    };

  }
  _CFG.prototype = new StorageBackedDict(window.localStorage, "CFG");

  CFG = new _CFG();
  CFG.updateCurrentProv();
})();

var CACHE;
(function(){
  CACHE = new StorageBackedDict(window.localStorage, "CACHE_data");
  if(window.top == window.self){
  	var curSessionCacheKey = "CACHE_sessions."+window.top.location.pathname.replace(".", "")+(new Date().getTime());
  	CFG.set(curSessionCacheKey, 1);
    window.addEventListener("beforeunload", function(event){
      CFG.clear(curSessionCacheKey);
      if(CFG.get("CACHE_sessions", {}).isEmpty()){
        CACHE.clear();
      }
    });
  }

  window.addEventListener("storage", function(event){
    var logEvent = {origin:event.url, target:event.target, key:event.key, newValue:event.newValue};
//    console.log("STORAGE-EVENT", logEvent);
  });
})();

function isLoggedInVZ() {
  return null != document.getElementById("vztime");
}

// #include v3/provinceList

// #include utils/plugin
