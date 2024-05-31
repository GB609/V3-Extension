(function(){
  var NAME = "Sync";
  
  var options = {};
  OPTIONS[NAME] = options;
  
  function plugin_Sync(){
    var SYNC_URL = "http://wolficotl.bplaced.net/v3/sync/";
    var KEY_SYNC_SWITCH = "SYNC_USE";
    
    this.info_php = function(){
      
    };

    this.execute = function(){
      
    };
  }
  
  return PLUGIN.execute("Sync", new plugin_Sync());
})();


function addSyncMarker(targetElement) {
  targetElement.add(elemnt("span").addText(" Synched? ").add(elemnt("span", {
    "id" : "SYNC_CHECK"
  })));
}

function notifySyncState(aState) {
  document.getElementById("SYNC_CHECK").innerText = aState;
}

function lockLogin() {
  var loginBtn = byAttribute("input", "type", "submit");
  loginBtn.value = "Synching...";
  loginBtn.enabled = false;
}

function unlockLogin() {
  var loginBtn = byAttribute("input", "type", "submit");
  loginBtn.value = "login";
  loginBtn.enabled = true;
}

function handleErrorResponse(requestObject) {
  // CFG.set(KEY_SYNC_SWITCH, false);
  notifySyncState("Fehler");
  window.alert(requestObject.statusText + " - Sync vorübergehend deaktiviert.");
  unlockLogin();
}

function getToken(resultCallback) {
  ajax(SYNC_URL + "token.php?user=" + USER, null, function(tokenResponse) {
    var decoded = unescape(decodeURI(tokenResponse));
    var decrypted = rc4(PW, decoded);
    resultCallback(decrypted);
  }, handleErrorResponse);
}

function checkAndStoreSyncData(syncDataString) {
  var syncData = JSON.parse(syncDataString.trim());
  LOGGER.info("storing sync data... ");
  LOGGER.debug(syncData);
  var keys = Object.keys(syncData);
  keys.forEach(function(key) {
    CFG.persist(key, syncData[key]);
  });
}

function syncUpwards(resultCallback) {
  var syncData = CFG.getSyncData();
  getToken(function(token) {
    try {
      var keyCreator = eval(token);
      var url = SYNC_URL + "sync.php?token=" + encodeURIComponent(keyCreator.token());

      var enc = rc4(keyCreator.key(), JSON.stringify(syncData));
      var toSend = encodeURIComponent(enc);

      ajax(url, "jsonData=" + toSend, function(response) {
        console.log(response);
        resultCallback();
      }, handleErrorResponse);
    } catch (e) {
      console.log(e);
    }
  });
}

function syncDownwards(resultCallback) {
  lockLogin();

  getToken(function(token) {
    var keyCreator = eval(token);

    var url = SYNC_URL + "sync.php?token=" + encodeURIComponent(keyCreator.token());
    ajax(url, null, function(response) {
      try {
        var unesc = unescape(decodeURI(response));
        var decrypted = rc4(keyCreator.key(), unesc);
        checkAndStoreSyncData(decrypted);
        unlockLogin();
        notifySyncState("OK");
      } catch (e) {
        LOGGER.error(e);
        notifySyncState("Fehler");
      }
      unlockLogin();

    }, handleErrorResponse);
  });
}

function addSyncUpwards() {
  var logoutBtn = byAttribute("a", "href", "logout.php");
  logoutBtn.href = "javascript:;";
  logoutBtn.addEventListener("click", function() {
    syncUpwards(function() {
      window.main.location.href = "logout.php";
    });
  }, false);
}

if (isLoggedInVZ()) {
  if (CFG.get(KEY_SYNC_SWITCH)) {
    addSyncUpwards();
  };
} else if (USER.trim().length > 0 && PW.trim().length > 0) {
  addSyncMarker(byAttribute("input", "type", "submit").parentElement);
  CFG.set(KEY_SYNC_SWITCH, true);
  syncDownwards();
}