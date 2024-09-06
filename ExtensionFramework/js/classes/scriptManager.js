var BASE_URL = "http://wolficotl.bplaced.net/v3/";
unsafeWindow.PLUGIN_PREFIX = '';
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
	
	async load(scriptText) {
	  var code;
	  if (typeof scriptText === "undefined") {
	    code = await GM_getResourceText(this.resName);
	  } else {
	    code = scriptText;
	  }
	
    unsafeWindow.PLUGIN_PREFIX = this.name || '';
    code += "\n//# sourceURL="+this.name+'.js'
	
	  try {
  	 Object.defineProperty(this, 'content', {
        value: eval(code),
        enumerable:false        
      });
	    this.loaded = true;
	  } catch (e) {
	 	console.error(e);
	    console.log("PROBLEM at", this.name, this.code || scriptText);
	    LOGGER.error(e);
	  } finally {
      unsafeWindow.PLUGIN_PREFIX = '';
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
	  //let LIB_PATTERN =     /@resource\s+(libs_\S+)/;
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
window.Script = Script;

var ScriptManager;
(function() {

  function _ScriptManager() {
    this.KEY_SCRIPT_STORE = "SM.SCRIPTS";
    this.KEY_DISABLED = "SM.ENABLED_SCRIPTS";
    this.KEY_LOCATION_MATCH = "SM.LocationMatched";
    var SCRIPTS_ENABLED_STATE = CFG.get(this.KEY_DISABLED, {});

    var _scripts = CACHE.get(this.KEY_SCRIPT_STORE, {});

    /**
		 * load the scripts from the given resource list
		 * 
		 * @param {scriptResName :
		 *          {scriptResName, mimetype, url}} resourceList the list
		 */
    this.init = async function(resourceList) {
      for(name in resourceList) {
        if (!name.startsWith("plugin")) {
          continue;
        }

        try {
          let content = await GM.getResourceText(name);
          console.log("try to parse", name);
          let script = Script.parse(name, content);
          script.enabled = SCRIPTS_ENABLED_STATE[script.name] || false;
          _scripts[script.name] = script;
        } catch (e) {
          LOGGER.error("error parsing script: ", name, e);
        }
      }

      CACHE.set(this.KEY_SCRIPT_STORE, _scripts);
    };

    /**
		 * only returns active scripts matching the given url as per include/exclude
		 * rule defined in the plugin script
		 */
    this.getForLocation = function(aUrl) {
      let url = new URL(aUrl);
      let cacheKey = this.KEY_LOCATION_MATCH + "." + `${url.pathname}${url.search}`.replace('.', '_');
      
      let matched = CACHE.get(cacheKey, null);
           
      if(!Array.isArray(matched)){
        aUrl = url.href;
      	matched = [];
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
	      CACHE.set(cacheKey, matched);
      }
      
      var matchedScripts = [];
      matched.forEach(function(val, idx){
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
