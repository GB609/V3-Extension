var LOGGER = {
  info : function(object) {},
  warn : function(onject) {},
  error : function(object) {},
  debug : function(object) {},
  printToConsole : function() {}
};

var TEMPLATE = {
  asText : function(tplName) {},
  asDom : function(tplName) {},
  inject : function(parentElement, aTemplateName, containerAttributes) {},
  injectSource : function(parentElement, aSource, containerAttributes) {},
  injectDom : function(parentElement, elementToInject, nextSibling){}
};

class Plugin{
  constructor(){}
  getOptions(){}
  execute(){}
}