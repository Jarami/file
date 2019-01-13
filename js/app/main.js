define(["utils", "jquery", "jquery-ui", "jsrender.min"], function(utils, $) {
// var FileSaver = requirejs(['FileSaver']);
// console.log(FileSaver.saveAs);
  function Subscriber(){
    this.listeners = {}
    this.on = function(eventName, callback){
      this.listeners[eventName] = this.listeners[eventName] || [];
      this.listeners[eventName].push(callback);
      return this
    }
    this.trigger = function(eventName, data){
      if (this.listeners[eventName]){
        console.log("trigger " + eventName);
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
        dataType: params.folder ? 'json' : null,
        contentType: params.folder ? 'application/x-www-form-urlencoded; charset=UTF-8' : "text/plain" /*'application/octet-stream'*/
      })
    }
  }

  function View(){
    Subscriber.apply(this, arguments);
    
    var self = this;
    var tree = new Tree(this);
    var list = new List(this);
    var path = new Path(this);

    $("#tabs").on("click", function(e){
        var nodeID = $(e.target).closest("li").attr("node-id");
        if (nodeID) self.trigger("tab-click", nodeID);
    })

    this.draw = function(data, params){
      tree.draw(data, params);
      list.draw(data, params);
      path.draw(data, params);
    }
    this.fail = function(data, params){
      console.log("Опаньки!");
      console.log(data);
    }

    function Tree(view){  
      var $tree = $("#tree");
      var $list = $tree.children('ul');
      var tree;
      var selectedItem;
      var self = this;

      new Renderer("").render($list, [{class: "folder", path: ROOT}], "");
      var $root = $list.children("li").children("ul");

      this.draw = function(data, params){
          console.log(data);
          new Renderer(params.folder).render($root, data, "");
      }

      $tree.on("click", function(e){
        var elem = $(e.target);

          if (elem.is("span") || elem.is("i:nth-child(3)"))
          { 
            select(elem.closest("li")) 
          } 
          else if (elem.is("i:nth-child(1)")) 
          { 
            view.trigger("tree-item-expand", getPath(elem))  
          } 
          else if (elem.is("i:nth-child(2)")) 
          { 
            collapse(elem) 
          }
      }).on("dblclick", function(e){
          var elem = $(e.target);
          if (elem.is("span") || elem.is("i:nth-child(3)"))
          {
            view.trigger("tree-item-expand", getPath(elem))  
          }
      })

      function select(elem){
        if (selectedItem) $(selectedItem).removeClass("selected");
        $(elem).addClass("selected");
        selectedItem = elem;
      }
      function expand(elem){
        var $li = $(elem).closest("li");
        $li.addClass("expanded");
      }
      function collapse(elem){
        var $li = $(elem).closest("li");
        $li.removeClass("expanded");
        $li.children("ul").html("");
      }

      function getPath(elem){
        var parent = elem.closest("ul").closest("li");
        if (parent.length){
            return getPath(parent) + "/" + $(elem).closest("li").children("span").text()
        } else {
            return "" //$(elem).closest("li").children("span").text()
        }
      }
      function Renderer(folder){

        var $template = $.templates("#tree-item-template");

        this.render = function(root, data, path){

          if (path === folder){
              var $li = $(root).closest("li")
              select($li);
              expand($li);
          }

          var items = $(root).children("li");
          var hash = toHash(items);
          for(var i=0; i<data.length; i++){
            var x = data[i];
            if (x.class == "folder"){
                var item = items[i];
                var name = getName(item)

                if (item === undefined){
                    item = $($template.render(x))[0];
                    $(root).append(item);

                } else if (x.path != name){
                    if (hash[x.path]){
                        removeUntil(root, item, hash[x.path])
                        item = hash[x.path];

                    } else {
                        $( $template.render(x) ).insertBefore(item);
                    }
                }

                var newRoot = $(item).children("ul");
             
                if (x.entries){
                    this.render(newRoot, x.entries, path + "/" + x.path)
                } else {
                    // newRoot.html("");
                }

                items = $(root).children("li"); 
            }
          }
        }

        function removeUntil(root, itemToRemove, goodItem){
          if (itemToRemove != goodItem){
            var nextElem = itemToRemove.nextElementSibling;
            $(root).remove(itemToRemove);
            if (nextElem) removeUntil(root, nextElem, goodItem)
          }
        }
        function toHash(items){
          var hash = {};
          for(var i=0; i<items.length; i++){
            var item = items[i];
            var name = getName(item);
            hash[name] = item;
          }
          return hash
        }
        function getName(item){
          if (item){
            return item.querySelector("SPAN").innerHTML;
          }
          return null
        }
      }
    }
    function List(view){
      var $list = $("#list");
      var $tbody = $list.children("table:nth-child(2)");
      var $thead = $list.children("table:nth-child(1)");
      var $tfoot = $list.children("table:nth-child(3)");
      var currentFolder;

      this.draw = function(data, params){
          new Renderer(params.folder).render(data, "");
          currentFolder = params.folder
      }
      var selectedItem;

      $tbody.on("click", function(e){
          var elem = $(e.target);
          var $tr = elem.closest("tr");
          select($tr);
      }).on("dblclick", function(e){
          var elem = $(e.target);
          var $tr = elem.closest("tr");
          if ($tr.hasClass("folder") || $tr.hasClass("up")){
              view.trigger("tree-item-expand", getPath($tr))
          } else if ($tr.hasClass("file")){
              view.trigger("list-item-download", getPath($tr))
              // console.log(getPath($tr))
          }
      })

      function select(elem){
        if (selectedItem) $(selectedItem).removeClass("selected");
        $(elem).addClass("selected");
        selectedItem = elem;
      }
      function getPath($tr){
        if ($tr.hasClass("up")){
            return currentFolder.slice(0, currentFolder.lastIndexOf("/"))
        } else {
            return currentFolder + "/" + $tr.children("td:first-child").children("span").text()
        }
      }

      function Renderer(folder){
        var myHelpers = {
          formatSize: function(bytes){ 
            return bytes
          },
          formatDate: function(unixTime){ 
            var date = new Date(unixTime*1000);
            return utils.dateToString(date, "%Y-%02m-%02d %02H:%02M:%02S")
          }
        };
        var $template = $.templates("#list-item-template");

        this.render = function(data, path){
          if (path === folder){
              $tbody.children("tbody").html( $("#list-up-item-template").text() )
                                      .append( $template.render(data, myHelpers) );
              console.log(currentFolder);
              // console.log( $list.outerHeight() )
              // console.log( $thead.outerHeight() )
              // console.log( $tbody.outerHeight() )
              // console.log( $tfoot.outerHeight() )
              
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
    function Path(view){
      var $path = $("#path");
      this.draw = function(data, params){
        $path.html( ROOT + params.folder );
      }
    }
  }

  function App(){

      var tabs = tab_list();
      var model = new Model();
      var view = new View(); 

      // var load = 

      var currentNodeID = tabs[0].id;
      var userFolder = {};

      $("#short-links").on("click", "a", function(e){
          e.preventDefault()
          view.trigger("tree-item-expand", this.getAttribute("rel-path"))
          return false
      })

      view
        .on("tab-click", function(nodeID){
            if (nodeID != currentNodeID){
              currentNodeID = nodeID;
              view.trigger("tab-change");
            }
        })
        .on("tab-change", function(){
            var params = {node: currentNodeID, folder: userFolder[currentNodeID] || HOME};

            model.load(params)
                 .done( function(data){ 
                    view.draw(data,params);
                  })
                 .fail( function(data){
                    view.fail(data,params);
                 })
                 .always( function(){
                    userFolder[currentNodeID] = params.folder;
                 })
        })
        .on("tree-item-dblclick", function(){


        })
        .on("tree-item-expand", function(folder){
            var params = {node: currentNodeID, folder: folder};
            model.load(params)
                 .done( function(data){ 
                    view.draw(data,params);
                  })
                 .fail( function(data){
                    view.fail(data,params);
                 })
        })
        .on("list-item-click", function(){})
        .on("list-item-dblclick", function(){})
        .on("list-item-download", function(file){
            var params = {node: currentNodeID, file: file};
            model.load(params)
                 .done( function(data, textStatus, jqXHR){ 
                    console.log(data);
                    console.log(textStatus);
                    console.log(jqXHR.getResponseHeader("Content-Type"));
                    // utils.saveFile(data, {
                    //   fileName: params.file.slice(params.file.lastIndexOf("/")+1), 
                    //   contentType: jqXHR.getResponseHeader("Content-Type")
                    // });
                    console.log(data.length);
                    console.log(atob(data));
                    // {type: jqXHR.getResponseHeader("Content-Type")}
                    // var blob = new Blob([utils.str2ab(data)], {type: 'application/octet-stream'});
                    // console.log(blob.size);
                    // saveAs( blob, params.file.slice(params.file.lastIndexOf("/")+1) )

                  })
                 .fail( function(data){
                    console.log("Fail to load file " + ROOT + params.file);
                    console.log(data);
                 })
        })
      
      view.trigger("tab-change");

      function tab_list(){
        return $.map( $("#tabs").find("li"), function(li,i){
            var id = $(li).attr("node-id");
            return {id: id, elem: $(li), tab: null}
        })
      }
  }
  new App;
  // $(window).on("resize", function(){
  //     console.log(123);
  // })
})