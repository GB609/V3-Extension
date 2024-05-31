console.debug(`Running V3_Extension version [${GM.info.script.version}] in`, window.location, 'at document state', document.readyState);
var isTop = window.self == window.top;
console.log("is frame:", !isTop);

var OPTIONS = {};

// #include classes/scriptManager

(function() {

  function generateResList() {
    function remapArray(source){
      let result = {};
      source.forEach(entry => { result[entry.name] = entry; });
      return result;
    }
    
    var meta = GM_info;
    var resList = meta.script.resources;
    //compat with violentmonkey
    if(Array.isArray(resList)){
      resList = remapArray(resList);
    }
    
    // for compatibility with USI
    if (!resList) {
      resList = remapArray(meta.script.resources_data);
    }

    return resList;
  }

  var RESOURCES = generateResList();

  var location = window.location;

  function handleSync() {

  }

  async function loadActiveScriptsForCurrentWindow() {
    var activeScripts = ScriptManager.getForLocation(location.href);
    var loadedRequires = {};
    for(const script of activeScripts) {
      try {
        for(const req of script.requires) {
          if (typeof RESOURCES[req] != "undefined" && loadedRequires[req] != true) {
            loadedRequires[req] = true;
            let dep = new Script(req, req);
            await dep.load();
          }
        }

        await script.load();
        if (typeof script.content.run == "function") {
          script.content.run(true);
        } else {
          script.content.execute();
        }
      } catch (e) {
        LOGGER.error(e);
      }
    }
  }

  async function createOptionLink(script) {
    if (!script.loaded) {
      await script.load();
    }

    if (script.content && script.content.getOptions() !== false) {
      var link = DOM.a({
        href: 'javascript:;'
      }).addText(script.name);
      link.addEventListener('click', function() {
        var opts = script.content.getOptions();
        var target = null;
        if (typeof window.top.frames.main !== "undefined") {
          target = window.top.frames.main.document.body;
          Element.prototype.wipe.call(target);
          target.appendChild(DOM.div({
            style: {
              display: 'inline-block',
              width: '80%',
              margin: '0 10%',
              boxSizing: 'border-box'
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
        saveButton.addEventListener('click', function() {
          opts.save();
        });
        target.appendChild(saveButton);
      });

      return link;
    }

    return script.name;
  }

  async function addPluginOptions() {
    var targetDiv = DOM.div({
      "style": "font-size:12px; margin-top:10px;"
    });

    targetDiv.add(DOM.b().addText("Aktive V3 Erweiterungen:")).br();

    let all = ScriptManager.getAll();
    for(sname of Object.keys(all)){
      let val = all[sname];
      var optionLink = await createOptionLink(val);
      var check = checkOption(ScriptManager.KEY_DISABLED + '.' + sname, optionLink);
      check.firstChild.addEventListener('change', function() {
        LOGGER.info(sname + "an-/ausgeschaltet - loesche SM Cache");
        CACHE.clear(ScriptManager.KEY_LOCATION_MATCH);
      });

      targetDiv.add(check).br();
    }

    document.body.add(targetDiv);
  }

  async function startup() {
    console.log("checking location:", location);
    if (location.pathname == "/index.php" 
      || location.pathname == "/") {
      await ScriptManager.init(RESOURCES);
    }
    
    try {
      handleSync();
      await loadActiveScriptsForCurrentWindow();
      if (location.href.endsWith("sonstigesnavi.php")) {
        addPluginOptions();
      }
    } catch (e) {
      LOGGER.error(e);
    }
  }
  
  startup();
})();