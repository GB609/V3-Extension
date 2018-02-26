(function() {
	
	var curLoc = window.location.pathname.replace(/\//, '').toLowerCase();
	var curLocId = curLoc.replace(".", "_");

  function replaceVars(varList, target) {
    for( var key in varList) {
      var pattern = new RegExp("{{" + key + "}}", 'g');
      target = target.replace(pattern, varList[key]);
    }

    return target;
  }

  this.einstellungen_php = function() {
  	var template = TEMPLATE.asText(curLocId);
  	
    var existingForm = DOM.byTag("form")[0];
    var inputs = DOM.byTag("input", existingForm);
    var replacements = {};
    for(var i = 0; i < inputs.length; i++) {
      var input = inputs[i];
      var inputVarName;
      var inputValue = '';
      switch (input.type) {
        case "radio" :
          inputVarName = input.name + input.value;
          inputValue = input.checked ? 'selected="selected"' : '';
          break;

        case "checkbox" :
          inputVarName = input.name;
          inputValue = input.checked ? 'checked="checked"' : '';
          break;

        case "text" :
        case "number" :
          inputVarName = input.name;
          inputValue = input.value;
          break;

        default :
          console.log("other input: " + input.type);
          continue;
      }

      replacements[inputVarName] = inputValue;
    }
    console.log(replacements);
    var replaced = replaceVars(replacements, template);
    var targetElement = existingForm.parentElement;
    targetElement.removeChild(existingForm);
    TEMPLATE.injectSource(targetElement, replaced);
  };

  let plugin_Mobile = new Plugin("MobileLayout", {execute:(this[curLocId] || function(){})});
  return plugin_Mobile.run();
}).call({});
