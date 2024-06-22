var DOM = {
  byId : function(aID, source) {
    if (source && (source.ownerDocument || source.nodeType == document.DOCUMENT_NODE)) {
      return (source.ownerDocument || source).getElementById(aID);
    }
    return document.getElementById(aID);
  },

  byTag : function(tag, source) {
  	return (source || document).getElementsByTagName(tag);
  },

  byAttribute : function(tag, key, value, source) {
    let xpath = String.format('//{}[@{}="{}"]', tag, key, value);
    let evalSource = source.ownerDocument || source;
    return evalSource.evaluate(xpath, (source || document), null, XPathResult.ANY_TYPE, null).iterateNext();
  },

  elemnt : function(type, attribs, targetDoc) {
    var ele = (targetDoc || document).createElement(type);

    if (attribs) {
      attribs.forEach(function(i, val) {
        if (i == 'style' && typeof val === 'object') {
          val.forEach(function(key, st) {
            ele.style[key] = st;
          });
        } else if(typeof val === "string"){
          ele.setAttribute(i, val);
        } else {
          ele[i] = val;
        }
      });
    }

    return ele;
  },
};
// wrap in proxy to allow to dynamically create factory methods for dom elements
DOM = new Proxy(DOM, {
  get : function(target, name) {
    if (!(name in target)) {
      target[name] = function(...allArgs) {
        return target.elemnt(name, ...allArgs);
      };
    }
    return target[name];
  }
});