(function(window){

var Resizing = {

  init: function(elem, options, ondone){

    if (typeof options == "function"){
      ondone = options;
      options = {};
    }

    elem.onmousedown = function(e){
      
      e.preventDefault();

      var coords = getCoords(elem);
      var shiftX = e.pageX - coords.left;
      var shiftY = e.pageY - coords.top;

      var mover = document.createElement("div");
      extend(mover.style, {
        position: 'absolute',
        top: coords.top + 'px',
        left: coords.left + 'px',
        width: coords.width + 'px',
        height: coords.height + 'px',
        backgroundColor: "rgba(100,100,100,0.5)",
        zIndex: 1000
      })
      document.body.appendChild(mover);

      function move(ev){
        if (!options || !options.motion || options.motion=="horizontal") mover.style.left = ev.pageX - shiftX + 'px';
        if (!options || !options.motion || options.motion=="vertical")   mover.style.top = ev.pageY - shiftY + 'px';
      }

      document.onmousemove = function(ev){
        move(ev);
      }
      document.onmouseup = function(){
        var changes = {
          vertical: parseFloat(mover.style.top) - coords.top,
          horizontal: parseFloat(mover.style.left) - coords.left
        }
        document.onmousemove = null;
        document.onmouseup = null;
        document.body.removeChild(mover);
        ondone(changes);
      }
      
      return false 
    };

    elem.ondragstart = function() {
      return false;
    };
  }
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
      module.exports = Resizing;
} else { 
      window.Resizing = Resizing;
      if (typeof define == "function" && define.amd) define("resizing",[],function(){return Resizing})
}

})(window)