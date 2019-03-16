(function(window){
// обработка кнопок "вверх", "вниз" и "backspace"
  function DataTable(thead, tbody, options){
    this.thead = thead;
    this.tbody = tbody;

    var self = this;
    var origData;
    var template = options.template; 
    var fields = options.fields;
    var sorters = getSorters(options);
    var filters = getFilters(options);

    var helpers = {
      formatters: options.formatters || {},
      filters:    options.filters || {}
    }
    
    var origData
    this.data = function(data){
      origData = data;
    }

    var sort = { order: "asc", field: fields[0].id };
    this.render = function(){
        if (origData){
            var sortFunction   = getSortFunction(sort.field);
            var filterFunction = getFilterFunction(sort.field);

            this.tbody.querySelector("tbody").innerHTML = template.render(
              origData.sort(sortFunction)
                      .filter(filterFunction), 
              options
            );

            var ths = this.thead.querySelectorAll("th");
            ths.forEach( function(el){ 
                el.classList.remove("asc", "desc")
            })
            var index = fields.findIndex(function(field){
              return field.id == sort.field
            })
            ths[index].classList.add(sort.order);
        }
    }
    function getSortFunction(field){
      return function(a,b){ 
        return sorters[field].call(null,a,b,sort.order)
      }
    }
    function getFilterFunction(field){
      return function(x){ return true }
    }

    this.clear = function(){
      origData = undefined;
    }

    this.thead.addEventListener("click", function(e){
        var th = e.target.closest("th");
        if (th){
            var field = fields[th.cellIndex].id;
            if (sort.field == field){
                sort.order = sort.order == "asc" ? "desc" : "asc";
            } else {
                sort.field = field; 
                sort.order = "asc";
            }
            self.render();
        }
    })
    
    function sortDataBy(th){
          th.parentElement.querySelectorAll("th").forEach( function(el){ 
            el.classList.remove("asc", "desc")
          })
    }

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
    function getFilters(options){
      
      var userFilters = options.filters || {};

      var filters = {}
      $.each(options.fields, function(index, field){
          if (options.filters && options.filters[field.id]) filters[field.id] = options.filters[field.id];
          else filters[field.id] = function(str){ return this.toString().indexOf(str)!==-1} ;
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