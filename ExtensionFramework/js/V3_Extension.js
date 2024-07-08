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

  async function createOptionElement(script, details = false) {
    if (!script.loaded) { await script.load(); }

    if (typeof script.content == "undefined") {
      return script.name;
    }

    let options = script.content.getOptions();
    if (!(options instanceof OptionGroup)) {
      return script.content.title || script.name;
    }

    if (details) {
      let opts = options.showButtons().htmlProxy();

      Object.assign(opts.style, {
        display: 'inline-block',
        width: '80%',
        margin: '0 10%',
        boxSizing: 'border-box'
      });

      return opts;
    }

    var link = DOM.a({
      href: 'javascript:;'
    }).addText(script.content.title || script.name);
    link.addEventListener('click', function() {
      //#parameter übergeben
      if (typeof window.top.frames.main == "undefined") {
        //FIXME: Wird nicht tun, MessageWindow ist Teil von Transport-Vorschau 
        popup = new MessageWindow("60%", 'center');
        popup.closeOnHide = true;
        popup.show();
        //TODO: MessageWindow Frame zu "main" umbenennen
        //TODO: MessageWindow zu Widgets migrieren
      }

      let newUrl = 'sonstigesnavi.php#extOpt=' + script.name;
      let targetFrame = window.top.frames.main;
      let isInOptionsAlready = targetFrame.location.href.includes('sonstigesnavi.php#extOpt=');
      targetFrame.location = newUrl;
      if (isInOptionsAlready) {
        targetFrame.location.reload();
      }

    });

    return link;
  }

  async function addPluginOptions() {
  function cleanCacheOnChange(sname) {
    LOGGER.info(sname + " an-/ausgeschaltet - loesche SM Cache");
    CACHE.clear(ScriptManager.KEY_LOCATION_MATCH);
  }

  let genericOptions = {
    loaded: true, name: 'Allgemein',
    content: {
      alwaysActive: true,
      getOptions: function getOptions() {
        return OptionGroup('', '',
          LOGGER.OPTIONS
        )
      }
    }
  };

  let urlParam = window.location.href.split('#extOpt=');
  let all = Object.assign({ Allgemein: genericOptions }, ScriptManager.getAll());

  let addition;

  if (urlParam.length > 1) {
    document.body.wipe();
    addition = await createOptionElement(all[urlParam[1]], true);

  } else {
    let group = OptionGroup(ScriptManager.KEY_DISABLED, "Aktive V3 Erweiterungen:");
    group.childPanel.className = "naviPanel";
    group.add(new Style()
      .ruleFor(CheckOption, 'display:block;')
      .ruleFor(CheckOption, ' *[disabled]', 'visibility:hidden;')
      .ruleFor(CheckOption, ':hover', 'cursor:pointer;')
      .ruleFor(DOM.h3, 'margin:5px 0;'));

    for (sname of Object.keys(all)) {
      let val = all[sname];
      let optionLink = await createOptionElement(val);
      let opt = CheckOption(sname, optionLink)
        .autoUpdate(true)
        .onChange(cleanCacheOnChange.bind(null, sname))
        .attributes({ disabled: val.content.alwaysActive === true });
      if(val.content.alwaysActive === true){
        opt.click = optionLink.click;
      }
      group.add(opt);
    }
    addition = group.init();
  }

  document.body.addBefore(document.body.firstChild, addition);
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
    if (location.pathname.startsWith("/sonstigesnavi.php")) {
      addPluginOptions();
    }
  } catch (e) {
    LOGGER.error(e);
  }
}

if (document.readyState == "complete") {
  startup();
} else {
  document.addEventListener("readystatechange", () => {
    if (document.readyState == "complete") {
      startup();
    }
  })
}
}) ();

function listStorage(key, dict = window.localStorage) {
  var KEY_SYM = Symbol.for("KEY");

  if (typeof key == "string") {
    let resultObjs = listStorage(key.split('.'));
    resultObjs.forEach(targetObj => {
      Object.keys(targetObj).forEach(k => {
        console.log(`${targetObj[KEY_SYM]}.${k}`, ":", targetObj[k]);
      });
    });
    return;
  }

  let parts = key;
  if (key.length == 0) {
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
      let resultObjs = listStorage(parts, nextDict);

      resultObjs.forEach(res => {
        res[KEY_SYM] = current + '.' + res[KEY_SYM];
      });
      return resultObjs;
    }
  } else {
    let result = [];
    Object.keys(dict).forEach(k => {
      if (k.startsWith(current)) {
        result = result.concat(listStorage([k, ...parts], dict));
      }
    });
    return result;
  }
}
unsafeWindow.listStorage = listStorage;