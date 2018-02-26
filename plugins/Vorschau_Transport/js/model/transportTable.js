function TransportTableRow(aResName, aPostName, aLocal, aRemote) {
  this.name = aResName;
  this.post = aPostName;
  this.local = aLocal;
  this.remote = aRemote;
}

function TransportTable(transportDoc) {
  this.resources = {};

  var _table = DOM.byId('transportTable', transportDoc);
  var trs = _table.rows;

  var _source = {};
  var _target = {};

  {
    var apRow = trs[0];
    _source.ap = intOrZeroFromElement(apRow.firstElementChild);
    _target.ap = intOrZeroFromElement(apRow.lastElementChild);

    var tpRow = trs[1];
    var apReq = trs[3];
  }

  for (var i = 0; i < trs.length; i++) {
    var row = trs[i];
    var inputs = DOM.byTag("input", row);
    if (inputs.length == 0) {
      continue;
    }

    var resName = row.cells[5].innerText.trim();
    this.resources[resName] = new TransportTableRow(resName, row.cells[11].children[0].name,
      intOrZeroFromElement(row.cells[0]), intOrZeroFromElement(row.cells[10]));
  }
}
TransportTable.prototype.getRow = function(aResName){
  if(typeof this.resources[aResName] === 'undefined'){
    return null;
  }
  
  return this.resources[aResName];
};