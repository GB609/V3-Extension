function classSerializer(){	this["_"] = this.constructor.name; return this; }
function classDeserializer(key, value){
	if(value instanceof Object && typeof value["_"] != "undefined"){
		try{
			var des = Object.create(eval.call(null, value["_"]).prototype);
			delete value["_"];
			return Object.assign(des, value);
		} catch (e) {	return null;	}
 	} else if(value instanceof Object || value instanceof Array){
 		for(let key in value) {
 			if(value[key] == null) return undefined;
 		}
 	} else if (value == null){
 		return undefined;
 	}
	return value;
}

function Serializable(){};
Serializable.prototype.toJSON = classSerializer;

Object.prototype.forEach = function(action, context){
  var keys = Object.keys(this);
  for(var i = 0, length = keys.length; i < length; i++){
    action(keys[i], this[keys[i]], context);
  }
};
Object.prototype.isEmpty = function(){
	return Object.keys(this).length == 0;
};
Object.prototype.inherits = function(type){
  var that = this;
  that.prototype = Object.create(type.prototype);
  that.prototype.constructor = that;
  that.prototype.parent = type.prototype;
  
  return that;
};

Array.prototype.isEmpty = function(){
	return this.length == 0;
};

String.format = function(format, ...params){
  let sections = format.split('{}');
  let result = "";
  while(sections.length > 0){
    result += sections.shift() + (params.shift() || "");
  }
  return result;
};

/**
 * add given text as node and returns the owner
 */
Element.prototype.addText = function(text) {
  this.appendChild(this.ownerDocument.createTextNode(text));
  return this;
};

/**
 * like appendChild, but returns itself instead of child element
 * 
 * @param element
 */
Element.prototype.add = function(element) {
  if(typeof element === 'string'){
    return this.addText(element);
  } else if(element instanceof Widget){
    return this.appendChild(element.node);
  }
  this.appendChild(element);
  return this;
};

Element.prototype.br = function() {
  this.appendChild(this.ownerDocument.createElement("br"));
  return this;
};

Element.prototype.wipe = function(){
  while(this.hasChildNodes()){
    this.removeChild(this.firstChild);
  }
};