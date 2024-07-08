(function() {

  class LogEntry {
    constructor(aLevel, aMessage, ...rest) {
      this.level = aLevel;
      this.levelFormatted = LogEntry.aligned(aLevel);
      this.message = aMessage;
      this.more = rest;
      this.time = new Date();
      this.url = location.pathname;
    }
    toString() {
      return `[${this.url}] ${this.time.toString()} ${this.levelFormatted} ${this.message.toString()} ${JSON.stringify(this.more, null, 2)}`;
    }
    consoleArgArray() {
      return [`[${this.url}] ${this.time.toString()} ${this.levelFormatted}`, this.message, ...this.more];
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
    this.OPTIONS = OptionGroup(this.LOG_KEY, 'Logging',
      DOM.p()
        .add("Bestimmt, wieviel und detailliert Fehlersuche-Information auf dem Rechner mitgeschnitten wird.").br()
        .add("Die meisten Meldungen werden standardmäßig nicht in der Entwicklerkonsole erscheinen sondern nur für Fehlerberichte zwischengespeichert, falls die Option dazu nicht aktviert ist."),
      CheckOption('info', 'Informationen', false),
      CheckOption('warn', 'Warnmeldungen', true),
      CheckOption('error', 'Ernsthafte Fehler', true),
      CheckOption('debug', 'Höchster Detailgrad', false),
      DOM.br,
      CheckOption('immediateOutput', 'Ausgabe auch auf Entwicklerkonsole', false)
    ).init();

    this._logs = entryCache;

    function addEntry(aLevel, aMessage) {
      if (this.OPTIONS[aLevel].value) {
        if (this._logs.length > 50) {
          this._logs.length = 0;
          this._logs.push(new LogEntry('debug', 'Dropped old log entries'))
        }

        let entry = new LogEntry(aLevel, aMessage);
        this._logs.push(entry);
        
        if(this.OPTIONS.immediateOutput == true){
          console[aLevel](...entry.consoleArgArray());
        }
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
  } else if (window.top.LOGGER && window.top != window.self) {
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
