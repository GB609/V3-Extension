class TransportTask {
	constructor(aName, aSource, aTarget, aResList = {}) {
		this.name = aName;
		this.source = aSource;
		this.target = aTarget;
		this.transportSetting;
		this.resources = aResList;
	}
	
  addResource(aResPostName, amount) {
    this.resources[aResPostName] = amount;
  }

  /**
   * @returns String
   */
  getPostData() {
    var postData = [];
    this.resources.forEach((key, val)=>{
    	postData.push(key + '=' + val);
    });
    postData.push("provinzauswahl=" + this.target);
    postData.push("submitname=Transport");

    return postData.join('&');
  }

  /**
   * callback(TranportTable, TransportTask[this])
   */
  loadTable(tableReceiver) {
//    LOGGER.debug("load TransportTable for(name=" + this.name + ", " + this.source + " -> " + this.target + ")");
    var url = "transport.php?provinz=" + this.source;

    var postData = [ 'provinzauswahl=' + this.target, 'submitname=Ort w\u00e4hlen' ];

    getAsDom(url, postData.join('&'), function(doc, text, aTask) {
      try {
        tableReceiver(new TransportTable(doc), aTask);
      } catch (e) {
        LOGGER.error(e);
      }
    }, this);
  }

  execute(resultCallback) {
    var url = "transport.php?provinz=" + this.source;
    try {
      getAsDom(url, this.getPostData(), function(doc, text, task) {
        var resultReport = DOM.byAttribute("div", "class", "center", doc.body);
        var isSuccess = resultReport != null && resultReport.innerText.search("transportiert") > -1;

        resultCallback({
          successful : isSuccess,
          report : resultReport,
          message : resultReport.innerText
        });
      }, this);
    } catch (e) {
      LOGGER.error(e);
      resultCallback({
        successful : false,
        report : null,
        message : e
      });
    }
  }

  clear() {
    this.resources = {};
  }

  containsResource(aResName) {
    return typeof this.transportSetting.resources[aResName] != "undefined";
  }

  settingResources() {
    return this.transportSetting.resources;
  }

  configForResource(aResName) {
    return this.transportSetting.resources[aResName];
  }

  isEmpty() {
    return Object.keys(this.resources).length == 0;
  }

  static forSetting(aSetting) {
    var task = new TransportTask(aSetting.provName, CFG.CURRENT_PROV, aSetting.provName.split(' ')[0]);
    task.transportSetting = aSetting;
    return task;
  }
}