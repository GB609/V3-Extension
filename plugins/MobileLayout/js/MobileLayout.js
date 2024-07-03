(function() {
  
  var OPTIONS = OptionGroup('UI', 'Optionen: UI Anpassungen',
    TEMPLATE.asDom('pluginDesc'),
    new Style()
      .ruleFor(OptionGroup, ' .optionGroup', `
        border: 2px dotted lightgrey;
        border-radius: 5px;
        padding:5px;
        margin:5px 0px;`)
      .ruleFor(DOM.h4, "margin-top:5px")
      .ruleFor(CheckOption, "display: block"),
    
    OptionGroup('PROV', false,
      DOM.h4().add('In Provinzen'), 
      CheckOption('settings', 'Zivil:Einstellungen mit DropDowns und Schiebereglern modernisieren', true),
      CheckOption('cleanUpBuildSelection', 'Unbaubares im Feld-Baumenü ausblenden (Uniques, Küste, Land)', false).attributes({disabled: true})
    ),
    OptionGroup('TABLES', false,
      DOM.h4().add('Tabellen allgemein'),
      CheckOption('markFilter', 'Eingestellte Filter bei vor/zurück Navigation merken', false).attributes({disabled: true}),
      CheckOption('enlargeLinks', 'Links vergrößern', false).attributes({disabled: true}),
      CheckOption('entryNameAsLink', 'Info-Tabellen: Link/ID spalten ausblenden. Eigentliche Bezeichnung (i.d.R. 3. Spalte) wird zu Link.', false).attributes({disabled: true})
    ),
    OptionGroup('MOBILE', false,
      DOM.h4().add('Speziell für kleine Bildschirme/Smartphones'),
      CheckOption('hideVSColumns', 'Vorschau: Mittlere Spalten ausblenden (und zusammenfassen). Ergänzt auch einen Button zum ausklappen.', false).attributes({disabled: true})
    )
  )
	
	var curLoc = window.location.pathname.replace(/\//, '').toLowerCase();
	var curLocId = curLoc.replace(".", "_");

  function replaceVars(varList, target) {
    for( var key in varList) {
      var pattern = new RegExp("{{" + key + "}}", 'g');
      target = target.replace(pattern, varList[key]);
    }

    return target;
  }
  
  this.provinz_php = function(){
    
  }

  this.einstellungen_php = function() {
    if(!OPTIONS.PROV.settings){
      return;
    }
    
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
          continue;
      }

      replacements[inputVarName] = inputValue;
    }
    var replaced = replaceVars(replacements, template);
    var targetElement = existingForm.parentElement;
    targetElement.removeChild(existingForm);
    TEMPLATE.injectSource(targetElement, replaced);
  };

  let plugin_Mobile = new Plugin('${artifactId}', {
    title: 'UI Anpassungen',
    options: OPTIONS,
    execute:(this[curLocId] || function(){})
  });
  return plugin_Mobile.run();
}).call({});
