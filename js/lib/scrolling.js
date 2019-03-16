(function(window){

function Scrollbar(elem){
  this.container = document.createElement("div");
  extend(this.container.style, this.containerParams);

  this.scrollbar = document.createElement("div");
  extend(this.scrollbar.style, this.scrollbarParams);

  this.container.appendChild(this.scrollbar);
  elem.appendChild(this.container);

  var self = this;

  this.scrollbar.onmousedown = function(e){
    e.preventDefault();
try{

    var parentCoords = getCoords(self.container);
    var coords = getCoords(self.scrollbar);
    var shift = e[self.mousePosition] - coords[self.side];

    move( (e[self.mousePosition] - shift - parentCoords[self.side]) * elem[self.totalLength] / elem[self.length]);

    document.onmousemove = function(ev){
      try{
          move( (ev[self.mousePosition] - shift - parentCoords[self.side]) * elem[self.totalLength] / elem[self.length]);
      } catch (e) {
          console.log("error");
      }
    }
    document.onmouseup = function(){
      try{
        document.onmousemove = null;
        document.onmouseup = null;
      } catch (e) {
          console.log("error");
      }
    }
      
  } catch(e){
      console.log("error2")
  }
    return false 
  
  }

  var event;
  function move(position){
    event = new CustomEvent(self.eventName, {detail: position});
    elem.dispatchEvent(event);
  }

  this.show = function(){
    this.container.style.opacity = 1;
  };
  this.hide = function(){
    this.container.style.opacity = 0;
  };
  this.resize = function(){
    this.scrollbar.style[this.size] = elem[this.length]*elem[this.length]/elem[this.totalLength] + "px";
  };
  this.draw = function(){
    this.resize();
    if (elem[this.totalLength]>elem[this.length]) this.scroll(0);
    else this.hide();
  };

}

function VerticalScrollbar(elem){
  
  this.mousePosition = "pageY";
  this.side = "top";
  this.scrollTo = "scrollTop";
  this.totalLength = "scrollHeight";
  this.length = "clientHeight";
  this.size = "height";
  this.eventName = "vertical-scroll";

  this.containerParams = {
    position: "absolute",
    top: 0,
    right: 0,
    height: "100%",
    width: "10px",
    backgroundColor: "rgba(100,100,120,0.5)",
    opacity: 0,
    transition: "opacity 0.8s"
  };
  this.scrollbarParams = {
    width: "10px",
    height: 0,
    borderRadius: "5px",
    border: "1px solid grey",
    position: "absolute",
    backgroundColor: "rgba(60,60,70,0.7)"
  };
  this.scroll = function(position){
    elem.scrollTop = position;
    this.adjust();
  }
  this.adjust = function(){
    this.resize();
    this.container.style.top = elem.scrollTop + "px";
    this.scrollbar.style.top = elem.clientHeight * elem.scrollTop / elem.scrollHeight + "px";

    this.container.style.left = elem.scrollLeft + elem.clientWidth - this.container.clientWidth + "px";
  }
  Scrollbar.apply(this, arguments);
}

function HorizontalScrollbar(elem){

  this.mousePosition = "pageX";
  this.side = "left";
  this.scrollTo = "scrollLeft";
  this.totalLength = "scrollWidth";
  this.length = "clientWidth";
  this.size = "width";
  this.eventName = "horizontal-scroll";

  this.containerParams = {
    position: "absolute",
    bottom: 0,
    left: 0,
    width: "100%",
    height: "10px",
    backgroundColor: "rgba(100,100,120,0.5)",
    opacity: 0,
    transition: "opacity 0.8s"
  };
  this.scrollbarParams = {
    height: "10px",
    width: 0,
    borderRadius: "5px",
    border: "1px solid grey",
    position: "absolute",
    backgroundColor: "rgba(60,60,70,0.7)"
  };
  this.scroll = function(position){
      elem.scrollLeft = position;
      this.adjust();
  }
  this.adjust = function(){
    this.resize();
    this.container.style.left = elem.scrollLeft + "px";
    this.scrollbar.style.left = elem.clientWidth * elem.scrollLeft / elem.scrollWidth + "px";
    
    this.container.style.top = elem.scrollTop + elem.clientHeight - this.container.clientHeight + "px";
  }
  Scrollbar.apply(this, arguments);
}

function Scrolling(elem, options, callback){
  
  elem.style.overflow = "hidden";

  var yScrollbar = new VerticalScrollbar(elem);
  var xScrollbar = new HorizontalScrollbar(elem);

  yScrollbar.resize();
  yScrollbar.show();
  xScrollbar.resize();
  xScrollbar.show();

  var event, detail;

  elem.addEventListener("wheel", function(e){
    // yScrollbar.scroll(elem.scrollTop + e.deltaY);
    event = new CustomEvent("vertical-scroll", {detail: elem.scrollTop + e.deltaY});
    elem.dispatchEvent(event);
  })
  elem.addEventListener("vertical-scroll", function(e){
    yScrollbar.scroll(e.detail);
    xScrollbar.adjust(e.detail);
  })
  elem.addEventListener("horizontal-scroll", function(e){
    xScrollbar.scroll(e.detail);
    yScrollbar.adjust(e.detail);
  });

  elem.addEventListener("mouseover", function(){
      if ( elem.scrollHeight > elem.clientHeight ){
          yScrollbar.adjust();
          yScrollbar.show();
      }
      if ( elem.scrollWidth > elem.clientWidth ){
          xScrollbar.adjust();
          xScrollbar.show();
      }
  });

  elem.addEventListener("mouseleave", function(){
    yScrollbar.hide();
    xScrollbar.hide();
  });
  window.addEventListener("resize", function(e){
    if ( elem.scrollHeight > elem.clientHeight ) yScrollbar.adjust();
    if ( elem.scrollWidth > elem.clientWidth ) xScrollbar.adjust();
  });

  this.draw = function(){
    xScrollbar.draw();
    yScrollbar.draw();
  }
}
Scrolling.init = function(elem, options, callback){
  return new Scrolling(elem, options, callback)
}

function getCoords(elem) {   // кроме IE8-
  var box = elem.getBoundingClientRect();
  return {
    top: box.top + pageYOffset,
    left: box.left + pageXOffset,
    width: box.width,
    height: box.height
  };
}
function extend(object, newObject){
  for (var key in newObject){
    object[key] = newObject[key];
  }
}


if (typeof module == "object" && module && typeof module.exports == "object"){
      module.exports = Scrolling;
} else { 
      window.Scrolling = Scrolling;
      if (typeof define == "function" && define.amd) define("scrolling",[],function(){return Scrolling})
}

})(window)