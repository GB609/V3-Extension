function defineProto(type, members = false, init = false) {
  if (typeof members === "object" && !members.isEmpty()) {
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
    target.actionListener ||= {}

    if (!target.actionListener[receiver.key]) {
      console.log(location.href, "register listener at", target.widget, "calling", receiver);
      target.addEventListener(OptionAction.NAME, OptionAction.trigger.bind(receiver));
      target.actionListener[receiver.key] = true;
    }
  }
}

function OptionGroup(aId, aTitle, ...rest) {
  if (!(this instanceof OptionGroup)) {
    return new OptionGroup(aId, aTitle, ...rest);
  }

  return OptionGroup.initWithSuper([aTitle], function() {
    this.id = aId;
    this.superAdd(new Style().addRule("*[changeIndicator='true']::after{ content: '*'}"));
    if (this.label !== false) {
      this.superAdd(DOM.h3({}, this.targetDoc).addText(this.label));
    }
    this.childPanel = new Composite(this.id + ':children');
    this.superAdd(this.childPanel);

    this.mutationObserver = new MutationObserver((changeList) => {
      changeList.forEach(change => {
        if (change.type == "childList") {
          for (let n of change.addedNodes) {

            if (typeof n.widget == "undefined") { continue; }

            let opt = Widget.findNearestParentOfType(OptionWidget, n.widget);
            if (opt !== false) {
              let group = Widget.findNearestParentOfType(OptionGroup, opt.parent);
              OptionAction.addListener(group.element, opt);
            } else if (n.widget instanceof OptionGroup && this != n.widget) {
              OptionAction.addListener(this.element, n.widget);
            }
          }
        }
      })
    });
    this.mutationObserver.observe(this.childPanel.element, { childList: true, subtree: true });
    this.childPanel = this.childPanel.htmlProxy();
    rest.forEach(this.add, this);
  });
}
defineProto(OptionGroup.inherits(Composite), {
  allowsAutosave() {
    let superGroup = Widget.findNearestParentOfType(OptionGroup, this.parent);
    if (superGroup !== false) {
      return !this.useButtons && superGroup.allowsAutosave();
    }
    return !this.useButtons;
  },
  /**
   * must be called BEFORE htmlProxy or element insertion
   */
  showButtons(useButtons = true) {
    return this.useButtons = useButtons, this;
  },

  get key() { return this.parentKey + this.id; },

  get parentKey() {
    let superGroup = Widget.findNearestParentOfType(OptionGroup, this.parent);
    if (superGroup !== false) {
      return superGroup.key + '.';
    }
    return "";
  },

  add(child) { return this.childPanel.add(child); },
  superAdd(child) { return super.add(child); },

  get element() {
    return lazyGet(this, 'element', () => {
      let doc = this.targetDoc;

      if (this.useButtons && typeof this.buttonRow == "undefined") {
        this.buttonRow = new Composite("",
          new Style("button{margin:5px;}"),
          DOM.button({ onclick: this.save.bind(this) }, doc).add("Speichern"),
          DOM.button({ onclick: this.revert.bind(this) }, doc).add("Rückgängig")
        );
        super.add(this.buttonRow.useContainer("p").inDoc(doc));
      }

      return super.element;
    });
  },

  save() { this.element.dispatchEvent(new OptionAction("save")); },
  revert() { this.element.dispatchEvent(new OptionAction("revert")); },
}, (type) => {
  type[Style.ELEMENT_NAME] = "div";
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
    return this.input;
  }
});

// ----- CHECKBOX -----
function CheckOption(keyName, label, aDefault = false) {
  if (!(this instanceof CheckOption)) {
    return new CheckOption(keyName, label, aDefault);
  }
  return CheckOption.initWithSuper([label, keyName, aDefault, ValueType.BOOL]).htmlProxy();
}
defineProto(CheckOption.inherits(OptionWidget), {
  generateElement(targetDoc) {
    this.input = new LabeledCheckbox(this.label).inDoc(targetDoc).htmlProxy();
    this.trackChanges(this.input);
    return this.input;
  }
}, (type) => {
  type[Style.ELEMENT_NAME] = LabeledCheckbox[Style.ELEMENT_NAME];
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
  return RadioSelectionOption.initWithSuper(label, keyName, function() {
    this.valueList = aValues;
  });
}
defineProto(RadioSelectionOption.inherits(OptionWidget), {
  generateElement(targetDoc) {
    this.input = new LabeledRadioGroup(this.key, this.label).inDoc(targetDoc).htmlProxy();
    this.trackChanges(this.input);
    this.valueList.forEach(opt => {
      opt.id = this.key + "." + opt.value;
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
  return DropDownOption.initWithSuper(label, keyName, function() {
    this.valueList = aValues;
  });
}
defineProto(DropDownOption.inherits(OptionWidget), {
  generateElement(targetDoc) {
    this.input = new LabeledDropDown(this.label).inDoc(targetDoc).htmlProxy();
    this.trackChanges(this.input);
    this.valueList.forEach(this.input.add);
    return this.input;
  }
});