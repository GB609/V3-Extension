function classSerializer() { this["_"] = this.constructor.name; return this; }
function classDeserializer(key, value) {
  if (value instanceof Object && typeof value["_"] != "undefined") {
    try {
      var des = Object.create(eval(value["_"]).prototype);
      delete value["_"];
      return Object.assign(des, value);
    } catch (e) {
      console.log("deserialization with custom type failed - return plain json");
      return value;
    }
  } else if (value instanceof Object || value instanceof Array) {
    for (let key in value) {
      if (value[key] == null) return undefined;
    }
  } else if (value == null) {
    return undefined;
  }
  return value;
}

function Serializable() { };
Serializable.prototype.toJSON = classSerializer;

Object.defineProperties(Object.prototype, {
  forEach: {
    value: function(action, context) {
      var keys = Object.keys(this);
      for (var i = 0, length = keys.length; i < length; i++) {
        action(keys[i], this[keys[i]], context);
      }
    }
  },

  isEmpty: {
    value: function() { return Object.keys(this).length == 0; }
  },

  inherits: {
    value: function(type) {
      var that = this;
      Object.setPrototypeOf(that.prototype, type.prototype);
      this.initWithSuper = function(params = [], subclassInit) {
        let superConst = Object.getPrototypeOf(that.prototype).constructor;
        let created = Reflect.construct(superConst, params, that);

        if (typeof subclassInit == "function") {
          subclassInit.call(created);
        }

        return created;
      }
      return that;
    }
  }
});

Object.defineProperty(Array.prototype, "isEmpty", {
  value: function() {
    return this.length == 0;
  }
});

String.format = function(format, ...params) {
  let sections = format.split('{}');
  let result = "";
  while (sections.length > 0) {
    result += sections.shift() + (params.shift() || "");
  }
  return result;
};

Object.defineProperties(Element.prototype, {
  /**
   * add given text as node and returns the owner
   */
  addText: {
    value: function(text) {
      this.appendChild(this.ownerDocument.createTextNode(text));
      return this;
    }
  },

  /**
   * like an extended version of appendChild, but returns itself instead of child element.
   * Handles strings, Widgets, Nodes, function(document)-creators and arbitrarily mixed arrays of all these.
   * Also uses a ...rest parameter, so multiple objects can just be passed in code directly without wrapping.
   * 
   * @param element
   */
  add: {
    value: function(...element) {
      if (element.length > 1) {
        for (let e of element) { this.add(e); }
        return this;
      }

      element = element.pop();
      if (Array.isArray(element)) {
        for (let e of element) { this.add(e); }
        return this;
      }

      if (typeof element === 'string') {
        return this.addText(element);
      }

      if (element instanceof Widget) {
        return element.insertInto(this), this;
      }

      //element to add is a supplier function. pass ownerDocument as first argument.
      if (typeof element == "function") {
        return this.add(element(this.ownerDocument));
      }

      return this.appendChild(element), this;
    }
  },
  br: {
    value: function() {
      this.appendChild(this.ownerDocument.createElement("br"));
      return this;
    }
  },

  wipe: {
    value: function() {
      while (this.hasChildNodes()) {
        this.removeChild(this.firstChild);
      }
    }
  }
});