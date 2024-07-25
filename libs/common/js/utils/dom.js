var DOM = {
  byId: function(aID, source) {
    if (source && (source.ownerDocument || source.nodeType == document.DOCUMENT_NODE)) {
      return (source.ownerDocument || source).getElementById(aID);
    }
    return document.getElementById(aID);
  },

  byTag: function(tag, source = document) { return source.getElementsByTagName(tag); },

  byAttribute: function(tag, key, value, source = document) {
    let xpath = String.format('//{}[@{}="{}"]', tag, key, value);
    let evalSource = source.ownerDocument || source;
    return evalSource.evaluate(xpath, source, null, XPathResult.ANY_TYPE, null).iterateNext();
  },

  elemnt: function(type, attribs, targetDoc = document) {
    var ele = targetDoc.createElement(type);
    return this.applyAttributes(ele, attribs);
  },

  applyAttributes: function(element, attributes = false) {
    if (attributes) {
      attributes.forEach(function(i, val) {
        if (i == 'style' && typeof val === 'object') {
          val.forEach(function(key, st) {
            element.style[key] = st;
          });
        } else if (typeof val === "string") {
          element.setAttribute(i, val);
        } else {
          element[i] = val;
        }
      });
    }
    return element;
  },

  collectionAsMap(collection) {
    var result = {};
    for (var i = 0; i < collection.length; i++) {
      let ele = collection[i];
      let key = ele.getAttribute("id") || ele.innerText;
      result[key] = ele;
    }
    return result;
  }
};
// wrap in proxy to allow to dynamically create factory methods for dom elements
// Factory methods can also directly be added to widgets 
DOM = new Proxy(DOM, {
  get: function(target, name) {
    if (!(name in target)) {
      target[name] = function(attribs = {}, doc = document) {
        //if the first argument is a document element, no attributes were given.
        //swap arguments and provide empty default attribs
        if (attribs && attribs.nodeName == "#document") {
          return target.elemnt(name, {}, attribs);
        }
        return target.elemnt(name, attribs, doc);
      };
      target[name][Style.ELEMENT_NAME] = name;
    }
    return target[name];
  }
});
unsafeWindow.DOM = DOM;