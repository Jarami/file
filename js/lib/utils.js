(function(window){

var utils = {
  
  pad: function(string, width, padding){
      if (string.length > width){
          return string
      } else {
          return new Array(width - string.length + 1).join(padding) + string
      }
  },

  dateToString: function(date, frmt){
    // frmt = "%Y-%02m-%02d"

    var datestring = frmt;

    var reg = /\%(0*)(\d*)([Y|m|d|H|M|S])/g;

    var result;
    while ( (result = reg.exec(frmt)) !== null ){

      var conversion = result[3],
          padding    = result[1]==="-" ? "" : "0",
          width      = +result[2] || (conversion=="Y" ? 4 : 2);

      var value = null;
      switch(conversion){
        case "Y": value = date.getFullYear(); break;
        case "m": value = date.getMonth()+1; break;
        case "d": value = date.getDate(); break;
        case "H": value = date.getHours(); break;
        case "M": value = date.getMinutes(); break;
        case "S": value = date.getSeconds(); break;
      }

      if (value !== null){
        datestring = datestring.replace( result[0], this.pad(""+value, width, padding) )
      }
    }
    return datestring
  },

  stringToDate: function(datestring, frmt){

  },

  saveFile: function(data, params){

    if (window.Blob) {
      var textFileAsBlob = new Blob([data], { type: params.contentType });
      console.log({ type: params.contentType });
      var downloadLink = document.createElement("a");
      downloadLink.download = params.fileName;
      downloadLink.innerHTML = "Download File";
      downloadLink.href = window.URL.createObjectURL(textFileAsBlob);
      downloadLink.onclick = destroyClickedElement;
      downloadLink.style.display = "none";
      document.body.appendChild(downloadLink);
      if (navigator.msSaveBlob) {
          navigator.msSaveBlob(textFileAsBlob, params.fileName);
      } else {
          downloadLink.click();
      }
    } else if (document.execCommand) {
      var oWin = window.open();
      oWin.document.writeln(data);
      oWin.document.close();
      
      var success = oWin.document.execCommand('SaveAs', true, params.fileName)
      oWin.close();
      if (!success) {}
    }
  
    function destroyClickedElement(event) {
      document.body.removeChild(event.target);
    }

  },

  str2ab: function(str) {
    var buf = new ArrayBuffer(str.length); // 2 bytes for each char
    // var bufView = new Uint16Array(buf);
    var bufView = new Int8Array(buf);
    for (var i=0, strLen=str.length; i<strLen; i++) {
      bufView[i] = str.charCodeAt(i);
    }
    return buf;
  }

}

if (typeof module == "object" && module && typeof module.exports == "object"){
      module.exports = utils;
} else { 
      window.utils = utils;
      if (typeof define == "function" && define.amd) define("utils",[],function(){return utils})
}

})(window)