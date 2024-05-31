function Widget(aLabel) {
  this.label = aLabel;
  this.node;
}

function Group(aTitle) {
  Widget.call(this, aTitle);

  var n = DOM.div({
    style : {
      border : '1px dotted white',
      backgroundColor : 'black',
      borderRadius : '10px',
      position : 'relative',
      margin : '10px',
      color:'white',
      padding : '10px'
    }
  });

  n.add(DOM.h3({
    style : {
      position : 'absolute',
      backgroundColor : 'black',
      display : 'inline-block',
      padding : '0px 10px',
      left : '15px',
      top : '-12px',
      color:'white',
      margin:'0'
    }
  }).add(aTitle));
  
  this.node = n;
}
Group.inherits(Widget);
Group.prototype.add = function(ele){this.node.add(ele)};

//function Label(aLabel){
//  Widget.call(this, aLabel);
//  this.node = DOM.span().add(aLabel);
//}
//Label.inherits(Widget);
//
//function FormElement(){}
//FormElement.inherits(Widget);
//
//function Checkbox(keyName, label, targetDoc) {
//  Widget.call(this, targetDoc);
//}
//Checkbox.inherits(FormElement);