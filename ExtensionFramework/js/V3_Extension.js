var isTop = window.self == window.top;
console.info(`Running V3_Extension version [${GM.info.script.version}] in ${isTop ? 'TOP' : 'FRAME'}[state=${document.readyState}]:`, window.location);

var OPTIONS = {};

// #include classes/scriptManager

(function() {

  function generateResList() {
    function remapArray(source) {
      let result = {};
      source.forEach(entry => { result[entry.name] = entry; });
      return result;
    }

    var meta = GM_info;
    var resList = meta.script.resources;
    //compat with violentmonkey
    if (Array.isArray(resList)) {
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
    //FIXME: loadedRequires muss auch mit den @require von top-level V3_Extension abgeglichen werden
    //siehe logger und common, sonst doppelt geladen
    //eventuell durch check auf resources abgefrühstückt
    var loadedRequires = {};
    for (const script of activeScripts) {
      try {
        for (const req of script.requires) {
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

        target.add(opts);
        var saveButton = DOM.button().addText("Speichern");
        saveButton.addEventListener('click', function() {
          opts.save();
        });
        target.add(saveButton);
      });

      return link;
    }

    return script.name;
  }

  async function addPluginOptions() {
    function cleanCacheOnChange(sname) {
      LOGGER.info(sname + " an-/ausgeschaltet - loesche SM Cache");
      CACHE.clear(ScriptManager.KEY_LOCATION_MATCH);
    }

    let all = ScriptManager.getAll();
    let group = OptionGroup(ScriptManager.KEY_DISABLED, "Aktive V3 Erweiterungen:");
    group.add(new Style("label{display:block;} h3{margin:5px 0;}"));
    for (sname of Object.keys(all)) {
      let val = all[sname];
      let optionLink = await createOptionLink(val);
      group.add(CheckOption(sname, optionLink)
        .autoUpdate(true)
        .onChange(cleanCacheOnChange.bind(null, sname))
      );
    }

    document.body.add(group);
    document.body.insertBefore(document.body.lastChild, document.body.firstChild);
  }

  async function startup() {
    LOGGER.debug("checking location:", location);
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

window.listStorage = function(key, dict = window.localStorage) {
  var KEY_SYM = Symbol.for("KEY");

  if (typeof key == "string") {
    let resultObjs = window.listStorage(key.split('.'));
    resultObjs.forEach(targetObj => {
      Object.keys(targetObj).forEach(k => {
        console.log(`${targetObj[KEY_SYM]}.${k}`, ":", targetObj[k]);
      });
    });
    return;
  }

  let parts = key;
  if(key.length == 0){
      return [];
  }
  let current = parts.shift();
  if (typeof dict[current] != "undefined") {
    let nextDict = dict == window.localStorage ? JSON.parse(dict[current]) : dict[current];
    if (parts.length == 0) {
      let found = nextDict;
      found[KEY_SYM] = current;
      return [found];
    } else {
      let resultObjs = window.listStorage(parts, nextDict);

      resultObjs.forEach(res => {
        res[KEY_SYM] = current + '.' + res[KEY_SYM];
      });
      return resultObjs;
    }
  } else {
    let result = [];
    Object.keys(dict).forEach(k => {
      if (k.startsWith(current)) {
        result = result.concat(window.listStorage([k, ...parts], dict));
      }
    });
    return result;
  }
}