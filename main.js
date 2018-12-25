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

  function Model(tab_list){
    Subscriber.apply(this, arguments);
    var self = this;

    var nodes = {};

    $.each(tab_list, function(index,item){
      var node = {
                    id: item.id,
                    folder: "HOME"
                  }
      nodes[item.id] = node;
    })

    this.load = function(params){
      params.folder = nodes[params.node].folder;
      var url = "/";

      return $.ajax({
        url: url,
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
      tree.text(data, params);
      list.text(data, params);
    }

    this.expect = function(params){
      tree.text("loading...", params);
      list.text("loading...", params);
      return new Expect(this, params)
    }

    function Tree(view){  
      var $tree = $("#tree");
      var $list = $tree.children('ul');
      var $template = $.templates("#tree-template");
      var tree;
      var selectedItem;
      var self = this;

      this.draw = function(data, params){
          tree = data;
          $list.hide();
          $list.html($template.render(data));

          $list.show(200);

          var elems = $list.children("li");
          assignData(tree, elems);
          console.log(treeItems);

      }
      this.text = function(text, params){
          tree = null;
          $list.text(text);
      }

      $tree.on("click", function(e){
        var elem = $(e.target).closest("li");
        self.trigger("tree-item-click", elem)
      })

      var treeItems = [];

      function assignData(items, elems){
        $.each( elems, function(index, elem){
          var item = items[index];
          var $elem = $(elem);
          item.elem = $elem;
          
          treeItems.push(new Item(item, elem))

          if (item.entries.length){
            var subelems = $elem.children("ul").children("li");
            assignData(item.entries, subelems);
          }
        })
      }

      var selectedItem;
      function Item(item, elem){
        this.select = function(){
          if (selectedItem) selectedItem.unselect();
          elem.addClass("select");
          selectedItem = this;
        }
        this.toggle = function(){elem.toggleClass("select")}
        this.unselect = function(){
          elem.removeClass("select");
          selectedItem = null;
        }
      }
    }
    function List(view){
      var $list = $("#list");
      this.draw = function(data){
          // $list.text(data);
      }
      this.text = function(text){
          // $list.text(text);
      }
    }
    function Expect(parent, params){
      var self = this;

      this.from = function(ajax){
         ajax
           .success( function(data){ 
              // console.log("success",data);
              parent.draw(data, params);
           })
           .error( function(data){ 
              // console.log("error",data);
              parent.fail(data, params);
           })
      }
    }
  }

  function App(){

      var tabs = tab_list();
      var model = new Model(tabs);
      var view = new View(); 

      var currentNodeID = tabs[0].id;

      view
        .on("tab-click", function(nodeID){
            if (nodeID != currentNodeID){
              currentNodeID = nodeID;
              view.trigger("tab-change");
            }
        })
        .on("tab-change", function(){
            var params = {node: currentNodeID};
            var ajax = model.load(params);
            view.expect(params).from(ajax);
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