function interfaced() {
  throw 'not implemented';
}

class ValueType {
  static STRING(aToConvert) {
    return (aToConvert != null && typeof aToConvert !== 'undefined') ? String(aToConvert) : '';
  }
  
  static INT(aToConvert) {
  	return parseInt(aToConvert) || 0;    
  }
  
  static FLOAT(aToConvert) {
    return parseFloat(aToConvert) || 0.0;    
  }
  
  static BOOL(aToConvert) {
    return (ValueType.INT(aToConvert) > 0) || (String(aToConvert).toLowerCase() == 'true');
  }
};

function Options(aId) {
  if (!(this instanceof Options)) {
    // convenience factory
    var options = new Options(arguments[0]);
    for (i = 1; i < arguments.length; i++) {
      options.add(arguments[i]);
    }
    return options;
  }
  var _options = [];
  this.id = aId;
  this.parent = null;
  this.add = function(aOption) {
    if (typeof this[aOption.id] !== 'undefined') {
      throw 'id known already';
    }

    _options.push(aOption);
    this[aOption.id] = aOption;
    aOption.parent = this;
    aOption.init();
  };

  this.list = function() {
    return _options;
  };

  this.updateDisplay = function() {
    for (i = 0; i < _options.length; i++) {
      _options[i].updateDisplay();
    }
  };
  
  this.save = function(){
  	for (i = 0; i < _options.length; i++) {
      _options[i].save();
    }
  };
  
  this.revert = function(){
  	for (i = 0; i < _options.length; i++) {
      _options[i].revert();
    }
  };
}
(function(t) {
  t.prototype.fullId = function() {
    if (this.parent != null) {
      return this.parent.fullId() + '.' + this.id;
    }
    return this.id;
  };
  t.prototype.getElement = function(targetDoc) {
    var container = DOM.div({
      id : this.id
    }, targetDoc);
    this.list().forEach(function(val) {
      container.add(val.getElement(targetDoc));
    });
    return container;
  };
})(Options);

function OptionGroup(aId, aTitle) {
  if (!(this instanceof OptionGroup)) {
    var group = new OptionGroup(aId, aTitle);
    for (i = 2; i < arguments.length; i++) {
      group.add(arguments[i]);
    }
    return group;
  }

  Options.call(this, aId);
  this.title = aTitle;
}
(function(t) {
  t.prototype.init = function() {};
  t.prototype.getElement = function() {
    var container = Options.prototype.getElement.call(this);
    var title = DOM.h2().addText(this.title);
    container.insertBefore(title, container.firstChild);
    return container;
  }
})(OptionGroup.inherits(Options));

function Option(keyName, aLabel, aDefault, aType) {
  this.id = keyName;
  this.label = aLabel;
  this.parent = null;
  this.myDefault = (typeof aDefault !== 'undefined') ? aDefault : '';
  this.autoUpdateCfg = false;

  this.current;
  this.typeHandler = (typeof aType !== 'undefined') ? aType : ValueType.STRING;
}
(function(t) {
	t.prototype.autoUpdate = function(aAutoUpdate){
		this.autoUpdateCfg = aAutoUpdate;
		return this;
	};
  t.prototype.fullId = function() {
    if (this.parent != null) {
      return this.parent.fullId() + '.' + this.id;
    }
    return this.id;
  };
  t.prototype.save = function(aNewValue) {
    if (typeof aNewValue !== 'undefined') {
      // do not use update current to allow direct usage of options in plugins for read/write
      this.current = this.typeHandler(aNewValue);
    }
    CFG.set(this.fullId(), this.current);
    this.value = this.current;
  };
  t.prototype.init = function() {
    this.value = CFG.get(this.fullId(), this.myDefault);
  };
  t.prototype.revert = function() {
    this.current = this.value;
    this.updateDisplay();
  };
  t.prototype.updateCurrent = function(aNewValue) {
    this.current = this.typeHandler(aNewValue);
    if(this.autoUpdateCfg){
    	this.save();
    }
    this.updateDisplay();
  };
  t.prototype.isChanged = function() {
    return this.value != this.current;
  };
  t.prototype.getElement = function(targetDoc) {
    return DOM.div({}, targetDoc).add(this.label).addText(' : ' + this.value);
  };
  t.prototype.updateDisplay = function() {
    if (this.isChanged()) {
      this.element.style.fontWeight = 'bold';
      this.updateElementValue(this.current);
    } else {
      this.element.style.fontWeight = 'normal';
    }
  };
  t.prototype.updateElementValue = interfaced;
})(Option);

function TextOption(keyName, label, aDefault, aType) {
  if(!(this instanceof TextOption)){
    return new TextOption(keyName, label, aDefault, aType); 
  }
  
  Option.call(this, keyName, label, aDefault, aType);
}
(function(t) {
  t.prototype.getElement = function(targetDoc) {
    if (this.element) {
      return this.element;
    }
    var span = DOM.span({
      id : this.id,
      'class' : 'textOption',
      style:{display:'block'}
    }, targetDoc).addText(this.label + ": ");
    var input = DOM.input({}, targetDoc);
    input.setting = this;
    input.addEventListener('change', function() {
      this.setting.updateCurrent(this.value);
    });

    this.element = span;
    this.input = input;
    return span.add(input);
  };
  t.prototype.updateElementValue = function(aNew) {
    this.input.value = aNew;
  };
})(TextOption.inherits(Option));

function CheckOption(keyName, label, aDefault) {
  if(!(this instanceof CheckOption)){
    return new CheckOption(keyName, label, aDefault);
  }
  Option.call(this, keyName, label, aDefault, ValueType.BOOL);
}
(function(t) {
  t.prototype.getElement = function(targetDoc) {
    if (this.element) {
      return this.element;
    }
    var input = DOM.input({
      "type" : "checkbox"
    }, targetDoc);
    input.setting = this;
    input.checked = this.value;

    input.onchange = function() {
      this.setting.updateCurrent(this.checked);
    };

    var span = DOM.label({}, targetDoc).add(input).addText(" ");
    this.element = span;
    this.input = input;

    return span.add(this.label);
  };
  t.prototype.updateElementValue = function(aNew) {
    this.input.checked = aNew;
  };
})(CheckOption.inherits(Option));


function Entry(aKey, aValue){
  if(this instanceof Entry){
    this.key = aKey;
    this.value = aValue
  } else {
    return new Entry(aKey, aValue);
  }
}
/**
 * @param keyName
 * @param label
 * @param values
 *          [{object:Entry}]
 */
function RadioOption(keyName, label, aValues) {
  if(!(this instanceof RadioOption)){
    return new RadioOption(keyName, label, aValues);
  }
  Option.call(this, keyName, label);
  this.valueList = aValues;
}
(function(t) {
  t.prototype.getElement = function() {
    if (this.element != null) {
      return this.element;
    }
    var div = new Group(this.label);
    div.node.setting = this;

    function onchange() {
      this.parentElement.setting.updateCurrent(this.value);
    }

    this.input = {};
    for (i = 0; i < this.valueList.length; i++) {
      var current = this.valueList[i];
      var key = current.key;
      var label = DOM.label();
      var radio = DOM.input({
        type : 'radio',
        name : this.fullId(),
        value : key
      });
      radio.onchange = onchange;

      this.input[key] = radio;
      label.add(radio).add(' ' + current.value);
      div.add(label);
    }
    
    if(this.value){
      this.input[this.value].checked = true;
    }

    this.element = div.node;
    return div.node;
  };
  t.prototype.updateElementValue = function(aNew) {
    this.input[aNew].checked = true;
  };
})(RadioOption.inherits(Option));

/**
 * 
 * @param keyName
 * @param label
 * @param values
 *          [{object:Entry}]
 */
function DropDownOption(keyName, label, aValues) {
  if(!(this instanceof DropDownOption)){
    return new DropDownOption(keyName, label, aValues);
  }
  Option.call(this, keyName, label);
  this.valueList = aValues;
}
(function(t) {
  t.prototype.getElement = function() {
    var label = DOM.label();
    label.add(this.label + ': ');
    this.input = {};
    
    var select = DOM.select();
    for(i = 0; i < this.valueList.length; i++){
      var current = this.valueList[i];
      var opt = DOM.option({value:current.key}).add(current.value);
      select.add(opt);
      
      this.input[current.key] = opt;
    }
    
    select.setting = this;
    select.addEventListener('change', function(){
      this.setting.updateCurrent(this.value);
    });
    if(this.value){
      this.input[this.value].selected = true;
    }
  };
  t.prototype.updateElementValue = function(aNew) {
    this.input[aNew].selected = true;
  };
})(DropDownOption.inherits(Option));