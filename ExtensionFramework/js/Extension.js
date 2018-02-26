var OPTIONS = {};

// #include classes/scriptManager

(function() {

  function generateResList() {
    var meta = GM_info;
    var resList = meta.script.resources;
    // for compatibility with USI
    if (!resList) {
      resList = {};
      meta.script.resources_data.forEach(function(data) {
        // data = {name, mimetype, url}
        resList[data.name] = data;
      });
    }

    return resList;
  }

  var RESOURCES = generateResList();

  var location = window.location;
  if (location.pathname == "/index.php" || location.pathname == "/") {
  	ScriptManager.init(RESOURCES);
  }

  function handleSync() {

  }

  function loadActiveScriptsForCurrentWindow() {
    var activeScripts = ScriptManager.getForLocation(location.href);
    var loadedRequires = {};
    activeScripts.forEach(function(script) {
      try {
        script.requires.forEach(function(req) {
          if (typeof RESOURCES[req] != "undefined" && loadedRequires[req] != true) {
          	loadedRequires[req] = true;  
            new Script(req, req).load();
          }
        });

        script.load();
        if(typeof script.content.run == "function"){
        	script.content.run(true);
        } else {
        	script.content.execute();
        }
      } catch (e) {
        LOGGER.error(e);
      }
    });
  }

  function createOptionLink(script) {
    if (!script.loaded) {
      script.load();
    }

    if (script.content.getOptions() !== false) {
      var link = DOM.a({
        href : 'javascript:;'
      }).addText(script.name);
      link.addEventListener('click', function() {
        var opts = script.content.getOptions();
        var target = null;
        if (typeof window.top.frames.main !== "undefined") {
          target = window.top.frames.main.document.body;
          Element.prototype.wipe.call(target);
          target.appendChild(DOM.div({
          	style:{
          		display:'inline-block',
          		width:'80%',
          		margin:'0 10%',
          		boxSizing:'border-box'
          	}
          }));
          target = target.firstElementChild;
        } else {
          popup = new MessageWindow("60%", 'center');
          popup.closeOnHide = true;
          popup.openUrl("info.php", false);
          target = popup.frame.document.body;
          Element.prototype.wipe.call(target);
          popup.show();
        }
        
        target.appendChild(opts.getElement());
        var saveButton = DOM.button().addText("Speichern");
        saveButton.addEventListener('click', function(){
        	opts.save();
        });
        target.appendChild(saveButton);
      });

      return link;
    }

    return script.name;
  }

  function addPluginOptions() {
    var targetDiv = DOM.div({
      "style" : "font-size:12px; margin-top:10px;"
    });

    targetDiv.add(DOM.b().addText("Aktive V3 Erweiterungen:")).br();

    ScriptManager.getAll().forEach(function(sname, val){
    	var optionLink = createOptionLink(val);
    	var check = checkOption(ScriptManager.KEY_DISABLED + '.' + sname, optionLink);
    	check.firstChild.addEventListener('change', function(){
    		LOGGER.info(sname + "an-/ausgeschaltet - loesche SM Cache");
    		CACHE.clear("SM");
    	});
    	
    	targetDiv.add(check).br();
    });
    
    document.body.add(targetDiv);
  }

  try {
    handleSync();
    loadActiveScriptsForCurrentWindow();
    if (location.href.endsWith("sonstigesnavi.php")) {
      addPluginOptions();
    }
  } catch (e) {
    LOGGER.error(e);
  }

})();