(function() {
	var RES_TABLE = DOM.byTag('table')[0];
	
	function GlobalResource(aName) {
		this.myName = aName;
		this.entries = {};
		this.myTotalChange = 0;
		this.myTotalReserve = 0;
	}
	GlobalResource.prototype.add = function(provName, aProvRes) {
		this.myTotalChange += aProvRes.ch;
		this.myTotalReserve += aProvRes.res;
		this.entries[provName] = aProvRes;
	};

  function updateGlobalTable(provList, globalData) {
    var rows = RES_TABLE.rows;

    for(var row = 1; row < rows.length; row++) {
      let current = rows[row];
      var tds = current.cells;

      let resName = parseResourceName(tds[0]);
      if(typeof globalData[resName] == "undefined") continue;

      var firstColClass = tds[1].getAttribute("class");

      globalData[resName].entries.forEach((key, resource) => {
      	 if (resource.ch != 0) {
           var targetTD = tds[provList[key]];
           targetTD.innerHTML = String.format('{} ({})', targetTD.innerHTML, resource.ch); 

           if(resource.ch > 0){
           	targetTD.setAttribute("class", targetTD.getAttribute("class") + " hinweis1");
           } else if ((resource.ch + resource.res) <= 0) {
             targetTD.setAttribute("class", targetTD.getAttribute("class") + " hinweis8");
           } else if ((resource.ch + resource.st) <= 0) {
             targetTD.setAttribute("class", targetTD.getAttribute("class") + " hinweis5");
           }
         }
      });

      var newCol = DOM.td();
      newCol.innerHTML = rounded(globalData[resName].myTotalChange);
      if (globalData[resName].myTotalChange < 0) {
        newCol.setAttribute("class", firstColClass + " hinweis8");
      } else if (globalData[resName].myTotalChange > 0) {
        newCol.setAttribute("class", firstColClass + " hinweis1");
      } else {
        newCol.setAttribute("class", firstColClass);
      }

      current.appendChild(newCol);
    }

    TEMPLATE.inject(RES_TABLE.parentElement, "tableDescription", null, RES_TABLE);
  }

  function retrieveAndShowResourceData() {
    try {
      let provColumns = {}; 
      var links = DOM.byTag("a", RES_TABLE.rows[0]);
      var pattern = /(\w+)[.\s]*\((\d+\/\d+)\)/;

      let globalData = {};
      for(var i = 0; i < links.length; i++) {
        var data = pattern.exec(links[i].innerText);
        next = {"name" : data[1], "coord" : data[2]};
        provColumns[next.coord] = i+1;
                  
        CACHE.get('resUsage.'+next.coord, {}).forEach((key, val) => {
          if (!globalData[key]) {
          	globalData[key] = new GlobalResource(key);
          }

          globalData[key].add(next.coord, val);
        });
      }
      
      updateGlobalTable(provColumns, globalData);
    } catch (e) {
      LOGGER.error(e);
    }
  }

  function initialize() {
    var firstTd = RES_TABLE.rows[0].cells[0];
    var resButton = DOM.button({
      "id" : "resButton"
    }).addText('Verbrauch');
    firstTd.appendChild(resButton);
    firstTd.style.textAlign = "center";
  };
  
  let plugin_Rohstoffe = new Plugin("Rohstoffe", {
  	eventListener : [{target:"resButton", type:"click", listener:retrieveAndShowResourceData}],
  	execute : initialize
  });

  return plugin_Rohstoffe.run();
})();