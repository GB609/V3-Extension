var LOGGER = {
  info : function(object) {},
  warn : function(object) {},
  error : function(object) {},
  debug : function(object) {},
  printToConsole : function() {},
  doesitwork:function(){}
};

var TEMPLATE = {
  asText : function(tplName) {},
  asDom : function(tplName) {},
  inject : function(parentElement, aTemplateName, containerAttributes) {},
  injectSource : function(parentElement, aSource, containerAttributes) {},
  injectDom : function(parentElement, elementToInject, nextSibling){}
};

class V3Plugin{
  constructor(){}
  getOptions(){}
  execute(){}
}