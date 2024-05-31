(function() {

  class LogEntry {
    constructor(aLevel, aMessage) {
      this.level = LogEntry.aligned(aLevel);
      this.message = aMessage;
      this.time = new Date();
    }
    toString() {
      return this.time.toString() + this.level + this.message.toString();
    }

    static aligned(aLevel) {
      switch (aLevel.length) {
        case 4:
          return ' [' + aLevel + ' ] ';
        case 5:
          return ' [' + aLevel + '] ';
        default:
          return ' [' + aLevel.substring(0, Math.min(5, aLevel.length - 1)) + '] ';
      }
    }
  }

  function _LOGGER() {
    this.LOG_KEY = "LG_LEVELS";
    var LOG_CONTROL = CFG.get(this.LOG_KEY, {
      'info' : true,
      'warn' : true,
      'debug' : true,
      'error' : true
    });

    var _logs = [];
    
    function addEntry(aLevel, aMessage) {
      if (LOG_CONTROL[aLevel]) {
        if (_logs.length > 15) {
          _logs = [];
        }

        _logs.push(new LogEntry(aLevel, aMessage));
      }
    }

    this.info = function(...objects) {
      addEntry("info", objects);
    };

    this.warn = function(...objects) {
      addEntry("warn", objects);
    };

    this.error = function(...objects) {
      addEntry("error", objects);
      console.log(window.location.pathname, '[error]:', ...objects);
    };

    this.debug = function(...objects) {
      addEntry("debug", objects);
      console.log(...objects);
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

if (window.self == window.top) {
    console.log(window.location.href, "initiating LOGGER");
    LOGGER = new _LOGGER();
    window.LOGGER = LOGGER;
  } else if(window.top.LOGGER) {
    console.log(window.location.href, "picking up logger from top");
    LOGGER = window.top.LOGGER;
    window.LOGGER = LOGGER;
  } else {
    console.log("no logger on top and top is not first!");
  }
  console.log(LOGGER, window.LOGGER);
})();

window.addEventListener('error', function(e) {
  LOGGER.error(e.message);
}, true);
