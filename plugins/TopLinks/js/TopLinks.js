(function() {

	var doc = document;
  var naviCssScript = '.topLink{display:table-cell;padding: 0 10px;}';

  var expected = ['Statistiken', 'Staatstatistik', 'Rohstoffe', 'vztime', 'Diplomatie', 'Allianzen'];

  function execute() {
  	var links = htmlLinkCollectionToDict(DOM.byTag('a'));
  	links['vztime'] = doc.getElementById('vztime');
  	
    // insert stylesheet
    var customStyle = DOM.style({
      "type" : "text/css"
    });
    doc.head.appendChild(customStyle.addText(naviCssScript));

    var newDiv = DOM.div({
      'style' : 'position:absolute; top:5px; left:310px; display:inline-block; width:calc(100% - 490px);'
    });
    links.vztime.parentElement.insertBefore(newDiv, links.vztime);

    var res = DOM.a({
      "href" : "rohstoffeglobal.php",
      "target" : "main"
    }).addText("Rohstoffe");
    links["Rohstoffe"] = res;

    expected.forEach(function(key) {
      var current = links[key];
      if (typeof current === "undefined") {
        return;
      }

      current.removeAttribute("style");
      current.setAttribute('class', 'text topLink');
      newDiv.appendChild(current);
    });

    links.vztime.setAttribute('style', 'width:100%; text-align:center;');
  };

  // index.php kann auch vor login aufgerufen werden. Führe das plugin aber nur aus, wenn eingeloggt.
  let plugin = new Plugin("TopLinks");
  plugin.execute = isLoggedInVZ() ? execute : ()=>{};
  
  return plugin.run();
})();