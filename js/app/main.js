define(["utils", "datatable", "resizing", "scrolling", "jquery", "jquery-ui", "jsrender.min"], function(utils, DataTable, Resizing, Scrolling, $) {

  $.fn.folderName = function(){
      return this.find("span").first().text();
  }
  $.fn.removeUntil = function(itemToRemove, goodItem, callback){
    while (itemToRemove && itemToRemove != goodItem){
      nextItem = itemToRemove.nextElementSibling;
      this[0].removeChild(itemToRemove);
      if (callback) callback(itemToRemove);
      itemToRemove = nextItem;
    }
    return goodItem
  }
  $.fn.toHash = function(){
    var hash = {};
    this.each(function(i,item){  hash[item.folderName()] = item  })
    return hash
  }
  $.fn.getPath = function(){
    if (this.is("li")){
        var parent = this.closest("ul").closest("li");
        if (parent.length){
            return parent.getPath() + "/" + this.folderName()
        } else {
            return ""
        }
    } else if (this.is("tr")){
        var root = this.closest("table").attr("root");
        if (this.hasClass("up")){
          return root.slice(0, root.lastIndexOf("/"));
        } else {
          return root + "/" + this.folderName();
        }
    }
  }

  $.fn.isFolder = function(){
    return (this.hasClass("folder") || this.hasClass("up"))
  }
  $.fn.isFile = function(){
    return this.hasClass("file")
  }

  /* for li  elements */
  $.fn.select = function(selectedItem){
    if (selectedItem) selectedItem.removeClass("selected");
    this.addClass("selected");
    return this
  }
  $.fn.expand = function(){
      var $li = this.closest("li");
      $li.addClass("expanded");
  }
  $.fn.collapse = function(){
    this.removeClass("expanded");
    this.children("ul").html("");
  }

  Element.prototype.folderName = function(){
    return this.querySelector("SPAN").innerHTML;
  }
  Array.prototype.removeUntil = function(i,ii){
    for(var j=ii;j<this.length;j++){
      this[j-ii+i] = this[j]
    }
    this.length = this.length-ii+i;
  }

  Array.prototype.insert = function(elem){
    var arr = this;
    return {
      elem: elem,
      before: function(pos){
        var buf = arr.slice(pos);
        arr[pos] = this.elem;
        for (var i=pos+1;i<arr.length;i++){
          arr[i] = buf[i-pos-1];
        }
        arr.push(buf[arr.length-pos-1]);   
      }
    }
  }

  function Subscriber(){
    this.listeners = {}
    this.on = function(eventName, callback){
      this.listeners[eventName] = this.listeners[eventName] || [];
      this.listeners[eventName].push(callback);
      return this
    }
    this.trigger = function(eventName, data){
      if (this.listeners[eventName]){
        console.log("trigger " + eventName + " with:");
        console.log(data);
        $.each(this.listeners[eventName], function(index, callback){
            callback.call(null,data);
        })
      }
    }
  }

  function Model(){
    Subscriber.apply(this, arguments);

    this.load = function(params){

      return $.ajax({
        url: "/",
        cache: false,
        timeout: 10000, /* 10sec */
        data: params,
        dataType: params.folder !== undefined ? 'json' : null
        // contentType: params.folder ? 'application/x-www-form-urlencoded; charset=UTF-8' : "text/plain" /*'application/octet-stream'*/
      })
    }
  }

  function View(){
    Subscriber.apply(this, arguments);
    
    this.currentNode = undefined;

    var self = this;

    var tabs = new Tabs(this, "tabs");
    var tree = new Tree(this, "tree");
    var list = new List(this, "list");
    var path = new Path(this, "path");

    var splitterEl = document.getElementById("tree-list-splitter");

    var treeLeft = parseFloat(getComputedStyle(tree.elem).left);
    var listRight = parseFloat(getComputedStyle(list.elem).right);
    var splitterWidth = parseFloat(getComputedStyle(splitterEl).width);

    var treeDelta = treeLeft + splitterWidth/2;
    var listDelta = listRight + splitterWidth/2;

    var treeWidth; // = tree.elem.getBoundingClientRect().width;
    var listWidth; // = list.elem.getBoundingClientRect().width;

    var treeWidthPr; // = tree.elem.offsetWidth / output.clentWidth * 100;
    var listWidthPr; // = list.elem.offsetWidth / output.clentWidth * 100;

    var totalWidth;

    var treeWidthMinOrig = 200;
    var listWidthMinOrig = 600;

    Resizing.init(splitterEl, {motion: "horizontal"}, function(changes){

      totalWidth = tree.elem.offsetWidth + list.elem.offsetWidth;

      treeWidth = tree.elem.offsetWidth + changes.horizontal;
      listWidth = totalWidth - treeWidth;

      treeWidthMin = Math.min(treeWidthMinOrig, totalWidth);
      listWidthMin = Math.min(listWidthMinOrig, totalWidth);

      if (treeWidth < treeWidthMin){
        treeWidth = treeWidthMin;
        listWidth = totalWidth - treeWidth; 
      }
      if (listWidth < listWidthMin){
        listWidth = listWidthMin;
        treeWidth = totalWidth - listWidth; 
      }

      treeWidthPr = (treeWidth + treeDelta) / output.clientWidth * 100;
      listWidthPr = 100 - treeWidthPr;
      splitterLeftPr = treeWidthPr;

      tree.elem.style.width = "calc(" + treeWidthPr + "% - " + treeDelta + "px)";
      list.elem.style.width = "calc(" + listWidthPr + "% - " + listDelta + "px)";
      splitterEl.style.left = "calc(" + splitterLeftPr + "% - " + treeLeft + "px)";
      
    });

    var userFolder = {};

    this.init = function(params){
      setTimeout(function(){ tabs.init(params) }, 0);
      setTimeout(function(){ tree.init(params) }, 0);
      setTimeout(function(){ list.init(params) }, 0);
      setTimeout(function(){ path.init(params) }, 0);
    }

    this.draw = function(data, params){
      userFolder[this.currentNode] = params.folder;
      setTimeout(function(){ tabs.draw(data, params) }, 0);
      setTimeout(function(){ tree.draw(data, params) }, 0);
      setTimeout(function(){ list.draw(data, params) }, 0);
      setTimeout(function(){ path.draw(data, params) }, 0);
    }
    this.fail = function(data, params){
      console.group("Fail to load data")
      console.log("Опаньки!");
      console.log(data);
      console.groupEnd();
    }

    function ViewComponent(view, id){
      this.elem = document.getElementById(id);
      this.init = function(){};
      this.draw = function(){};
      this.fail = function(){};
    }

    function Splitter(view, id){
      ViewComponent.apply(this, arguments);
    }

    function Tabs(view, id){
      ViewComponent.apply(this, arguments);

      var $elem = $(this.elem);
      view.currentNode = getTabID($elem.children("li:first-child"));

      $elem.on("click", function(e){
          
          var nodeID = getTabID(e.target);
          if (nodeID && nodeID !== view.currentNode){
              view.currentNode = nodeID;
              view.trigger("tab-change", {node: nodeID, folder: userFolder[nodeID] || HOME});
          }
      })

      this.draw = function(data, params){
        select( getTabByID(params.node) );
      }

      var currentTab;
      function select(tab){
        if (currentTab) currentTab.removeClass("selected");
        currentTab = tab;
        currentTab.addClass("selected");
      }
      function getTabID(elem){
        return $(elem).closest("li").attr("node-id");
      }
      function getTabByID(nodeID){
        return $elem.children("li[node-id='" + nodeID + "']");
      }
    }
    function Tree(view, id){  
      ViewComponent.apply(this, arguments);

      var $tree = $(this.elem);
      var $list = $tree.children('ul');
      var $ROOT;

      var dataCache = {};

      function envelope(data){
        return [{class: "folder", path: ROOT, entries: data}]
      }
      function getCurrentNodeCache(){
        return dataCache[view.currentNode]
      }
      this.init = function(params){
        
        dataCache[view.currentNode] = dataCache[view.currentNode] || envelope([]);
        $list.html("");

        var data = dataCache[view.currentNode][0]["entries"];
        this.draw(data, params);
        
      }

      var selectedItem;
      this.draw = function(data, params){

          var cache = getCurrentNodeCache()
          
          new Renderer().render( envelope(data), $list, cache);
          
          $ROOT = $list.children("li").children("ul");          

          var $li = findByPath(params.folder);
          $li.select(selectedItem);
          selectedItem = $li;
          $li.expand();
      }

      function findByPath(path){
        var xpath = path.split("/"), i;
        var elem;
        for (i=0; i<xpath.length; i++){
          if (xpath[i] === "") elem = $ROOT;
          else {
            elem.children("li").each( function(_,li){
                if ( li.folderName() === xpath[i] ) elem = $(li).children("ul");
            })
          }
        }
        return elem.closest("li");
      }

      $tree.on("click", function(e){
          var $target = $(e.target);

          var $li = $target.closest("li");

          if ($target.is("span")){ 

            $li.select(selectedItem);
            selectedItem = $li;
          } 
          else if ($target.is("i")) { 
            if ($li.is(".expanded")){
              $li.collapse();
            } else {
              view.trigger("tree-item-expand", {node: view.currentNode, folder: $li.getPath()})  
            }
          } 

      }).on("dblclick", function(e){
          var target = $(e.target);
          if (target.is("span") || target.is("i:nth-child(3)"))
          {
            var $li = target.closest("li");
            view.trigger("tree-item-expand", {node: view.currentNode, folder: $li.getPath()})  
          }
      })

      function Renderer(){

        var $template = $.templates("#tree-item-template");

        function _render(data){
          return $($template.render(data));
        }
        this.render = function(data, $root, cache){

          var items, hash, x, li, name;

          for(var i=0; i<data.length; i++){

            if (data[i]["class"] == "file") break;

            items = $root.children("li"); 
            hash  = items.toHash();

            x    = data[i];
            li   = items[i];
            name = li ? li.folderName() : null;

            if (li === undefined){
                li = $( _render(x) ).appendTo($root);

            } else if (x.path != name){
                if (hash[x.path]){
                    li = $root.removeUntil(li, hash[x.path]);

                } else {
                    li = $( _render(x) ).insertBefore(li);
                }
            }

            if (cache[i] === undefined){
                cache.push(x)
            } else if (x.path != cache[i]["path"]){
                if ( (ii = cache.findIndex(function(el){ return el.path === x.path })) && (ii !== -1) ){
                    cache.removeUntil(i,ii);
                } else {
                    cache.insert(x).before(i);
                }
            }

            if (x.entries){
                var $newRoot = $(li).children("ul");
                cache[i].entries = cache[i].entries || [];
                this.render(x.entries, $newRoot, cache[i].entries)
            }
          }

        }
      }
    }
    function List(view, id){
      ViewComponent.apply(this, arguments);

      var $list = $(this.elem);
      var $tbody = $list.find(".datatable_body");
      var $thead = $list.find(".datatable_head");

      var selectedItem;
      $tbody.on("click", "tr", function(e){
          var $tr = $(this);
          $tr.select(selectedItem);
          selectedItem = $tr;
      }).on("dblclick", "tr", function(e){
          var $tr = $(this);
          if ($tr.isFolder()){
              $tr.addClass("opening");
              view.trigger("tree-item-expand", {node: view.currentNode, folder: $tr.getPath()});
          } else if ($tr.isFile()){
              view.trigger("list-item-download", {node: view.currentNode, file: $tr.getPath()});
          }
      })

      // ресайз колонок
      var $theadColumns = $thead.find("col");
      var $tbodyColumns = $tbody.find("col");

      var th1, th2;
      var newWidth1, newWidth2;

      var minWidth = 50;
      var totalWidth;

      $thead.find("th span").each( function(i, splitter){

        Resizing.init(splitter, {motion: "horizontal"}, function(changes){

          th1 = splitter.closest("th");
          th2 = th1.nextElementSibling;

          totalWidth = th1.offsetWidth + th2.offsetWidth;

          // откуда берется 1px???
          newWidth1 = th1.offsetWidth + 1 + changes.horizontal;
          if (newWidth1 < minWidth){
              newWidth1 = minWidth + 1;
              newWidth2 = totalWidth - newWidth1;
          } else {
              newWidth2 = totalWidth - newWidth1 + 1;
          }

          if (th1.cellIndex > 0){
            $theadColumns[th1.cellIndex].style.width = newWidth1 + "px";
            $tbodyColumns[th1.cellIndex].style.width = newWidth1 + "px";
          }

          $theadColumns[th2.cellIndex].style.width = newWidth2 + "px";
          $tbodyColumns[th2.cellIndex].style.width = newWidth2 + "px";

        })
        
      });

      var mySort = function(a,b,o,f){
        if (a.class == "up")          return -1;
        else if (b.class == "up")     return 1;
        else if (a.class != b.class)  return a.class == "folder" ? -1 : 1;
        else if (a.class == b.class ){
          if (a[f]<b[f] && o=="asc") return -1
          else if (a[f]>b[f] && o=="asc") return 1
          else if (a[f]<b[f] && o=="desc") return 1
          else if (a[f]>b[f] && o=="desc") return -1
          else return a.path<b.path ? -1 : 1
        }
      }

      var datatable = new DataTable($thead[0], $tbody[0], {
        fields: [
          { id: "path",     name: "Имя"     },
          { id: "type",     name: "Тип"     },
          { id: "size",     name: "Размер"  },
          { id: "created",  name: "Создан"  },
          { id: "modified", name: "Изменен" }
        ],
        filters: {

        },
        formaters: {
          type: function(obj){
            if (obj.class == "file") return obj.type
          },
          size: function(obj){
            if (obj.class != "file") return;
            var b = obj.size, s = "", r;
            while (( b/1000 )^0){
              r = b % 1000;
              s = s ? r + "'" + s : utils.pad(""+r, 3, "0");
              b = (b / 1000)^0
            }
            r = b % 1000;
            s = s ? r + "'" + s : r;
            return s
          },
          date: function(unixTime){
            var date = new Date(unixTime*1000);
            return utils.dateToString(date, "%Y-%m-%d %H:%M:%S")
          },
          created: function(obj){
            if (obj.class == "up") return;
            return this.date(obj.created)
          },
          modified: function(obj){
            if (obj.class == "up") return;
            return this.date(obj.modified)
          }
        },
        sorters: {
          path:     function(a,b,o){ return mySort.call(null,a,b,o,"path") },
          type:     function(a,b,o){ return mySort.call(null,a,b,o,"type") },
          size:     function(a,b,o){ return mySort.call(null,a,b,o,"size") },
          created:  function(a,b,o){ return mySort.call(null,a,b,o,"created") },
          modified: function(a,b,o){ return mySort.call(null,a,b,o,"modified") }
        },
        template: $.templates("#list-item-template")
      })

      var scrolling = Scrolling.init( $list.children("div")[0], {}, function(){})
      this.draw = function(data, params){
        datatable.clear();
        new Renderer(params.folder).render(data, "");
        scrolling.draw();
      }


      function Renderer(folder){

        this.render = function(data, path){
          if (path === folder){

              dataToRender = [{path: "[..]", class: "up"}].concat(data);
              $tbody.attr("root",folder);
              datatable.data(dataToRender)
              datatable.render();
              
          } else {
              for(var i=0; i<data.length; i++){
                var x = data[i];
                if (x.class == "folder" && x.entries){
                  this.render(x.entries, path + "/" + x.path)
                }
              }
          }
        }
      }
    }
    function Path(view, id){
      ViewComponent.apply(this, arguments);

      var $path = $(this.elem);
      this.draw = function(data, params){
        $path.html( ROOT + params.folder );
      }
    }
  }

  function App(){

      var model = new Model();
      var view = new View(); 

      $("#short-links").on("click", "a", function(e){
          e.preventDefault()
          view.trigger("tree-item-expand", {node: view.currentNode, folder: this.getAttribute("rel-path")})
          return false
      })

      view
        .on("tab-change", function(params){

            view.init(params);
            model.load(params)
                 .done( function(data){ 
                    view.draw(data,params);
                  })
                 .fail( function(data){
                    view.fail(data,params);
                 })
        })
        .on("tree-item-dblclick", function(){   })
        .on("tree-item-expand", function(params){
            
            model.load(params)
                 .done( function(data){ 
                    view.draw(data,params);
                  })
                 .fail( function(data){
                    view.fail(data,params);
                 })
        })
        .on("list-item-download", function(params){
            model.load(params)
                 .done( function(data, textStatus, jqXHR){ 
                    console.group('AJAX')
                    console.log(data);
                    console.log(textStatus);
                    console.log(jqXHR.getResponseHeader("Content-Type"));
                    console.log(data.length);
                    // console.log(atob(data).length);
                    // {type: jqXHR.getResponseHeader("Content-Type")}
                    // var blob = new Blob([atob(data)], {type: "octet/stream"});
                    // console.log(blob.type)
                    // saveAs( blob, params.file.slice(params.file.lastIndexOf("/")+1) )
                    utils.saveFile(utils.str2ab(atob(data)), {
                      fileName: params.file.slice(params.file.lastIndexOf("/")+1), 
                      contentType: 'octet-stream' /*jqXHR.getResponseHeader("Content-Type")*/
                    });
                    console.groupEnd();

                  })
                 .fail( function(data){
                    console.group('AJAX')
                    console.log("Fail to load file " + ROOT + params.file);
                    console.log(data);
                    console.groupEnd();
                 })
        })

      view.trigger("tab-change", {node: view.currentNode, folder: HOME});

  }
  new App;
  // $(window).on("resize", function(){
  //     console.log(123);
  // })
})