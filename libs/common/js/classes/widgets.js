function interfaced(text = 'Not implemented.') { throw text; }
function NOOP() { }
function lazyGet(obj, prop, factory, canChange = false) {
  let data = factory();
  Object.defineProperty(obj, prop, { value: data, writable: canChange });
  return data;
}

class Widget {
  static #keepProperty(me, p) {
    try {
      return typeof me[p] != "undefined" || typeof me.element[p] === "undefined";
    } catch (e) {
      return true;
    }
  }

  constructor(aLabel = false) {
    this.label = aLabel;
    this.targetDoc = document;
    this.beforeAdd = NOOP;
  }

  inDoc(doc) { return this.targetDoc = doc, this; }

  insertInto(htmlElement) {
    this.parent = htmlElement.widget || htmlElement;
    let element = this.element;
    element.widget = this;
    htmlElement.add(element);
    return this;
  }

  get element() {
    interfaced();
  }
  
  set element(ele){
    Object.defineProperty(this, "element", {
      configurable: true,
      writable: true,
      value: ele
    });
  }

  htmlProxy() {
    return new Proxy(this, {
      get(t, p) {
        if (Widget.#keepProperty(t, p)) {
          return t[p];
        }
        let inner = t.element[p];
        if (typeof inner == "function") {
          return inner.bind(t.element);
        }
        return inner;
      },
      set(t, p, v) {
        if (Widget.#keepProperty(t, p)) {
          t[p] = v;
        } else {
          t.element[p] = v;
        }
        return true
      }
    });
  }
}

class Composite extends Widget {
  #children = [];
  #created = false;

  constructor(aLabel = '', ...rest) {
    super(aLabel);
    this.containerTag = "div";
    rest.forEach(this.add, this);
  }

  useContainer(tag = 'div') { this.containerTag = tag; }

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
      let result = DOM[this.containerTag]({ widget: this }, this.targetDoc);
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
  constructor(content) {
    super('CSS');
    this.element = DOM.style({ type: "text/css" });
    this.element.innerText = content;
  }

  addRule(more) {
    this.element.innerText += '\n' + more;
  }
}

/** 
 * A Widget linked to a config value. This will by default just print the value of the key.
 */
class OptionWidget extends Widget {

  #parentKey = "";
  #ownKey = "";

  constructor(aLabel, keyPath = false, defaultValue = '', handler = ValueType.STRING) {
    super(aLabel);
    if (!keyPath) throw 'key is required';

    this.#ownKey = this.key = keyPath;
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
  autoUpdate(aAutoUpdate = true) { return this.autoUpdateCfg = aAutoUpdate, this; }
  onChange(callback = NOOP) { return this.changeListener = callback, this; }

  // ----- API for Widget -----
  get element() {
    return lazyGet(this, "element", () => this.generateElement(this.targetDoc));
  }

  // ----- Option functionality related to config setting and value updates -----

  set parent(aParent) {
    this.#parentKey = "";
    let p = aParent;
    while (typeof p != "undefined") {
      if (p instanceof OptionGroup) {
        this.#parentKey = p.key + '.';
        break;
      }
      p = p.parent;
    }
    this.key = this.#parentKey + this.#ownKey;
    this.value = CFG.get(this.key, this.current);
  }

  trackChanges(htmlElement, prop = 'value', type = 'change') {
    htmlElement.addEventListener(type, (evt) => this.updateCurrent(htmlElement[prop]));
  }

  /** change temporary stored value */
  updateCurrent(aNewValue) {
    this.current = this.typeHandler(aNewValue);
    if (this.autoUpdateCfg) {
      this.save();
    }
    this.#updateDisplay();
  }

  /** handles programmatic change of value */
  #updateDisplay() {
    if (this.#isChanged()) {
      this.element.style.fontWeight = 'bold';
      this.input.value(this.current);
      this.changeListener(this.current);
    } else {
      this.element.style.fontWeight = 'normal';
    }
  }

  /** save temporary value to config */
  save() {
    if (typeof aNewValue !== 'undefined') {
      // do not use update current to allow direct usage of options in plugins for read/write
      this.current = this.typeHandler(aNewValue);
    }
    CFG.set(this.key, this.current);
    this.value = this.current;
  }

  /** undo change of temporary value, back to last value in CFG */
  revert() {
    this.current = this.value;
    this.#updateDisplay();
  }

  #isChanged() { return this.value != this.current; }

  // ----- DOM element related which will be specific to concrete subtype -----
  generateElement() {
    return DOM.div({}, this.targetDoc).add(this.label).addText(': ' + this.value);
  }
}

class LabeledText extends Widget {
  constructor(label, attributes = {}) {
    super(label);
    this.attributes = attributes;
  }

  get element() {
    return lazyGet(this, "element", () => {
      this.input = DOM.input({}, this.targetDoc)
      return DOM.span(this.attributes, this.targetDoc).add(this.label + ": ", this.input);
    });
  }

  get value() { return this.input.value; }
  set value(val) { this.input.value = val; }
}

class LabeledCheckbox extends Widget {
  constructor(label, attributes = {}) {
    super(label);
    this.attributes = attributes;
  }

  get element() {
    return lazyGet(this, "element", () => {
      this.input = DOM.input({ type: 'checkbox' }, this.targetDoc);
      return DOM.label(this.attributes, this.targetDoc).add(this.input, " ", this.label);
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
    super(title);
    this.groupName = groupName;
    this.attributes = attributes;

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
    super(label);
    this.useContainer('label');
    this.attributes = attributes;

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