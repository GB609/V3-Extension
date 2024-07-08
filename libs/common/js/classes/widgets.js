function interfaced(text = 'Not implemented.') { throw text; }
function NOOP() { }
function lazyGet(obj, prop, factory, canChange = false) {
  let data = factory();
  Object.defineProperty(obj, prop, { configurable: true, value: data, writable: canChange });
  return data;
}
function nonEnumerable(obj, ...properties) {
  if (properties.length == 0) { properties = Object.keys(obj); }
  properties.forEach(prop => {
    if (Array.isArray(prop)) {
      nonEnumerable(obj, ...prop);
      return;
    }

    let desc = Object.getOwnPropertyDescriptor(obj, prop);
    let getter = desc.get;
    let setter = desc.set;
    let value = desc.value;

    if (typeof value == "function"
      || typeof getter == "function"
      || typeof setter == "function") {
      Object.defineProperty(obj, prop, { enumerable: false });
    } else {
      Object.defineProperty(obj, prop, {
        enumerable: false,
        get() { return this[Symbol.for(prop)] },
        set(val) { this[Symbol.for(prop)] = val }
      });
      obj[Symbol.for(prop)] = value;
    }
  });
}

class Widget {
  static PROXY_TARGET = Symbol.for("HTML_PROXY_TARGET");
  static PROXY_INSTANCE = Symbol.for("HTML_PROXY_INSTANCE")

  static #keepProperty(me, innerPrio, p) {
    try {
      return typeof me[p] != "undefined" || typeof innerPrio[p] === "undefined";
    } catch (e) {
      return true;
    }
  }
  static #fixThisIfFunc(me, func, returnProxyOnSelf = false) {
    if (typeof func != "function") {
      return func;
    }

    if (returnProxyOnSelf === false) {
      return func.bind(me);
    }

    return function(...parameters) {
      let result = func.call(me, ...parameters);
      return (result == me) ? returnProxyOnSelf : result;
    }
  }

  static delegateProperties(externalReceiver, innerPrio) {
    if (typeof externalReceiver[Widget.PROXY_INSTANCE] != "undefined") {
      return externalReceiver[Widget.PROXY_INSTANCE];
    }

    let proxy = new Proxy(externalReceiver, {
      get(t, p) {
        if (p == Widget.PROXY_TARGET) return t;

        if (Widget.#keepProperty(t, innerPrio, p)) {
          return Widget.#fixThisIfFunc(t, t[p], proxy);
        }
        return Widget.#fixThisIfFunc(t.element, innerPrio[p]);
      },
      set(t, p, v) {
        if (Widget.#keepProperty(t, innerPrio, p)) {
          t[p] = v;
        } else {
          innerPrio[p] = v;
        }
        return true
      }
    });
    return externalReceiver[Widget.PROXY_INSTANCE] = proxy;
  }

  /**
   * Expects the given argument to be the FIRST parent to check.
   */
  static findNearestParentOfType(type, aWidget, actionOnFound = (p) => { return p; }) {
    let p = aWidget;
    while (typeof p != "undefined" && p != null) {
      if (p instanceof type) {
        return actionOnFound(p);
      }
      p = p.parent || p.parentElement;
      if (p instanceof HTMLElement) {
        p = p.widget || p;
      }
    }
    return false;
  }

  #attributes;

  constructor(aLabel = false, attribs = false) {
    this.label = aLabel;
    this.targetDoc = document;
    this.parent = null;
    this.#attributes = attribs;

    Object.defineProperty(this, "uuid", {
      value: self.crypto.randomUUID(),
      writable: false,
      configurable: false
    });
    Object.defineProperty(this, Symbol.for("_"), {
      enumerable: false, writable: false,
      value: `${new.target.name}`
    });
    nonEnumerable(this);
  }

  attributes(obj) { return Object.assign(this.htmlProxy(), obj); }
  inDoc(doc) { return this.targetDoc = doc, this; }

  insertInto(htmlElement, insertBeforeSibling) {
    this.parent = this.widget || htmlElement.widget || htmlElement;
    let element = this.element;
    element.widget = this;
    if (typeof this.#attributes == "object") {
      this.attributes(this.#attributes);
    }
    htmlElement.addBefore(insertBeforeSibling, element);

    return this;
  }

  get element() {
    interfaced();
  }

  set element(ele) {
    Object.defineProperty(this, "element", {
      configurable: true,
      writable: true,
      value: ele
    });
  }

  htmlProxy(create = true) {
    if (create) {
      return Widget.delegateProperties(this, this.element);
    }
    return this[Widget.PROXY_INSTANCE] || this;
  }
}

class Composite extends Widget {
  #children = [];
  #created = false;
  #containerTag = 'div';

  constructor(aLabel = '', ...rest) {
    super(aLabel);
    this.#containerTag = "div";
    rest.forEach(this.add, this);
  }

  useContainer(tag = 'div') { return this.#containerTag = tag, this; }

  add(child) {
    if (this.#children.includes(child)) {
      return this;
    }

    child.parent = this;
    this.#children.push(child);
    if (this.#created) {
      this.element.add(child);
    }
    return this;
  }

  get element() {
    return lazyGet(this, 'element', () => {
      this.#created = true;
      let result = DOM[this.#containerTag]({ widget: this }, this.targetDoc);
      return result.add(this.#children);
    });
  }
}

/**
 * a visually separated group with its own borders and title
 */
class BorderedGroup extends Composite {
  constructor(aTitle) {
    super(aTitle);
    super.add(DOM.h3({
      style: {
        position: 'absolute',
        backgroundColor: 'black',
        display: 'inline-block',
        padding: '0px 10px',
        left: '15px',
        top: '-12px',
        color: 'white',
        margin: '0'
      }
    }).add(aTitle));
  }

  get element() {
    let ele = super.element;
    //parent container gets some extra style
    Object.assign(ele.style, {
      border: '1px dotted white',
      backgroundColor: 'black',
      borderRadius: '10px',
      position: 'relative',
      margin: '10px',
      color: 'white',
      padding: '10px'
    })
    return ele;
  }
}

class Style extends Widget {
  static ELEMENT_NAME = Symbol.for("CSS_ELMNT_NAME");

  constructor(content) {
    super('CSS');
    this.element = DOM.style({ type: "text/css" });
    this.element.setAttribute("style", "display: none !important");
    this.addRule(content);
  }

  addRule(more = '') {
    if (more.isEmpty())
      return this

    this.element.textContent += more + '\n';
    return this;
  }

  /**
   * Uses meta-definitions on Widget subclasses to get correct html element tag names
   */
  ruleFor(type, addRestriction = '', body = '') {
    if (body.length == 0 && addRestriction.length > 0) {
      body = addRestriction;
      addRestriction = '';
    }

    if (typeof type[Style.ELEMENT_NAME] == "undefined") {
      return this;
    }

    return this.addRule(`${type[Style.ELEMENT_NAME]}${addRestriction} {${body}}`);
  }
}

/** 
 * A Widget linked to a config value. This will by default just print the value of the key.
 */
class OptionWidget extends Widget {

  #parent;
  #parentGroup = false;
  #parentKey = "";
  #forceAutoUpdateMode;

  constructor(aLabel, keyPath = false, defaultValue = '', handler = ValueType.STRING) {
    super(aLabel);
    if (!keyPath) throw 'key is required';

    this.id = this.key = keyPath;
    this.default = defaultValue;
    this.typeHandler = handler;
    this.changeListener = NOOP;
    Object.defineProperty(this, "input", {
      configurable: true,
      get() {
        interfaced('input must be defined and provide get/set value');
      },
      set(ip) {
        Object.defineProperty(this, "input", {
          writable: true,
          configurable: true,
          value: ip
        });
      }
    });
  }

  // ----- Builder methods for configuration -----
  autoUpdate(aAutoUpdate = true) { return this.#forceAutoUpdateMode = aAutoUpdate, this; }
  onChange(callback = NOOP) { return this.changeListener = callback, this; }

  // ----- API for Widget -----
  get element() {
    return lazyGet(this, "element", () => this.generateElement(this.targetDoc));
  }

  // ----- Option functionality related to config setting and value updates -----
  trackChanges(htmlElement, prop = 'value', type = 'change') {
    htmlElement.addEventListener(type, (evt) => this.updateCurrent(htmlElement[prop]));
  }

  /** change temporary stored value */
  updateCurrent(aNewValue) {
    aNewValue = this.typeHandler(aNewValue);
    if (this.current == aNewValue) {
      return;
    }

    this.current = aNewValue;

    if (false === this.changeListener(this.current)) {
      return this.revert();
    }

    if (this.autoUpdateConfigured) {
      return this.save();
    }

    this.#updateDisplay();
  }

  /** handles programmatic change of value */
  #updateDisplay(markChanged = this.#isChanged()) {
    let isDifferent = this.input.value != this.current;
    if (isDifferent) {
      this.input.value = this.current
    }

    if (markChanged) {
      this.element.style.fontWeight = 'bold';
      this.element.setAttribute("changeIndicator", "true");
    } else {
      this.element.style.fontWeight = 'normal';
      this.element.removeAttribute("changeIndicator");
    }
  }

  init() {
    this.value = this.current = CFG.get(this.key, this.default);
    this.#updateDisplay();
  }

  /** save temporary value to config */
  save(aNewValue) {
    if (typeof aNewValue !== 'undefined') {
      // do not use update current to allow direct usage of options in plugins for read/write
      this.current = this.typeHandler(aNewValue);
    }
    CFG.set(this.key, this.current);
    this.value = this.current;

    this.#updateDisplay();
  }

  /** undo change of temporary value, back to last value in CFG */
  revert() {
    this.current = this.value;
    this.#updateDisplay();
  }

  #isChanged() { return this.value != this.current; }

  get autoUpdateConfigured() {
    if (typeof this.#forceAutoUpdateMode == "boolean") {
      return this.#forceAutoUpdateMode;
    }
    return Widget.findNearestParentOfType(OptionGroup, this.parent, (p) => {
      return p.allowsAutosave();
    });
  }

  // ----- DOM element related which will be specific to concrete subtype -----
  generateElement() { return DOM.div({}, this.targetDoc).add(this.label).addText(': ' + this.value); }
  valueOf(){ return this.value; }
}

class LabeledText extends Widget {
  static [Style.ELEMENT_NAME] = 'label[kind="text"]';

  constructor(label, attributes = {}) {
    super(label, attributes);
  }

  get element() {
    return lazyGet(this, "element", () => {
      this.input = DOM.input({}, this.targetDoc)
      let lbl = DOM.label({ kind: 'text' }, this.targetDoc).add(this.label + ": ", this.input);
      return Widget.delegateProperties(lbl, this.input);
    });
  }

  get value() { return this.input.value; }
  set value(val) { this.input.value = val; }
}

class LabeledCheckbox extends Widget {
  static [Style.ELEMENT_NAME] = 'label[kind="check"]';

  constructor(label, attributes) {
    super(label, attributes);
  }

  get element() {
    return lazyGet(this, "element", () => {
      this.input = DOM.input({ type: 'checkbox' }, this.targetDoc);
      let label = DOM.label({ kind: 'check' }, this.targetDoc).add(this.input, " ", this.label);
      return Widget.delegateProperties(label, this.input);
    });
  }

  get value() { return this.input.checked; }
  set value(val) { this.input.checked = val; }
}

/**
 * Data class for radio groups and selects/dropdowns.
 */
function Entry(aKey, aValue, text = aValue, preselected = false) {
  if (this instanceof Entry) {
    this.key = aKey;
    this.value = aValue;
    this.text = text;
    this.selected = preselected;
  } else {
    return new Entry(aKey, aValue, text);
  }
}

/**
 * Label provided in constructor is used as 'name' on all radio buttons.
 * One name per group.
 * 
 * Interpretation of Entry-objects:
 * - key: id of element
 * - value: value attribute of radio
 * - text: what to display to the user. Defaults to value
 */
class LabeledRadioGroup extends Composite {

  #isConstructing = true;
  #radios = {};

  constructor(groupName, title, attributes = {}, ...entries) {
    super(title, attributes);
    this.groupName = groupName;

    if (typeof this.label != "undefined") {
      super.add((doc) => {
        return DOM.h3({}, doc).add(this.label);
      });
    }
    entries.forEach(this.add);
    this.#isConstructing = false;
  }

  add(entry) {
    if (entry instanceof Entry) {
      if (this.#isConstructing) {
        super.add(this.#elementForEntry.bind(this, entry));
      } else {
        super.add(this.#elementForEntry(entry));
      }
    } else {
      super.add(entry);
    }
  }

  #elementForEntry(entry, doc = this.targetDoc) {
    let radio = DOM.input({
      type: 'radio',
      //input radio: "name" is radio group variable name and must be shared 
      name: this.groupName,
      id: entry.key,
      value: entry.value
    }, doc);
    if (entry.selected) {
      radio.setAttribute("selected", "selected");
    }

    this.#radios[entry.value] = radio;

    return DOM.label({}, doc).add(radio, ' ' + entry.text);
  }

  get value() {
    for (r in Object.values(this.#radios)) {
      if (r.checked) {
        return r.value;
      }
    }
    return undefined;
  }

  set value(newVal) {
    if (typeof newVal == "undefined"
      || typeof this.#radios[newVal] == "undefined")
      return;

    this.#radios[newVal].checked = true;
  }
}

class LabeledDropDown extends Composite {

  #isConstructing = true;
  #select = {};

  constructor(label, attributes = {}, ...entries) {
    super(label, attributes);
    this.useContainer('label');

    let me = this;
    this.#select = new Composite("", {});
    this.#select.useContainer('select');
    Object.defineProperty(this.#select, "targetDoc", {
      get() { return me.targetDoc }
    });

    add(this.label);
    entries.forEach(this.add);
    this.#isConstructing = false;
  }

  add(entry) {
    if (entry instanceof Entry) {
      if (this.#isConstructing) {
        super.add(this.#elementForEntry.bind(this, entry));
      } else {
        super.add(this.#elementForEntry(entry));
      }
    } else {
      super.add(entry);
    }
  }

  #elementForEntry(entry, doc = this.targetDoc) {
    if (Array.isArray(entry.value)) {
      let group = DOM.optgroup({ label: entry.text }, doc);
      entry.value.forEach(e => group.add(this.#elementForEntry(e, doc)));
      return group;
    }
    let opt = DOM.option({ value: entry.value }, doc).add(entry.text);
    if (entry.selected) {
      opt.setAttribute("selected", "selected");
    }
    return opt;
  }

  get value() { return this.#select.value; }
  set value(newVal) { this.#select.value = newVal; }
}