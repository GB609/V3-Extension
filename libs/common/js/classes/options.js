function defineProto(type, members = false, init = false) {
  if (typeof members === "object" && !members.isEmpty()) {
    let superProto = Object.getPrototypeOf(type.prototype);

    Object.defineProperty(members, Symbol.for("_"), {
      enumerable: false, writable:false,
      value:`${type.name}-${superProto.constructor.name}`});
    Object.setPrototypeOf(members, superProto);
    Object.setPrototypeOf(type.prototype, members);
    
    //anything part of the members declaration will not be an enumerable property
    //non-function members will be wrapped in getters/setters to retain the 
    //non-enumerable characteristic on subclasses
    nonEnumerable(members, Object.keys(members));
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
  static #LISTENER_LIST = Symbol.for("LISTENER_LIST");

  static NAME = "OptionAction";
  static INIT = () => new OptionAction("init");
  static SAVE = () => new OptionAction("save");
  static REVERT = () => new OptionAction("revert");

  constructor(actionName) {
    super("OptionAction");
    this.action = actionName;
  }

  static trigger(evt) {
    try { this[evt.action](); }
    catch (e) { LOGGER.error(evt, "caused", e, "on", this); }
  }

  static addListener(target, receiver) {
    target[this.#LISTENER_LIST] ||= {}
    if (!target[this.#LISTENER_LIST][receiver.uuid]) {
      let listener = OptionAction.trigger.bind(receiver);
      target.addEventListener(OptionAction.NAME, listener);
      target[this.#LISTENER_LIST][receiver.uuid] = listener;
      return listener;
    }
    return false;
  }

  static clearListener(target) {
    target[this.#LISTENER_LIST] ||= {}
    target[this.#LISTENER_LIST].forEach((key, listener) => {
      target.removeEventListener(OptionAction.NAME, listener);
    });
    delete target[this.#LISTENER_LIST];
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
      this.superAdd((doc) => DOM.h3({}, doc).addText(this.label));
    }
    this.childPanel = new Composite(this.id + ':children', ...rest);
    this.superAdd(this.childPanel);
    this.childPanel = this.childPanel.htmlProxy();

    this.buttonRow = new Composite("",
      new Style().ruleFor(DOM.button, "margin:5px;"),
      DOM.button({ onclick: this.save.bind(this) }).add("Speichern"),
      DOM.button({ onclick: this.revert.bind(this) }).add("Rückgängig")
    );
    this.superAdd(this.buttonRow.useContainer("p"));
    this.buttonRow &&= this.buttonRow.htmlProxy();

    this.showButtons(false);

    //superAdd should be visible in constructor - overwrite
    Object.defineProperty(this, "superAdd", {
      configurable: false, writable: false, enumerable: false,
      value: interfaced.bind(this, 'superAdd is only allowed during construction')
    });
  });
}
defineProto(OptionGroup.inherits(Composite), {
  //properties added here will not be enumerable later on
  id: '', label: null, dirty: true, useButtons: false, 
  childPanel: null, buttonRow: null, mutationObserver: null,

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
    this.useButtons = useButtons;
    this.buttonRow.style.display = useButtons ? 'block' : 'none';
    return this;
  },

  get key() { return this.parentKey + this.id; },

  get parentKey() {
    let superGroup = Widget.findNearestParentOfType(OptionGroup, this.parent);
    if (superGroup !== false) {
      superGroup[this.id] = this;
      return superGroup.key + '.';
    }
    return "";
  },

  add(child) { this.dirty = true; return this.childPanel.add(child); },
  superAdd(child) { return super.add(child); },

  integrateChildren(rootNode = this.childPanel.element) {
    let nodeList = [rootNode, ...rootNode.querySelectorAll('*')];

    for (let n of nodeList) {

      if (typeof n.widget == "undefined") { continue; }

      let opt = Widget.findNearestParentOfType(OptionWidget, n.widget);
      let group = Widget.findNearestParentOfType(OptionGroup, opt.parent);
      if (opt !== false && group == this) {
        OptionAction.addListener(group.element, opt);
        this[opt.id] = opt;
        opt.key = this.key + '.' + opt.id;
      } else if (n.widget instanceof OptionGroup) {
        let addedGroup = n.widget;
        let parentGroup = Widget.findNearestParentOfType(OptionGroup, addedGroup.parent);
        if (parentGroup == this) {
          OptionAction.addListener(this.element, addedGroup);
          this[addedGroup.id] = addedGroup;
        }
      }
    }
    return this;
  },

  get element() {
    return lazyGet(this, 'element', () => {
      let elmnt = super.element;
      elmnt.className = "optionGroup"

      //this.integrateChildren(this.childPanel.element);
      this.init();
      //mutationobserver für den fall, dass nachträglich etwas außerhalb von group.add dazugefügt wird
      this.mutationObserver = new MutationObserver((changeList) => {
        this.dirty = true;
        this.init();
      });
      this.mutationObserver.observe(this.childPanel.element, { childList: true, subtree: true });

      return elmnt;
    });
  },

  init() {
    if (!this.dirty) {
      return this;
    }
    OptionAction.clearListener(this.element);
    //TODO: remove old keys
    this.integrateChildren();
    this.dirty = false;
    return this.element.dispatchEvent(OptionAction.INIT()), this;
  },
  save() { this.element.dispatchEvent(OptionAction.SAVE()); },
  revert() { this.element.dispatchEvent(OptionAction.REVERT()); },
}, (type) => {
  type[Style.ELEMENT_NAME] = ".optionGroup";
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
    this.input = new LabeledText(this.label, { className: 'textOption' }).inDoc(targetDoc).htmlProxy();
    this.trackChanges(this.input);
    return this.input;
  }
}, (type) => {
  type[Style.ELEMENT_NAME] = LabeledText[Style.ELEMENT_NAME] + ".textOption";
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
    this.input = new LabeledCheckbox(this.label, { className: 'checkOption' }).inDoc(targetDoc).htmlProxy();
    this.trackChanges(this.input);
    return this.input;
  }
}, (type) => {
  type[Style.ELEMENT_NAME] = LabeledCheckbox[Style.ELEMENT_NAME] + '.checkOption';
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
  return RadioSelectionOption.initWithSuper([label, keyName], function() {
    this.valueList = aValues;
  }).htmlProxy();
}
defineProto(RadioSelectionOption.inherits(OptionWidget), {
  generateElement(targetDoc) {
    this.input = new LabeledRadioGroup(this.key, this.label).inDoc(targetDoc).htmlProxy();
    this.trackChanges(this.input);
    this.valueList.forEach(opt => {
      opt.key = this.key + "." + opt.value;
      this.input.add(opt);
      if(opt.selected == true){
        this.default = opt.value;
      }
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