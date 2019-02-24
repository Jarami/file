(function(window){

function Scrolling(elem, options, callback){
  
  elem.style.overflow = "hidden";

  var delta;

  var scrollbarContainer = document.createElement("div");
  extend( scrollbarContainer.style, {
    position: "absolute",
    top: 0,
    right: 0,
    height: "100%",
    width: "10px",
    backgroundColor: "rgba(100,100,100,0.5)",
    display: "none"
  })

  var scrollbar = document.createElement("div");
  extend(scrollbar.style, {
    width: "10px",
    height: elem.offsetHeight*elem.offsetHeight/elem.scrollHeight + "px",
    borderRadius: "5px",
    border: "1px solid grey",
    position: "relative",
    backgroundColor: "rgba(60,60,60,0.5)"
  })
  elem.appendChild(scrollbarContainer);
  scrollbarContainer.appendChild(scrollbar);

  elem.addEventListener("wheel", function(e){
    delta = e.deltaY || e.detail;
    elem.scrollTop = elem.scrollTop + delta;
    scrollbarContainer.style.top = elem.scrollTop + "px";
    scrollbar.style.top = elem.offsetHeight * elem.scrollTop / elem.scrollHeight + "px";
    if (callback) callback();
  })

  window.addEventListener("resize", function(e){
    scrollbar.style.height = elem.offsetHeight*elem.offsetHeight/elem.scrollHeight + "px";
  })
  elem.addEventListener("resize", function(e){
    console.log(e);
  })

  this.draw = function(){
    scrollbarContainer.style.display = "block";
    scrollbar.style.height = elem.offsetHeight*elem.offsetHeight/elem.scrollHeight + "px";
  }
}
Scrolling.init = function(elem, options, callback){
  return new Scrolling(elem, options, callback)
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