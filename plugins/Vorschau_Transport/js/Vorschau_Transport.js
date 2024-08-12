window.ProvSetting = class ProvSetting extends Serializable {
  constructor(aProvName, aResources = {}, aId = new Date().getTime()) {
    super();
    this.provName = aProvName;
    this.id = "" + aId;
    this.resources = aResources;
  }
  getTarget() { return TransportTask.forSetting(this).target; }
};

class TransportUpdatedEvent extends Event {
  constructor(setting) {
    super('ResUpdated');
    this.targetSetting = setting;
  }
}

// #include model/transportTask

// #include model/transportTable

(function() {

  // #include classes/messageWindow

  var OPTIONS = OptionGroup("TP", 'Optionen: Vorschau-Transport',
    new Style().ruleFor(CheckOption, 'display:block}'), 
    DOM.p()
      .add("Mit dieser Erweiterung können Transportaufträge von und zu einer Provinz direkt in der Vorschau erzeugt, gespeichert und ausgeführt werden.").br()
      .add("Diese Funktion ist völlig unabhängig vom VZ3-internen automatischen Transportsystem.").br()
      .add("Weitere Einstellungsmöglichkeiten sind gerade in der Entwicklung."),
    CheckOption("showReport", "Transportbericht anzeigen", false),
    CheckOption("reloadAfterTransport", "Vorschau nach Transport zur Neuberechnung automatisch neu laden", false));

  var SET_KEY = "TP_" + CFG.CURRENT_PROV;
  var SETTING = CFG.get(SET_KEY, []);

  function addNewSetting() {
    let notes = DOM.byId('add-note');

    let name = DOM.byId('add-list').value + ((notes.value.length > 0) ? ' ' + notes.value : '');
    SETTING.push(new ProvSetting(name));
    CFG.persist(SET_KEY, SETTING);
    window.location.href = "vorschau.php?provinz=" + CFG.CURRENT_PROV;
  }

  function removeSetting(target) {
    console.log("remove: " + target);
    SETTING.splice(SETTING.indexOf(target), 1);
    CFG.persist(SET_KEY, SETTING);
    window.location.href = "vorschau.php?provinz=" + CFG.CURRENT_PROV;
  }

  function transportAmountFromModeAndStocks(mode, stock, remoteStock) {
    mode = /([<>=\+\-])?[ ]*(\d+)/.exec("" + mode);
    if (mode == null) return 0;

    var amount = parseInt(mode[2]);
    switch (mode[1]) {
      case undefined:
      case '=': 
        //keep constant: export if stock>amount, import if stock<amount 
        amount = stock - amount;
        break;
      case '>':
        //export only if stock is >amount, export diff
        amount = (stock > amount) ? stock - amount : 0;
        break;
      case '<':
        //import only if stock is <amount, import diff
        amount = (stock < amount) ? stock - amount : 0;
        break;
      case '+':
        //ALWAYS import amount, no conditions
        amount = -amount;
        break;
      case '-':
        //ALWAYS export amount, no conditions 
        break;

      default: //something is broken, skip this resource
        amount = 0;
    }

    if (amount > 0) {
      //cap to max of local stock if outgoing transport
      amount = Math.min(stock, amount);
    } else if (amount < 0) {
      //cap to max of remote stock if incoming transport
      amount = -Math.min(remoteStock, Math.abs(amount));
    }

    return amount;
  }

  // transporttable
  function readAndStartTransport(table, aTask) {
    aTask.clear();

    var resSettings = aTask.settingResources();
    resSettings.forEach(function(key, value) {
      var row = table.getRow(key);
      if (row) {
        var amount = transportAmountFromModeAndStocks(value, row.local, row.remote);
        if (amount != 0) {
          aTask.addResource(row.post, amount);
        }
      }
    });

    if (aTask.isEmpty()) {
      var repDiv = DOM.byId("shortReportDiv");
      repDiv.addText("Nichts zu tun - Transport leer oder ausgewählte Posten nicht vorrätig.");
      repDiv.style.display = "block";
      return;
    }

    aTask.execute(function(result) {
      if (OPTIONS.showReport.value === true) {
        var report = new MessageWindow('60%', 'center');
        report.closeOnHide = true;
        report.addElement(result.report);

        if (OPTIONS.reloadAfterTransport.value === true) {
          report.onClick(function() { window.location.href = "vorschau.php?provinz=" + CFG.CURRENT_PROV; });
        }

        report.show();

      } else {
        var repDiv = DOM.byId("shortReportDiv");
        if (result.successful) {
          repDiv.addText("Transportauftrag " + aTask.name + " nach " + aTask.target + " erfolgreich beendet.");
        } else {
          repDiv.addText("Fehler bei Transport nach " + aTask.target + ": ");
          repDiv.add(result.report);
        }
        repDiv.style.display = "block";
      }
    });
  }

  function saveChanges() {
    var targetRes = this.targetSetting.resources;

    if (this.value.trim().length > 0) {
      targetRes[this.resource.name] = this.value;
    } else if (targetRes[this.resource.name]) {
      delete targetRes[this.resource.name];
    }
    CFG.persist(SET_KEY, SETTING);

    calcAndSetCounterChange(this);
  }

  function calcAndSetCounterChange(input) {
    // load cached remote stock or take close to infinite as default if undefined
    var remoteStock = Math.floor(CACHE.get("resUsage." + input.id + '.st', 50000));
    var amount = transportAmountFromModeAndStocks(input.value, Math.floor(input.resource.stock), remoteStock);

    var requiredAP = Math.abs(amount);

    input.targetSetting.transportAmount[input.resource.name] = requiredAP;

    input.setAttribute('class', (requiredAP > 0) ? 'hinweis9' : '');
    window.dispatchEvent(new TransportUpdatedEvent(input.targetSetting));
  }

  function inputForRes(targetSetting, aResRow) {
    var amount = targetSetting.resources[aResRow.name] || "";

    var input = DOM.input({
      size: 5,
      value: amount,
      id: targetSetting.getTarget() + '.' + aResRow.name
    });

    input.targetSetting = targetSetting;
    input.resource = aResRow;

    calcAndSetCounterChange(input);

    input.addEventListener('change', saveChanges, true);

    return input;
  }

  function setupControlDiv(resTable) {
    var controlDiv = TEMPLATE.asDom("controlPanel");

    // dropdown zum löschen von konfigurationen
    if (SETTING.length > 0) {
      controlDiv.add(new Style().addRule("span#form-removeSetting{display:inline-block !important;}"));
    }
    
    var options = DOM.byAttribute('span', 'id', 'control-options', controlDiv);
    // zusätzliche Optionen
    options.add(OPTIONS.reloadAfterTransport.autoUpdate(true));
    options.add(OPTIONS.showReport.autoUpdate(true));

    // add control panel
    resTable.parentElement.insertBefore(controlDiv, resTable);
  }

  function updateCounter(updEvt) {
    var sum = 0;
    updEvt.targetSetting.transportAmount.forEach((key, val) => {
      sum += val;
    });
    DOM.byId(`counter-${updEvt.targetSetting.id}`).innerText = sum;
  }

  function initialize() {
    var tables = DOM.byTag('table', document);
    var resTable = tables[tables.length - 1];

    /*
     * modifiziere form - ändere action zu vorschau.php?provinz=x/y, damit das script auch nach einem klick auf
     * Vorschau berechnen seine Konfiguration richtig findet.
     */
    var form = DOM.byTag("form", document)[0];
    form.action = form.action + "#provinz=" + CFG.CURRENT_PROV;
    var isReportMode = DOM.byAttribute('input', 'type', 'submit', form).value == "neue Vorschau";

    var table = new VorschauTable(resTable, CFG.CURRENT_PROV, !isReportMode);

    if (isReportMode) {
      updateCacheFromVs(table, "afterTurn", "reserveAfterTurn");
      return;
    }

    updateCacheFromVs(table, "stock", "reserve");

    setupControlDiv(resTable);

    if (SETTING.length > 0) {
      table.addCellsFactory = {
        headerTpl: TEMPLATE.asText("transportHeader"),
        addListener: [],

        createHeader: function(aConfig, aClass) {
          var newTd = DOM.td({ "class": aClass });
          newTd.taskDefinition = TransportTask.forSetting(aConfig);
          newTd.innerHTML = String.format(this.headerTpl, aConfig.id, aConfig.provName, aConfig.id, aConfig.provName.split(' ')[0]);

          this.addListener.push(listener(newTd.firstElementChild, 'click', function() {
            this.parentElement.taskDefinition.loadTable(readAndStartTransport);
          }));

          Object.defineProperty(aConfig, 'transportAmount', { enumerable: false, value: {}, writeable: false });

          return newTd;
        },
        create: function(aRes, aConfig) {
          return DOM.td().add(inputForRes(aConfig, aRes));
        }
      };
      table.addColumns(SETTING);

      this.eventListener = [...this.eventListener, ...table.addCellsFactory.addListener];
    }
  }

  function updateCacheFromVs(vsTable, stockPropName, resPropName = "reserve") {
    let res = vsTable.resources;
    //TODO: Klasse für resCache Eintrag einführen, die einen besseren dirty-check machen kann als den gesamten String zu vergleichen
    let usage = CACHE.get("resUsage." + vsTable.provName, {});
    let contentBefore = JSON.stringify(usage);
    res.forEach(function(key, val) {
      usage[key] = {
        st: val[stockPropName], //stock
        ch: val.change, //change
        res: val[resPropName] //komplette reserve inkl. markt
      };
    });
    if(JSON.stringify(usage) != contentBefore){
      usage['#LAST_UPDATED'] = new Date().getTime();
    }
    CACHE.set("resUsage." + vsTable.provName, usage);
  }

  let plugin_Vorschau = new V3Plugin("${artifactId}", {
    title: 'Vorschau: Transport',
    options: OPTIONS,
    eventListener: [
      listener('add-list', 'focus', function() {
        populateDropDown(this, () => PROVINCES, (ele) => ({ value: ele.c, label: String.format("{} ({})", ele.n, ele.c) }), "");
      }),
      listener('add-confirm', 'click', addNewSetting),

      listener('remove-list', 'focus', function() {
        populateDropDown(this, () => SETTING, (ele) => ({ value: SETTING.indexOf(ele), label: ele.provName }), "Auswahl löschen...");
      }),
      listener('remove-confirm', 'click', function() {
        var dropdown = this.previousElementSibling;
        if (dropdown.selectedIndex > 0) {
          removeSetting(SETTING[dropdown.value]);
        }
      }),
      listener(window, 'ResUpdated', updateCounter)
    ],

    execute: initialize,

    postListener: function() {
      SETTING.forEach((val) => {
        window.dispatchEvent(new TransportUpdatedEvent(val));
      });
    }
  });

  return plugin_Vorschau.run();
})();
