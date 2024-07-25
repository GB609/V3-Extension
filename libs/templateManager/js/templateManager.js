window.TEMPLATE = function(){
	return {
    forPlugin : function(prefix){ return Object.assign(Object.create(this), {prefix:prefix}); },
    
	    /*
	   * arg: name ohne prefix
	   */
	  asText : function(tplName) {
	    let templateText = null;
	    let prefix = determinePrefix(this);
	    tplName = "tpl_" + prefix + tplName;
	    try {
	      templateText = GM_getResourceText(tplName);
	      if(typeof templateText === "undefined" || templateText == null){
	        throw "Kein Template mit Namen ["+tplName+"] gefunden";
	      }
	      return templateText;
	    } catch(error){
	      LOGGER.error(error);
	      throw error;
	    }
	  },
	  
	  asDom : function(tplName, containerAttributes){
	    return parseSource(this.asText(tplName), containerAttributes);
	  },
	  
	  inject : function(parentElement, aTemplateName, containerAttributes, nextSibling){
	    this.injectSource(parentElement, this.asText(aTemplateName), containerAttributes, nextSibling);
	  },
	  
	  injectSource : function(parentElement, aSource, containerAttributes, nextSibling){
	    var newDiv = parseSource(aSource, containerAttributes); 
	    this.injectDom(parentElement, newDiv, nextSibling);
	  },
	  
	  /**
	   * inserts dom element subtree and executes contained script tags
	   * @function
	   */
	  injectDom : function(parentElement, elementToInject, nextSibling){
	    if(typeof nextSibling === "undefined" || nextSibling == null){
	      parentElement.appendChild(elementToInject);
	    }
	    parentElement.insertBefore(elementToInject, nextSibling);
	    runScripts(elementToInject);
	  }
	};
	
	function determinePrefix(tplInstance){
    let prefix = tplInstance.prefix || unsafeWindow.PLUGIN_PREFIX || '';
    return prefix.length > 0 ? prefix + '/' : '';
  }
  
  function parseSource(aSource, containerAttributes){
    var newDiv = DOM.div(containerAttributes);
    newDiv.innerHTML = aSource;
    return newDiv;
  }
  
  function runScripts(aScriptContainer){
    var allScriptTags = DOM.byTag("script", aScriptContainer);
    for(var i = 0; i < allScriptTags.length; i++) {
      var scriptCopy = DOM.script({
        "type" : "text/javascript"
      });
      document.head.appendChild(scriptCopy);
      var sText = allScriptTags[i].innerText;
      scriptCopy.innerText = sText;
    }
  }
}();