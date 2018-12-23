function load_with_roulette(new_link)
{
  str = ""
  str += "<img src='/data/Plugin/images/rzdarm-logo.png'> </img>"
  str += "<div style = 'background: url("
  str += '"/data/Plugin/DataTabel/overlay.png"'
  str += "); position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: 8010;'> </div>"
  str += "<div style = 'top: 0; left: 0; width: 100%; height: 100%;'> "
  str += "<div class = 'load_window_frame' >"
  str += "<img src='/data/Plugin/images/loading.gif' class ='load_window_roulette' >"
  str += "</img> <b>Загрузка...<b> </div>"
  str += " </div>"
  str += ""

  $( 'body' )[0].innerHTML = str
  
  if (typeof new_link!=='undefined') {
    window.setTimeout(function() {
        location.href = "http://" + location.host + new_link
    }, 100);  
  }
}

function logout(){
  $.ajaxSetup({cache: false});
  var str = "http://" + location.host + "/logout"
  var data = {};
  $.get( str, data, logout_redirect);
}

function logout_redirect(){
  location.href = "http://" + location.host + "/"
}

function log(arr){
  debug('-------------------------------------');
  debug(new Date());
  for(var i in arr) debug(arr[i]);
}
// пишет прямо в документ (полезно для IE тестера)
function logVisible(text){
  var div = document.createElement("div");
  div.innerHTML = text;
  document.body.appendChild(div);
}
function debug(text){
  $('body').append('<!-- ' + text + ' -->');
}

function addZero(i) { return (i < 10) ? "0" + i : i } // для дат
function date_to_uri(date) {
  return addZero(date.getDate()) + "." + addZero(date.getMonth() + 1) + "." + addZero(date.getFullYear())
}
function uri_to_date(str) {
  return new Date(+str.slice(6,10), +str.slice(3,5) -1, +str.slice(0,2))
}
function date_to_str(date) {
  return addZero(date.getDate()) + "." + addZero(date.getMonth() + 1) + "." + addZero(date.getFullYear()) + " " +
  addZero(date.getHours()) + ":" + addZero(date.getMinutes()) + ":" + addZero(date.getSeconds())
}

function format_date(date){
  var year = date.getFullYear() 
  var month = date.getMonth() 
  var day = date.getDate()
  month = month >= 9 ? month+1 : "0" + month+1
  day = day >= 10 ? day : "0" + day
  date_str = ""
  date_str = "" + year + month + day
  return date_str
}

function print_list(id, header_text){
  x = document.getElementById(id)
  if (x){
    var html = "<html>";
    html += "<head></head>";
    
    if(header_text) html += header_text;
    
    html += "<body style = 'font-family: monospace; font-size: 18px;'>"
    html += x.innerHTML.replace(/option/g,'div').replace(/selected=""/g,'').replace(/disabled=""/g,'').replace(/tr/g,'div');
    
    html += "</body>";
    html += "</html>";
    
    var printWin = window.open('','','left=0,top=0,width=1024,height=768,toolbar=0,scrollbars=0,status=0');
    printWin.document.open();
    printWin.document.write(html);
    printWin.document.close();
    printWin.focus();
    printWin.print();
    printWin.close();
  }
}

function getOrCreateID(elem){
    var elemID = elem.getAttribute('id');
    if (!elemID) {
        elemID = "user-element-" + (Math.random() * 1000 ^ 0);
        var tries = 0;
        while ( !document.getElementById(elemID) && tries>100){
            elemID = "user-element-" + (Math.random() * 1000 ^ 0);
            tries += 1;
        }
        if ( document.getElementById(elemID) ){ 
            elemID = undefined;
            debug("Created element Id is in use!")
        } else {
            elem.setAttribute('id', elemID);
        }
    }
    return elemID
}

function TableExporter(options){
  validate();
  var is_datatable;
  
  this.run = function(options){
    
    var styles = getStyleSheet();
    var caption = createCaption();
    var table = getTable();
    
    var html = $('<div>').append( styles ).append( caption ).append( table )    
    var name = getFileName();
    
    saveTextAsFile(html.html(), name);
  }
  
  function validate(){
    if (!options) throw("Не заданы параметры экспорта!!!");
    if (!options.table) throw("Не задана таблица");
  }
  
  function getStyleSheet(){
    return options.styles || ""
  }
  
  function createCaption(){
    
    var captions = ["<style> .mso-header{text-align: center; font-weight: bold;} </style>"]; 
    
    var title = getCaption(); 
    if (title) captions.push(title);
    
    var hdrs = options.headers
    if (hdrs) for (var i=0; i<hdrs.length; i++){
        captions.push( hdrs[i] instanceof Object ? $(hdrs[i]).html() : hdrs[i] );
    }
    
    captions.push("Отчёт экспортирован " + getTimestamp());
    
    return $.map(captions, function(c){ return '<div class="mso-header">' + c + '</div>' }).join("") + "<br/>";
  }
  
  function getCaption(){    
    var id = $(options.table).attr("id");
    var $dataTables_wrapper = $('#'+id+'_wrapper');
    is_datatable = !!id && !!$dataTables_wrapper.length;
    return $(options.table).find("caption").text() || $dataTables_wrapper.find(".table-caption").html() || "";
  }
  function getTimestamp(){
    var d = new Date();
    return addZero(d.getDate()) + "-" + addZero(d.getMonth() + 1) + "-" + d.getFullYear() + " в " + addZero(d.getHours()) + ":" + addZero(d.getMinutes());
  }
  function getTable(){
    var table = $(options.table).clone();
    if (is_datatable){
        table.find('thead').remove();
        table.prepend( $datatable_header.clone() );
    }
      
    table.find('tfoot').remove();
    return table.prop("border","1px").prop("outerHTML")
        .replace(/<a[^>]*>|<\/a>/gi, "")
        .replace(/<img[^>]*>/gi,"")
        .replace(/<input[^>]*>|<\/input>/gi, "");
  }
  function getFileName(){
    return ($(options.table).attr('name') || "report") + ".xls"
  }
}
TableExporter.run = function(options){
  new TableExporter(options).run()
}

function exportToExcel(table) {
    var d = new Date();
    var date_str = addZero(d.getDate()) + "-" + addZero(d.getMonth() + 1) + "-" + d.getFullYear() + " в " + addZero(d.getHours()) + ":" + addZero(d.getMinutes());
    
    var tableID;
    
    if (table instanceof Object){
        tableID = getOrCreateID(table);
        if (!tableID) return
    } else {
        tableID = table;
    }
    
    var $tableClone = $("#"+tableID).clone();
    var $dataTables_wrapper = $('#'+tableID+'_wrapper');
    
    // делаем заголовок
    var caption = "";
    var title = $tableClone.find("caption").html() || $dataTables_wrapper.find(".table-caption").html()
    if (title) caption += "<div style ='text-align: center; font-weight: bold;'>" + title + "</div>";
    for (var i=1; i<arguments.length; i++){
       if (arguments[i] instanceof Object){
          caption += "<div style ='text-align: center; font-weight: bold;'> " + $(arguments[i]).html() + " </div>";
       } else {
          caption += "<div style ='text-align: center; font-weight: bold;'> " + arguments[i] + " </div>";
       }
    };
    caption += "<div style ='text-align: center; font-weight: bold;'> Отчёт экспортирован " + date_str + " </div>";
    
    // делаем шапку
    var $datatable_header = $dataTables_wrapper.find(".dataTables_scrollHeadInner thead");
    if ($datatable_header.length) {
      var $tableHead = $datatable_header.clone(); $tableClone.find("thead").remove();
    }
    
    $tableClone.find('.date_hide_div').remove();
    $tableClone.find('tfoot').remove();
    
    //делаем тело
    var $tableBody = $tableClone.html();
    
    var $table = $("<table border='2px'></table>");
    if ($tableHead && $tableHead.length) $table.append($tableHead);
    if ($tableBody && $tableBody.length) $table.append($tableBody);
    
    var body = (caption + $table.prop("outerHTML"))
        .replace(/<a[^>]*>|<\/a>/gi, "")
        .replace(/<img[^>]*>/gi,"")
        .replace(/<input[^>]*>|<\/input>/gi, "");
        
    var html = '<!doctype html>'+
               '<html>'+
                  '<head>'+
                    '<meta http-equiv="content-type" content="text/html; charset=UTF-8">'+
                  '</head>'+
                  '<body>'+
                      body + 
                  '<body>'+
               '</html>';
    
    var fileNameToSaveAs = $("#"+tableID).attr('name');
    if (fileNameToSaveAs===undefined) fileNameToSaveAs="report";
    fileNameToSaveAs += ".xls"
    
    saveTextAsFile(html, fileNameToSaveAs)
}

function saveTextAsFile(text, fileNameToSaveAs){
    
    if (window.Blob) {
      var textFileAsBlob = new Blob([text], { type: 'text/plain' });
      
      var downloadLink = document.createElement("a");
      downloadLink.download = fileNameToSaveAs;
      downloadLink.innerHTML = "Download File";
      if (window.webkitURL != null) {
          downloadLink.href = window.webkitURL.createObjectURL(textFileAsBlob);
      } else {
          downloadLink.href = window.URL.createObjectURL(textFileAsBlob);
          downloadLink.onclick = destroyClickedElement;
          downloadLink.style.display = "none";
          document.body.appendChild(downloadLink);
      }
      if (navigator.msSaveBlob) {
          navigator.msSaveBlob(textFileAsBlob, fileNameToSaveAs);
      } else {
          downloadLink.click();
      }
  } else if (document.execCommand) {
      var oWin = window.open();
      oWin.document.writeln(text);
      oWin.document.close();
      
      var success = oWin.document.execCommand('SaveAs', true, fileNameToSaveAs)
      oWin.close();
      if (!success) {}
  }
  
  function destroyClickedElement(event) {
    document.body.removeChild(event.target);
  }
}

/* Обертка для Datatable-плагина
   -- Использование:
        var tableTransform = new TableTransform(tableID); // tableID - это id таблицы в html документе
        tableTransform.to_full(); // преобразуем таблицу
        tableTransform.to_min(); // преобразуем таблицу, оставляя только поиск и сортировку
        tableTransform.to_search_only(); // преобразуем таблицу оставляя только сортировку
        tableTransform.to_server_side(); // преобразуем таблицу, которая обновляет содержимое ajax-запросами
   -- Можно указать дополнительные опции преобразования (необязательный параметр):
        var params = { ajax: "/datatables?planner=ur_tps_monthly&date=01.01.2017&param1=123&param2=456" };
        tableTransform.to_server_side(params); */
function TableTransform(tableID){
  
  var tableID = tableID;
  var $dataTable;
  
  var defaultsForFullDatatable = {
    paging: true, info: true, ordering: true, order: [[ 0, "asc" ]], lengthMenu: [[20, 50, 100, -1], [20, 50, 100, "Все"]],
    scrollCollapse: true, scrollX: "99%", scrollY: "700px",
    language: {
                  info: "",
                  infoEmpty: "",
                  search: "Найти",
                  zeroRecords: "Данные отсутствуют.",
                  lengthMenu: "Показать по _MENU_ записей",
                  infoFiltered: "Показано _END_ из _MAX_ записей",
                  paginate: { first: "Первый", last: "Последний", next: "Следующий", previous: "Предыдущий" }
              }
  };
  var defaultsForSearchOnlyDatatable = JSON.parse(JSON.stringify(defaultsForFullDatatable));
  defaultsForSearchOnlyDatatable.ordering = false
  
  var defaultsServerSideDatatable = JSON.parse(JSON.stringify(defaultsForFullDatatable));
  defaultsServerSideDatatable.processing = true;
  defaultsServerSideDatatable.serverSide = true;
  defaultsServerSideDatatable.deferRender = true;

  var defaultsForMinDatatable = JSON.parse(JSON.stringify(defaultsForFullDatatable));
  defaultsForMinDatatable.paging = false;
  defaultsForMinDatatable.info = false;
  defaultsForMinDatatable.scrollCollapse = false;
  defaultsForMinDatatable.scrollX = null;
  defaultsForMinDatatable.scrollY = null;
  
  function to_full(params){  return to_datatable(params, 'full')  }
  function to_min(params){  return to_datatable(params, 'min')  }
  function to_search_only(params){  return to_datatable(params, 'search_only')  }
  function to_server_side(params){  return to_datatable(params, 'server_side')  }
  
  function to_datatable(params, type){
    var params = params || {};
    var type = type || "full";
    
    var params;
    switch (type){
      case "full":        params = mergeParams(params, defaultsForFullDatatable); break;
      case "min":         params = mergeParams(params, defaultsForMinDatatable); break;
      case "search_only": params = mergeParams(params, defaultsForSearchOnlyDatatable); break;
      case "server_side": params = mergeParams(params, defaultsServerSideDatatable); break;
      default: alert("Неизвестный тип таблицы "+tableID+": "+type); break;
    }
    if (params){
      add_input_cells();
      $dataTable = $('#'+tableID).dataTable(params); 
      apply_the_column_search();
      return $dataTable;
    }
    return undefined;
  }
  
  // Добавляет input-поля для поиска по колонкам в tfoot (tfoot и th'ы должны существовать)
  function add_input_cells(){ 
    // начиная с DataTables v1.10.6
    /* $('#'+tableID+' tfoot th').each( function(){ $(this).html('<input type="text" placeholder="Найти"/>') } ); */
    // до DataTables v1.10.6
    $('#'+tableID+' tfoot th').each( function(i){
      $(this).html('<input id="'+tableID+'_column'+i+'_search" type="text" placeholder="Найти"/>');
    });
  }
  
  // Применить поиск по колонкам
  function apply_the_column_search(){ 
    // начиная с DataTables v1.10.6
    /* $dataTable.columns().every( function () {
      var that = this;
      $( 'input', this.footer() ).on('keyup change', function(){
        if ( that.search() !== this.value ) that.search( this.value ).draw()
      });
    }); */ 
    // до DataTables v1.10.6
    $dataTable.api().columns().eq(0).each( function ( index ) {
      $('#'+tableID+'_column'+index+'_search').on( 'keyup change', function () { 
          $dataTable.api().columns( index ).search( this.value ).draw();
      });
    });
  }
  
  function mergeParams(params, defaults){
      var params = params || {};
      for( var key in defaults){
        params[key] = params[key] || defaults[key];
      };
      return params
  }
  
  this.to_full = to_full;
  this.to_min = to_min;
  this.to_search_only = to_search_only;
  this.to_server_side = to_server_side;
}

function makeDialog(elemID, options, onabsence){
          var $elem = $("#"+elemID);
          if ($elem.length) $elem.dialog('open').css("width","100%");
          else {
              var innerHTML = onabsence();
              $elem = $(innerHTML);
              $elem.appendTo("body")
                    .dialog({title: options.title, position: options.position || { my: "center", at: "center", of: window }, width: options.width || 500, stack: options.stack || true, resizable: options.resizable || true })
                    .css("width","100%")
          }
}