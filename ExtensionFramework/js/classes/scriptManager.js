var BASE_URL = "http://wolficotl.bplaced.net/v3/";
/**
 * @typedef {Object} Script
 */
class Script extends Serializable {
	constructor(aResName, aName) {
		super();
	  this.resName = aResName;
	  this.name = aName;
	  this.includeList = [];
	  this.excludeList = [];
	  this.requires = [];
	  this.enabled = false;
	  this.loaded = false;
	}
	
	addInclude(aInclude) {
	  this.includeList.push(aInclude);
	}

	includes(aUrl){
		if (this.includeList.length > 0) {
	    return new RegExp(this.includeList.join('|')).test(aUrl);
	  }
	  return false;
	}
	
	addExclude(aExclude) {
	  this.excludeList.push(aExclude);
	}
	
	excludes(aUrl) {
	  if (this.excludeList.length > 0) {
	    return new RegExp(this.excludeList.join('|')).test(aUrl);
	  }
	  return false;
	}
	
	addRequire(aRequire) {
	  this.requires.push(aRequire);
	}
	
	load(scriptText) {
	  var code;
	  if (typeof scriptText === "undefined") {
	    code = GM_getResourceText(this.resName);
	  } else {
	    code = scriptText;
	  }
	
	  try {
  	 Object.defineProperty(this, 'content', {
        value: eval.call(null, code),
        enumerable:false        
      });
	    this.loaded = true;
	  } catch (e) {
	    LOGGER.error(e);
	  }
	}
	unLoad() {
	  delete this.content;
	}
	
	toString() {
	  return this.name;
	}
	
	static parse(resName, text) {
	  function handleWildcards(pattern) {
	    if (!pattern.startsWith('/')) {
	      // convert wildcard mode * to regexp variant .*
	      pattern = pattern.replace(/\*/g, '.*');
	    }
	    return pattern;
	  }
	
	  let INCLUDE_PATTERN = /@include\s+(\S+)/;
	  let EXCLUDE_PATTERN = /@exclude\s+(\S+)/;
	  let REQUIRE_PATTERN = /@require\s+(\S+)/;
	  var name = /@name\s+(\S+)/.exec(text)[1];
	  var script = new Script(resName, name);
	
	  var lines = text.split('\n');
	  for(var i = 0; i < lines.length; i++) {
	    let line = lines[i].trim();
	    if (line.search("==/UserScript==") >= 0) {
	      break;
	    }
	
	    let matched = INCLUDE_PATTERN.exec(line);
	    if (matched != null) {
	      script.addInclude(handleWildcards(matched[1]));
	      continue;
	    }
	
	    matched = EXCLUDE_PATTERN.exec(line);
	    if (matched != null) {
	      script.addExclude(handleWildcards(matched[1]));
	      continue;
	    }
	
	    matched = REQUIRE_PATTERN.exec(line);
	    if (matched != null) {
				var resName = matched[1].replace(new RegExp("../|"+BASE_URL), '');
			  resName = resName.substring(0, resName.lastIndexOf('.'));
	      script.addRequire(resName.replace('/', '_'));
	    }
	  }
	
	  return script;
	}
}

var ScriptManager;
(function() {

  function _ScriptManager() {
    this.KEY_SCRIPT_STORE = "SM.SCRIPTS";
    this.KEY_DISABLED = "SM.ENABLED_SCRIPTS";
    var SCRIPTS_ENABLED_STATE = CFG.get(this.KEY_DISABLED, {});

    var _scripts = CACHE.get(this.KEY_SCRIPT_STORE, {});

    /**
		 * load the scripts from the given resource list
		 * 
		 * @param {scriptResName :
		 *          {scriptResName, mimetype, url}} resourceList the list
		 */
    this.init = function(resourceList) {
      for(name in resourceList) {
        if (!name.startsWith("plugin")) {
          continue;
        }

        try {
          var script = Script.parse(name, GM_getResourceText(name));
          script.enabled = SCRIPTS_ENABLED_STATE[script.name] || false;
          _scripts[script.name] = script;
        } catch (e) {
          LOGGER.error(e);
        }
      }

      CACHE.set(this.KEY_SCRIPT_STORE, _scripts);
    };

    /**
		 * only returns active scripts matching the given url as per include/exclude
		 * rule defined in the plugin script
		 */
    this.getForLocation = function(aUrl) {
      var allMatched = CACHE.get("SM.LocationMatched", {});
      
      if(!(allMatched[aUrl] instanceof Array)){
      	var matched = [];
	      _scripts.forEach(function(sname, script) {
	        if (!script.enabled) {
	          return;
	        }
	        // excludes first
	        if (script.excludes(aUrl)) {
	          return;
	        }
	        if (script.includes(aUrl)) {
	          matched.push(script.name);
	        }
	      });
	      allMatched[aUrl] = matched;
	      CACHE.set("SM.LocationMatched", allMatched);
      }
      
      var matchedScripts = [];
      allMatched[aUrl].forEach(function(val, idx){
      	matchedScripts.push(_scripts[val]);
      });
      return matchedScripts;
    };

    this.getAll = function() {
      return _scripts;
    };
  };

  ScriptManager = new _ScriptManager();

})();