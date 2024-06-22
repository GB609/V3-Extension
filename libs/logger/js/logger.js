(function() {
  
  class LogEntry {
    constructor(aLevel, aMessage, ...rest) {
      this.level = LogEntry.aligned(aLevel);
      this.message = aMessage;
      this.more = rest;
      this.time = new Date();
      this.url = location.pathname;
    }
    toString() {
      return `[${this.url}] ${this.time.toString()} ${this.level} ${this.message.toString()} ${JSON.stringify(this.more, null, 2)}`;
    }
    consoleArgArray(){
      return [`[${this.url}] ${this.time.toString()} ${this.level}`, this.message, ...this.more];
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

  function _LOGGER(entryCache = []) {
    this.LOG_KEY = "LG_LEVELS";
    var LOG_CONTROL = CFG.get(this.LOG_KEY, {
      'info' : true,
      'warn' : true,
      'debug' : true,
      'error' : true
    });

    this._logs = entryCache;
    
    function addEntry(aLevel, aMessage) {
      if (LOG_CONTROL[aLevel]) {
        if (this._logs.length > 30) {
          this._logs.length = 0;
        }

        this._logs.push(new LogEntry(aLevel, aMessage));
      }
    }

    this.info = function(...objects) {
      addEntry.call(this, "info", objects);
    };

    this.warn = function(...objects) {
      addEntry.call(this, "warn", objects);
    };

    this.error = function(...objects) {
      addEntry.call(this, "error", objects);
    };

    this.debug = function(...objects) {
      addEntry.call(this, "debug", objects);
    };

    this.printToConsole = function() {
      try {
        this._logs.forEach(function(log) {
          console[log.level](...log.consoleArgArray());
        });
      } catch (e) {
        console.error(e);
      }
    };
  }

if (window.self == window.top) {
    console.info(window.location.href, "initiating LOGGER");
    LOGGER = new _LOGGER();
    window.LOGGER = LOGGER;
  } else if(window.top.LOGGER && window.top != window.self) {
    console.debug(window.location.href, "picking up logger from top");
    LOGGER = new _LOGGER(window.top.LOGGER._logs);
    window.LOGGER = LOGGER;
  } else {
    console.error("no logger on top and top was not first!");
  }
})();

window.addEventListener('error', function(e) {
  LOGGER.error(e.message);
}, true);
