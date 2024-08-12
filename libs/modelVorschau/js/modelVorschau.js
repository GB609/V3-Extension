var NUMBERS = new (
  function() {
    let punctuation = /123(.?)456(.)789/.exec(new Intl.NumberFormat(navigator.language).format(123456.789));

    this.thousands = punctuation[1];
    this.comma = punctuation[2];
    
    var fixString = (function fixString(thousands, comma, str){
      return str.replaceAll(thousands, '').replace(comma, '.');
    }).bind(null, this.thousands, this.comma);

    this.parse = function(source) {
      switch (typeof source) {
        case "undefined": return 0;
        case "object":
          if(source instanceof HTMLElement){
            return this.parse(source.innerText);
          } else if(source instanceof Widget){
            return this.parse(source.element);
          } 
          return this.parse(source.toString());
        case "string":
          return rounded(parseFloat(fixString(source))) || 0;
      }
    }
  }
)();

window.Resource = class Resource extends Serializable {
  constructor(aProv, aName, values) {
    super();
    this.myProv = aProv;
    this.name = aName;
    Object.assign(this, values);

    this.minus = rounded(this.used + this.sold);
    this.plus = rounded(this.produced + this.hunted);

    this.change = rounded(this.plus - this.minus);
    this.reserve = rounded(this.stock + this.onMarket + this.consumed);
    this.reserveAfterTurn = rounded(this.afterTurn + this.onMarket);
    //this.afterTurn = rounded(this.stock + this.change);
  }

  static fromTR(prov, aTr) {
    var tds = aTr.cells;
    var resName = parseResourceName(tds[0]);

    var keys;
    var values = {};
    if (tds.length < 10) {
      // no market so far
      keys = ['stock', 'produced', 'hunted', 'used', 'sold', null, 'afterTurn', 'onMarket'];
    } else if (tds.length >= 10) {
      // market has been built
      keys = ['stock', 'produced', 'hunted', 'used', 'sold', null, 'afterTurn', 'onMarket', 'consumed'];
    }
    keys.forEach(function(key, val) {
      if (key != null) {
        values[key] = NUMBERS.parse(tds[val + 1]);
      }
    });
    return new Resource(prov, resName, values);
  }

  toString() { return this.name; }
}

window.VorschauTable = class VorschauTable {

  constructor(srcTable, aProvName, modifyTable) {
    this.provName = (aProvName) ? aProvName : CFG.CURRENT_PROV;

    // target for table heading
    this.head;
    // initial, original data
    this.body = srcTable.tBodies[0];
    this.originalNumColumns = srcTable.rows[0].childElementCount;

    this.resources = {};
    this.rows = {};
    this.addCellsFactory;
    this.addColumnData = [];
    this.counters = [];

    if (modifyTable === true) {
      // custom added lines
      this.appendix = DOM.tbody();
      srcTable.add(this.appendix);

      this.head = DOM.thead().add(srcTable.rows[0]);
      srcTable.insertBefore(this.head, srcTable.firstChild);
    }

    for (let i = 0; i < this.body.rows.length; i++) {
      let current = this.body.rows[i];
      let res = Resource.fromTR(this.provName, current);

      this.resources[res.name] = res;
      this.rows[res.name] = current;
    }
  }

  isFullSingleDay(){
    return this.head.querySelector('*[title*="24 h"]') != null;
  }

  generateHeader(aConfig) {
    var headerClass = this.head.rows[0].firstElementChild.getAttribute('class');
    var td;
    if (this.addCellsFactory) {
      td = this.addCellsFactory.createHeader(aConfig, headerClass);
    } else {
      td = DOM.td({
        "class": headerClass
      });
      td.add(aConfig.provName);
    }
    this.head.firstElementChild.add(td);
  }

  addRow(aResName) {
    var tr = this.rows[aResName];
    if (typeof tr == "undefined") {
      console.log('no row for res:', aResName);
      var previousSameColored = this.body.parentElement.rows[this.body.parentElement.rows.length - 2].cells;
      tr = DOM.tr();
      for (var l = 0; l < this.originalNumColumns; l++) {
        tr.add(DOM.td({
          "class": previousSameColored[l].getAttribute("class")
        }).addText(l == 0 ? aResName : "0"));
      }
      this.appendix.add(tr);
      this.rows[aResName] = tr;
      this.resources[aResName] = Resource.fromTR(this.provName, tr);
    }
    if (this.addCellsFactory) {
      for (let i = tr.cells.length - this.originalNumColumns; i < this.addColumnData.length; i++) {
        tr.add(this.addCellsFactory.create(this.resources[aResName], this.addColumnData[i]));
      }
    }
  }

  addResources(resObj) {
    resObj.forEach((resName, val) => {
      if (typeof this.resources[resName] == "undefined") this.resources[resName] = true;
    });
  }

  addColumn(colSetting) {
    this.addColumnData.push(colSetting);
    this.addResources(colSetting.resources);
    this.generateHeader(colSetting);

    // resource rows
    this.resources.forEach(function(resName, val, ctx) {
      ctx.addRow(resName);
    }, this);
  }

  addColumns(colSettings) {
    for (let i = 0; i < colSettings.length; i++) {
      var colSetting = colSettings[i];
      this.addColumnData.push(colSetting);
      this.addResources(colSetting.resources);
      this.generateHeader(colSetting);
    }

    // resource rows
    this.resources.forEach((resName, val) => {
      this.addRow(resName);
    });
  }
}
