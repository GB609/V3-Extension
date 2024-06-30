function listener(aTarget, aType, aFunc){ return {target:aTarget, type:aType, listener:aFunc}; }
class Plugin {
	constructor(pName, hooks = {}){ 
		this.name = pName;
		Object.assign(this, hooks);
	}
	execute(){ throw 'not implemented';	}
	getOptions(){ return (typeof this.options != "undefined") ? this.options : false;}

	registerEventListener(){
		if(!this.eventListener) return false;
		
		this.eventListener.forEach(function(config){
			var target = (typeof config.target === 'string') ? DOM.byId(config.target) : config.target;
			if(target != null) target.addEventListener(config.type, config.listener);
		});
	}
	
	postListener(){}
	
	run(forceExecution = false){
    // firefox - scratchpad, use the passed in name for debugging
    if (typeof GM_info === "undefined") {
      GM_info = {
        "script" : {
          "name" : name
        }
      };
    }

    if (GM_info.script.name == this.name || forceExecution) {
      // it's running standalone
      try {
        unsafeWindow.PLUGIN_PREFIX = this.name;
        this.execute();
        this.registerEventListener();
        this.postListener();
        
        return true;
      } catch (e) {
        console.log('Fehler beim ausfuehren von:', this.name, e);
      } finally {
        unsafeWindow.PLUGIN_PREFIX = '';
      }
    } else {
      return this;
    }
  
	}
}