function MessageConsole(target) {
  this.targetElement;

  if (typeof target === 'string') {
    this.targetElement = DOM.byId(target);
  } else if (typeof target === 'object' && target.nodeType === 1) {
    this.targetElement = target;
  } else {
    this.targetElement = document.body.add(DOM.div({
      id : 'gb_messageConsole',
      style : 'display:block;'
    }));
  }
}

(function(type) {
  type.prototype.show = function() {
    this.targetElement.style.display = 'block';
  };

  type.prototype.hide = function() {
    this.targetElement.style.display = 'none';
  };

  type.prototype.isVisible = function() {
    return this.targetElement.style.display != 'none';
  }

  type.prototype.clear = function() {

  };

  type.prototype.addMessage = function(lines) {
    //add lines
    
    this.targetElement.br();
    if(!this.isVisible()){
      this.show();
    }
  };
})(MessageConsole);