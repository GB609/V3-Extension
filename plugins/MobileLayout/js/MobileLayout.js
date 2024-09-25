(function(TEMPLATE) {

  var HOOKS = this;
  var OPTIONS = OptionGroup('UI', 'Optionen: UI Anpassungen',
    TEMPLATE.asDom('pluginDesc'),
    new Style()
      .ruleFor(OptionGroup, ' .optionGroup', `
        border: 2px dotted lightgrey;
        border-radius: 5px;
        padding:5px; margin:5px 0px;`)
      .ruleFor(DOM.h4, "margin-top:5px")
      .ruleFor(CheckOption, "display: block"),

    OptionGroup('PROV', false,
      DOM.h4().add('In Provinzen'),
      new BorderedGroup('Navigation')
        .add(RadioSelectionOption("shortLinkTable", "Minilink-Tabelle", [
          Entry('', 'icons', 'Bilder verwenden', true),
          Entry('', 'enlargeLinks', 'Links vergrößern'),
          Entry('', 'no-mods', 'unberührt lassen'),
          Entry('', 'hide', 'ausblenden')]))
        .add(CheckOption('linksAsButtons', 'Menüeinträge mit Rahmen und vergößertem Klickbereich anzeigen', true)),
      //new BorderedGroup('Ansicht'),
      new BorderedGroup('Baumenü')
        .add(CheckOption('hideUnavailable', 'Unbaubares ausblenden (Uniques, Küste/Land, betrifft NICHT fehlendes Material)', true))
        .add(CheckOption('categoryAsFilter', 'Kategorie-Links in Filter umwandeln'), true)
    ),
    OptionGroup('TABLES', false,
      DOM.h4().add('Tabellen allgemein'),
      CheckOption('stickyHeaders', 'Tabellenüberschriften beim Scrollen sichtbar halten', true),
      CheckOption('markFilter', 'Eingestellte Filter bei vor/zurück Navigation merken', false).attributes({ disabled: true }),
      CheckOption('enlargeLinks', 'Links vergrößern', false).attributes({ disabled: true }),
      CheckOption('entryNameAsLink', 'Info-Tabellen: Link/ID spalten ausblenden. Eigentliche Bezeichnung (i.d.R. 3. Spalte) wird zu Link.', false).attributes({ disabled: true })
    ),
    OptionGroup('MOBILE', false,
      DOM.h4().add('Speziell für kleine Bildschirme/Smartphones'),
      CheckOption('settings', 'Navigation: Zivile Einstellungen mit DropDowns und Schiebereglern modernisieren', true),
      CheckOption('hideVSColumns', 'Vorschau: Mittlere Spalten ausblenden (und zusammenfassen). Ergänzt auch einen Button zum ausklappen.', false).attributes({ disabled: true }),
      CheckOption('build_squashTable', 'Baumenü: Bestimmte Spalten zusammenfassen zur Reduktion der Breite', false).attributes({ disabled: true })
    )
  )

  var curLoc = window.location.pathname.replace(/\//, '').toLowerCase();
  var curLocId = curLoc.replace(".", "_");
  this.stylesheet = new Style();

  //  this.provinz_php = function() {
  //
  //  },

  this.bauen_php = function() {
    this.stylesheet.addRule(
      `body > :nth-child(1 of table){
        background-color:black;
        position:sticky; top:0;
      }
      body > :nth-child(1 of table) * {
        display: inline-block;
        margin: 1px;
      }`
    );

    let quickTable = document.body.querySelector("body > :nth-child(1 of table)");
    quickTable.id = "build.cat.filter";
    let buildTable = document.body.querySelector("body > :nth-child(2 of table)");
    buildTable.id = "build.listing";

    if (OPTIONS.PROV.hideUnavailable == true) {
      let toggleStyle = new Style(".hideUnavailable{ display: none; }").htmlProxy();
      document.body.add(toggleStyle);

      quickTable.add(
        DOM.tr().add(
          DOM.td().add(new LabeledCheckbox('Unbaubares temporär anzeigen', {
            id: 'toggleFilter',
            onchange: function() {
              if (this.widget.value)
                toggleStyle.textContent = ""
              else
                toggleStyle.textContent = ".hideUnavailable{ display: none; }"
            }
          }))
        )
      )

      let disabled = document.querySelectorAll("font[color='red']");
      for (let d of disabled) {
        while (d.nodeName.toLowerCase() != "tr") {
          d = d.parentElement
        }
        d.className = "hideUnavailable";
      }
    }

    if (OPTIONS.PROV.categoryAsFilter == true) {
      let sections = buildTable.querySelectorAll("a:not([href])");
      for (let d of sections) {
        let link = d;
        while (d.nodeName.toLowerCase() != "tr") {
          d = d.parentElement
        }
        d.id = "section." + link.name;
        d.link = link;
      }

      let tbody = { link: null };
      for (let r of Array.from(buildTable.rows)) {
        if (typeof r.link != "undefined" && r.link != tbody.link) {
          tbody = DOM.tbody({ link: r.link, id: 'tbody.' + r.link.name });
          buildTable.add(tbody);
        }
        tbody.add(r);
      }

      let filter = quickTable.querySelectorAll('a[href]');
      quickTable.rows[1].parentElement.addBefore(quickTable.rows[1], DOM.tr().add(
        DOM.td({ class: 'inboxhleft', bgcolor: '#232323' }).add(DOM.a({ href: '#', isFilter: true }).addText('Alle'))
      ));
      for (let f of filter) { f.href = "#"; f.isFilter = true; }
      let filterStyle = new Style().insertInto(document.body).htmlProxy();
      quickTable.addEventListener('click', (evt) => {
        if (!evt.target.isFilter)
          return;

        let clicked = evt.target.innerText;
        if (clicked == "Alle")
          filterStyle.textContent = "";
        else
          filterStyle.textContent = `tbody[id^="tbody"]:not([id$="${clicked}"]) {display: none;}`
      });
    }
  }

  this.einstellungen_php = function() {
    if (OPTIONS.MOBILE.settings != true) {
      return;
    }

    let template = TEMPLATE.asText(curLocId);

    let existingForm = DOM.byTag("form")[0];
    let inputs = DOM.byTag("input", existingForm);
    let replacements = {};
    for (let i = 0; i < inputs.length; i++) {
      let input = inputs[i];
      let inputVarName;
      let inputValue = '';
      switch (input.type) {
        case "radio":
          inputVarName = input.name + input.value;
          inputValue = input.checked ? 'selected="selected"' : '';
          break;

        case "checkbox":
          inputVarName = input.name;
          inputValue = input.checked ? 'checked="checked"' : '';
          break;

        case "text":
        case "number":
          inputVarName = input.name;
          inputValue = input.value;
          break;

        default:
          continue;
      }

      replacements[inputVarName] = inputValue;
    }
    let replaced = TEMPLATE.replaceVars(replacements, template);
    let targetElement = existingForm.parentElement;
    targetElement.removeChild(existingForm);
    TEMPLATE.injectSource(targetElement, replaced);
  };

  this.open_php = function() {
    switch (OPTIONS.PROV.shortLinkTable.valueOf()) {
      case 'icons':
        this.stylesheet.addRule(TEMPLATE.asText('shortLinkIcons.css'));
      case 'enlargeLinks':
        this.stylesheet.addRule(`
          table.shortlinkborder td{
            padding:0px !important;
          }
          
          table.shortlinkborder a{
            display:inline-block;
            width:30px !important;
            height:30px !important;
            margin:0px !important;
            font-size: 1.5em !important;
          }`
        );
        break;

      case 'hide':
        this.stylesheet.addRule("table.shortlinkborder{display: none !important;}");
        break;

      //no default on purpose - do nothing if not specified
    }

    if(OPTIONS.PROV.linksAsButtons == true){
      this.stylesheet.addRule(TEMPLATE.asText('naviFrame.css'));
    }
  }

  var LINK_TITLE_PATTERN = /.*#title=(.*)$/;
  var TITLE_EXTRACTORS = {
    DIV: ()=>{ let x = document.querySelector("div.title"); return x == null ? "" : x.innerText; },
    LINK: ()=>{ return decodeURI((LINK_TITLE_PATTERN.exec(location.href) || [])[1] || ""); },
    DIV_LINK_FB: ()=>{ let x = TITLE_EXTRACTORS.DIV(); return x.isEmpty() ? TITLE_EXTRACTORS.LINK() : x; },
    "handelsinfo.php": ()=>{ return TITLE_EXTRACTORS.LINK() + " - " + TITLE_EXTRACTORS.DIV(); }
  }
  function adjustPage() {
    //document.head.add(DOM.meta({ name: "viewport", content: "width=device-width, height=device-height" }));
    for (let i = 0; i < window.frames.length; i++) {
      let frameEle = window.frames[i].frameElement;
      frameEle.parentElement.setAttribute("id", "frameDiv_" + frameEle.getAttribute("name"));
    }
    
    let newTitle = document.title;
    let path = location.pathname.substr(1) || "index.php";
    
    if(typeof TITLE_EXTRACTORS[path] == "function"){ newTitle = TITLE_EXTRACTORS[path](); }
    else { newTitle = TITLE_EXTRACTORS.DIV_LINK_FB(); }
    if(path != "index.php" && newTitle.isEmpty()) { newTitle = path;}
    
    if(CFG.CURRENT_PROV != null){ newTitle = CFG.CURRENT_PROV + " - " + (newTitle || document.title); }
    document.title = newTitle || document.title;

    if (OPTIONS.TABLES.stickyHeaders == true) {
      HOOKS.stylesheet.ruleFor(DOM.thead, ', table[id] > tbody:nth-child(1) :nth-child(1 of tr)', 'position:sticky; top:0; background-color:black;');
    }

    if (HOOKS[curLocId]) { HOOKS[curLocId](); }

    document.head.add(HOOKS.stylesheet);
    if (LOGGER.OPTIONS.debug != true) { delete HOOKS.stylesheet; }
  }

  function addTitleToLink(evt){
    let a = evt.target;
    if(a instanceof HTMLAnchorElement && !a.href.includes('#title=') && !a.href.includes('index.php')){
      let js = /^javascript:\w+\(.(\w+\.php.*?).\)$/;
      if(js.test(a.href)){
        let url = js.exec(a.href)[1];
        let newUrl = url + '#title=' + encodeURI(a.innerText);
        a.href = a.href.replace(url, newUrl);
      } else { a.href += '#title=' + encodeURI(a.innerText); }            
    }
  }

  let plugin_Mobile = new V3Plugin('${artifactId}', {
    title: 'UI Anpassungen',
    options: OPTIONS,
    //eventListener: [listener(document.body, 'mousedown', addTitleToLink)],
    execute: adjustPage
  });
  return plugin_Mobile.run();
}).call({}, TEMPLATE.forPlugin('${artifactId}'));
