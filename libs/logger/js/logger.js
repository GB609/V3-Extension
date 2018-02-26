var LOGGER;
(function() {
  function _LOGGER() {
    this.LOG_KEY = "LG_LEVELS";
    var LOG_CONTROL = CFG.get(this.LOG_KEY, {
      'info' : false,
      'warn' : false,
      'debug' : true,
      'error' : true
    });

    var _logs = [];

    function aligned(aLevel) {
      switch (aLevel.length) {
        case 4:
          return ' [' + aLevel + ' ] ';
          break;
        case 5:
          return ' [' + aLevel + '] ';
          break;
        default:
          return ' [' + aLevel.substring(0, Math.min(5, aLevel.length - 1)) + '] ';
      }
    }

    function LogEntry(aLevel, aMessage) {
      this.level = aLevel;
      this.message = aMessage;
      this.time = new Date();

      this.toString = function() {
        return this.time.toString() + aligned(this.level) + this.message.toString();
      };
    }

    function addEntry(aLevel, aMessage) {
      if (LOG_CONTROL[aLevel]) {
        if (_logs.length > 15) {
          _logs = [];
        }

        _logs.push(new LogEntry(aLevel, aMessage));
      }
    }

    this.info = function(object) {
      addEntry("info", object);
    };

    this.warn = function(onject) {
      addEntry("warn", object);
    };

    this.error = function(object) {
      addEntry("error", object);
      console.log(window.location.pathname, '[error]:', ...arguments);
    };

    this.debug = function(object) {
      addEntry("debug", object);
      console.log(object);
    };

    this.printToConsole = function() {
      try {
        _logs.forEach(function(log) {
          console.log(log.toString());
        });
      } catch (e) {
        console.log(e);
      }
    };
  }

  if (window.parent.LOGGER) {
    LOGGER = window.parent.LOGGER;
  } else {
    LOGGER = new _LOGGER();
    window.parent.LOGGER = LOGGER;
  }
  window.LOGGER = LOGGER;
})();

window.addEventListener('error', function(e){
	LOGGER.error(e.message);
}, true);
