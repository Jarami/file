(function(window){
// обработка кнопок "вверх", "вниз" и "backspace"
  function DataTable(thead, tbody, options){
    this.thead = $(thead);
    this.tbody = $(tbody);

    var self = this;
    var origData;
    var template = options.template; 
    var fields = options.fields;
    var sorters = getSorters(options);

    var helpers = {
      formatters: options.formatters || {},
      filters:    options.filters || {}
    }
    
    this.render = function(data){
      if (origData === undefined) origData = data;
      this.tbody.children("tbody").html( template.render(data, options) );
    }
    this.clear = function(){
      origData = undefined;
    }

    var sort = { order: "asc", field: fields[0].field };
    var sortFunction;
    this.thead.on("click", function(e){
        var $target = $(e.target);
        if (e.target.tagName == "TH"){
          var field = fields[e.target.cellIndex].id;
          if (sort.field == field){
            sort.order = sort.order == "asc" ? "desc" : "asc";
          } else {
            sort.field = field; sort.order = "asc";
          }
          sortFunction = function(a,b){ 
            return sorters[field].call(null,a,b,sort.order)
          }
          self.render(origData.sort(sortFunction));
        }
    })

    function getSorters(options){
      var defaultSorter = function(a,b,o){ 
        if (o=="asc") return a<b ? -1 : 1;
        else return a<b ? 1 : -1;
      }
      var sorters = {}
      $.each(options.fields, function(index, field){
          if (options.sorters && options.sorters[field.id]) sorters[field.id] = options.sorters[field.id];
          else sorters[field.id] = options.defaultSorter || defaultSorter;
      })
      return sorters
    }
  }


if (typeof module == "object" && module && typeof module.exports == "object"){
      module.exports = DataTable;
} else { 
      window.DataTable = DataTable;
      if (typeof define == "function" && define.amd) define("datatable",[],function(){return DataTable})
}

})(window)