(function(TEMPLATE) {
	var RES_TABLE = DOM.byTag('table')[0];
	
	var OPTIONS = OptionGroup('RESGLB', "Optionen: Rohstoffeglobal +/-",
    TEMPLATE.asDom('pluginDesc')
	).showButtons(false);
	
	function withSign(number){
    return number > 0 ? '+'+number : number;
  }
	
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
    let rows = RES_TABLE.rows;

    for(let row = 1; row < rows.length; row++) {
      let current = rows[row];
      let tds = current.cells;

      let resName = parseResourceName(tds[0]);
      if(typeof globalData[resName] == "undefined") continue;

      let firstColClass = tds[1].getAttribute("class");

      globalData[resName].entries.forEach((key, resource) => {
      	 if (resource.ch != 0) {
           let targetTD = tds[provList[key]];
           targetTD.innerHTML = String.format('{} ({})', targetTD.innerHTML, withSign(resource.ch)); 

           if(resource.ch > 0){
           	targetTD.setAttribute("class", targetTD.getAttribute("class") + " hinweis1");
           } else if ((resource.ch + resource.res) <= 0) {
             targetTD.setAttribute("class", targetTD.getAttribute("class") + " hinweis8");
           } else if ((resource.ch + resource.st) <= 0) {
             targetTD.setAttribute("class", targetTD.getAttribute("class") + " hinweis5");
           }
         }
      });

      let newCol = DOM.td();
      newCol.innerHTML = withSign(rounded(globalData[resName].myTotalChange));
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

  function reloadProvCache(coord){
    //not implemented yet
    return CACHE.get('resUsage.'+coord, {});
  }

  function retrieveAndShowResourceData() {
    try {
      let now = new Date().getTime();
	    
      let provColumns = {}; 
      let links = DOM.byTag("a", RES_TABLE.rows[0]);
      let pattern = /(\w+)[.\s]*\((\d+\/\d+)\)/;

      let globalData = {};
      for(let i = 0; i < links.length; i++) {
        let data = pattern.exec(links[i].innerText);
        let next = {"name" : data[1], "coord" : data[2]};
        provColumns[next.coord] = i+1;
                  
        let prov = CACHE.get('resUsage.'+next.coord, {});
        if(prov['#LAST_UPDATED'] > now){
          prov = reloadProvCache(next.coord);
        }
        prov.forEach((key, val) => {
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
    let firstTd = RES_TABLE.rows[0].cells[0];
    let resButton = DOM.button({
      "id" : "resButton"
    }).addText('Verbrauch');
    firstTd.appendChild(resButton);
    firstTd.style.textAlign = "center";
  };
  
  let plugin_Rohstoffe = new V3Plugin('${artifactId}', {
    title: 'Rohstoffeglobal +/-',
  	eventListener : [{target:"resButton", type:"click", listener:retrieveAndShowResourceData}],
  	options: OPTIONS,
  	execute : initialize
  });

  return plugin_Rohstoffe.run();
})(TEMPLATE.forPlugin('${artifactId}'));
