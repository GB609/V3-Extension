/**
 * @Object
 * @param aSize
 *          {x:css-value,y:css-value}, css-value: auto|#px|#%
 * @param aPosition
 *          center|pointer|{x:#px|#%,y:#px|#%}
 */
function MessageWindow(aSize, aPosition) {
  this.styleSetting = {};
  if(typeof aSize === 'string'){
    this.styleSetting.width = aSize; 
    this.styleSetting.height = aSize;
  } else {
    this.styleSetting.width = aSize.x; 
    this.styleSetting.height = aSize.y;
  }
  this.position = aPosition;
  this.showOnContentChange = false;
  this.closeOnHide = false;

  this.divOverlay = null;
  this.composite;
  this.frame = null;
  
  var maxValues = {};
  
  // function hook for position recalculation
  this.positionCalc;
  
  var that = this;
  
  function updateMaxSizes(){
    var boundingRect = document.body.getBoundingClientRect();
    if(typeof that.styleSetting.width === 'string' && that.styleSetting.width.endsWith('%')){
      maxValues.x = 100;
    } else {
      maxValues.x = boundingRect.width;
    }
    if(typeof that.styleSetting.height === 'string' && that.styleSetting.height.endsWith('%')){
      maxValues.y = 100;
    } else {
      maxValues.y = boundingRect.height;
    }
  }
  
  function positionByPointer(trigger){
    var style = that.styleSetting;
    style.left = trigger.clientX;
    style.top = trigger.clientY;
  }
  
  function positionByCenter(){
    updateMaxSizes();
    var size = that.styleSetting;
    if(size.width == 'auto' || size.height == 'auto'){
      throw 'position [center] not possible with value [auto] for sizes';
    }
    size.left = (maxValues.x - parseFloat(size.width))/2 + (''+size.width).replace(/[\d\.]+/, '');
    size.top =  (maxValues.y - parseFloat(size.height))/2 + (''+size.height).replace(/[\d\.]+/, '');
  }
  
  function positionManual(){
    that.styleSetting.left = that.position.x;
    that.styleSetting.top = that.position.y;
  }
  
  if(typeof aPosition === 'undefined'){
    this.position = "center";
  }
  if (this.position == "center") {
    this.positionCalc = positionByCenter;
  } else if (this.position == "pointer") {
    this.positionCalc = positionByPointer;
  } else {
    this.positionCalc = positionManual;
  }
  
  this.constructWindow = function(){
    if(that.divOverlay){
      return;
    }
    that.divOverlay = DOM.div({
      style : 'position:fixed; width:100%; height:100%; left:0; top:0; display:none;'
    });
    that.composite = DOM.div({
      style : 'position:absolute; padding:25px; background-color: black; border: 3px outset;'
    });
    
    that.divOverlay.add(that.composite);
    that.divOverlay.addEventListener('click', function(){that.hide();});
    
    document.body.add(that.divOverlay);
  }

  this.constructWindow();
}

(function(t) {
  t.prototype.show = function(trigger) {
    this.constructWindow();
    
    // calc position
    this.positionCalc(trigger);
    
    var that = this;
    this.styleSetting.forEach(function(key, value){
      that.composite.style[key] = value;
    });
    
    this.divOverlay.style.display = 'block';
  };
  
  t.prototype.hide = function() {
    if(this.closeOnHide){
      this.close();
    } else {
      this.divOverlay.style.display = 'none';
    }
  };
  t.prototype.close = function() {
    if(this.divOverlay){
      this.divOverlay.parentElement.removeChild(this.divOverlay);
      this.divOverlay = false;
      this.frame = null;
    }
  };
  t.prototype.isVisible = function() {
    return this.divOverlay != null && this.divOverlay.style.display == 'block';
  };
  t.prototype.addText = function(lines){
    
  };
  t.prototype.addElement = function(ele, aShow) {
      this.constructWindow();
      this.composite.appendChild(ele);
      
      if(aShow || this.showOnContentChange){
        this.show();
      }
  };
  t.prototype.openUrl = function(url, aShow) {
    this.clean();
    this.frame = DOM.iframe({id:'MessageWindow-Frame', src:url});
    this.addElement(this.frame, aShow);
  };
  t.prototype.clean = function(){
    if(this.divOverlay){
      while(this.composite.hasChildNodes()){
        this.composite.removeChild(this.composite.firstChild);
      }
    }
  }  

  t.prototype.onClick = function(handler) {
    this.divOverlay.addEventListener('click', handler);
  };
})(MessageWindow);
