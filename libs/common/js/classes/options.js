function defineProto(type, members = false, init = false) {
  if(typeof members === "object" && !members.isEmpty()){
    let superProto = Object.getPrototypeOf(type.prototype);
    Object.setPrototypeOf(members, superProto);
    Object.setPrototypeOf(type.prototype, members);
  }

  if (typeof init == 'function') {
    init(type, type.prototype);
  }
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

class OptionAction extends Event {
  static NAME = "OptionAction";
  constructor(actionName) {
    super("OptionAction");
    this.action = actionName;
  }

  static trigger(evt) {
    try {
      this[evt.action]();
    } catch (e) {
      LOGGER.error(evt, "caused", e, "on", this);
    }
  }

  static addListener(target, receiver) {
    target.addEventListener(OptionAction.NAME, OptionAction.trigger.bind(receiver), true);
  }
}

function OptionGroup(aId, aTitle, ...rest) {
  if (!(this instanceof OptionGroup)) {
    return new OptionGroup(aId, aTitle, ...rest);
  }

  return OptionGroup.initWithSuper([aTitle, ...rest], function(){
    this.key = aId;
    if (this.label !== false) {
      this.add(DOM.h3({}, this.targetDoc).addText(this.label));
    }

    this.mutationObserver = new MutationObserver((changeList) => {
      changeList.forEach(change => {
        if (change.type == "childList") {
          for (let n of change.addedNodes) {
            if (n.widget instanceof OptionWidget) {
              OptionAction.addListener(this.element, n.widget);
            }
          }
        }
      })
    });
  });
}
defineProto(OptionGroup.inherits(Composite), {
  get element() {
      this.mutationObserver.disconnect();
      let ele = super.element;
      this.mutationObserver.observe(ele, { childList: true, subtree: true });
      return ele;
    },
    
  save() {
    this.element.dispatchEvent(new OptionAction("save"));
  },

  revert() {
    this.element.dispatchEvent(new OptionAction("revert"));
  },
});

// ----- TEXT FIELD -----
function TextOption(keyName, label, aDefault, aType) {
  if (!(this instanceof TextOption)) {
    return new TextOption(keyName, label, aDefault, aType);
  }

  return TextOption.initWithSuper([label, keyName, aDefault, aType]);
}
defineProto(TextOption.inherits(OptionWidget), {
  generateElement(targetDoc) {
    this.input = new LabeledText(this.label, {
      'class': 'textOption',
      style: { display: 'block' }
    }).inDoc(targetDoc).htmlProxy();
    this.trackChanges(this.input);
    this.input.value = this.value;
    return this.input;
  }
});

// ----- CHECKBOX -----
function CheckOption(keyName, label, aDefault = false) {
  if (!(this instanceof CheckOption)) {
    return new CheckOption(keyName, label, aDefault);
  }
  return CheckOption.initWithSuper([label, keyName, aDefault, ValueType.BOOL]);
}
defineProto(CheckOption.inherits(OptionWidget), {
  generateElement(targetDoc) {
    this.input = new LabeledCheckbox(this.label).inDoc(targetDoc).htmlProxy();
    this.trackChanges(this.input);
    this.input.value = this.value;
    return this.input;
  }
});

// ----- LIST OF RADIOS (mutual exclusive alternative values) -----
/**
 * @param keyName
 * @param label
 * @param values
 *          [{object:Entry}]
 */
function RadioSelectionOption(keyName, label, aValues) {
  if (!(this instanceof RadioSelectionOption)) {
    return new RadioSelectionOption(keyName, label, aValues);
  }
  return RadioSelectionOption.initWithSuper(label, keyName, function(){;
    this.valueList = aValues;
  });
}
defineProto(RadioSelectionOption.inherits(OptionWidget), {
  generateElement(targetDoc) {
    this.input = new LabeledRadioGroup(this.key, this.label).inDoc(targetDoc).htmlProxy();
    this.trackChanges(this.input);
    this.valueList.forEach(opt => {
      opt.id = this.key+"."+opt.value;
      this.input.add(opt);
    });
    return this.input;
  }
});

/**
 * 
 * @param keyName
 * @param label
 * @param values
 *          [{object:Entry}]
 */
function DropDownOption(keyName, label, aValues) {
  if (!(this instanceof DropDownOption)) {
    return new DropDownOption(keyName, label, aValues);
  }
  return DropDownOption.initWithSuper(label, keyName, function(){
    this.valueList = aValues;
  });
}
defineProto(DropDownOption.inherits(OptionWidget), {
  generateElement(targetDoc){
    this.input = new LabeledDropDown(this.label).inDoc(targetDoc).htmlProxy();
    this.trackChanges(this.input);
    this.valueList.forEach(this.input.add);
    return this.input;
  }
});