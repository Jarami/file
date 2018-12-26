define(["jquery", "jquery-ui", "jsrender.min"], function($) {

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
        dataType: 'json'
      })
    }
  }

  function View(){
    Subscriber.apply(this, arguments);
    
    var self = this;
    var tree = new Tree(this);
    var list = new List(this);

    $("#tabs").on("click", function(e){
        var nodeID = $(e.target).closest("li").attr("node-id");
        if (nodeID) self.trigger("tab-click", nodeID);
    })

    this.draw = function(data, params){
      tree.draw(data, params);
      list.draw(data, params);
    }
    this.fail = function(data, params){
      console.log("Опаньки!");
    }

    function Tree(view){  
      var $tree = $("#tree");
      var $list = $tree.children('ul');
      var tree;
      var selectedItem;
      var self = this;

      new TreeRenderer(ROOT).render($list, [{class: "folder", path: ROOT}], ROOT);
      var $root = $list.children("li").children("ul");

      this.draw = function(data, params){
          console.log(data);
          new TreeRenderer(ROOT + '/' + params.folder).render($root, data, ROOT);
      }

      $tree.on("click", function(e){
        var elem = $(e.target).closest("li");
        self.trigger("tree-item-click", elem)
      })

      function TreeRenderer(folder){

        var $template = $.templates("#tree-item-template");

        this.render = function(root, data, path){
          console.log(path);
          console.log(folder);
          console.log(path === folder);

          if (path === folder) select($(root).closest("li"));

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
                    newRoot.html("");
                }

                items = $(root).children("li"); 
            }
          }
        }

        function select(elem){
          if (selectedItem) $(selectedItem).removeClass("selected");
          $(elem).addClass("selected");
          selectedItem = elem;
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
      this.draw = function(data){
          // $list.text(data);
      }
    }

  }

  function App(){

      var tabs = tab_list();
      var model = new Model();
      var view = new View(); 

      var currentNodeID = tabs[0].id;
      var userFolder = {};

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
        .on("tree-item-click", function(){

        })
        .on("tree-item-dblclick", function(){})
        .on("tree-item-expand", function(){})
        .on("list-item-click", function(){})
        .on("list-item-dblclick", function(){})
        .on("list-item-download", function(){})
      
      view.trigger("tab-change");

      function tab_list(){
        return $.map( $("#tabs").find("li"), function(li,i){
            var id = $(li).attr("node-id");
            return {id: id, elem: $(li), tab: null}
        })
      }
  }
  new App;

});