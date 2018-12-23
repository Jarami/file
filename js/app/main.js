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

    this.load = function(nodeID){
      var folder = nodes[nodeID].folder;
      var url = "/";

      // console.log("model.load " + nodeID);
      // console.log(url);
      return $.ajax({
        url: url,
        cache: false,
        timeout: 10000, /* 10sec */
        data: {node: nodeID, folder: folder},
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

    this.draw = function(data){
      tree.draw(data);
      list.draw(data);
    }
    this.fail = function(data){
      console.log("Опаньки!");
      tree.text(data);
      list.text(data);
    }

    this.expect = function(nodeID){
      tree.text("loading...");
      list.text("loading...");
      return new Expect(this, nodeID)
    }

    function Tree(view){  
      var $tree = $("#tree");
      var $list = $tree.children('ul');
      var $template = $.templates("#tree-template");

      this.draw = function(data){
        console.log(data);
          $list.hide();
          $list.html($template.render(data));
          $list.show(200);
          console.log(111);
      }
      this.text = function(text){
          $list.text(text);
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
    function Expect(parent, nodeID){
      var self = this;

      this.what = nodeID;
      this.from = function(ajax){
         ajax
           .success( function(data){ 
              // console.log("success",data);
              parent.draw(data);
           })
           .error( function(data){ 
              // console.log("error",data);
              parent.fail(data);
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
            var ajax = model.load(currentNodeID);
            view.expect(currentNodeID).from(ajax);
        })
        .on("tree-item-click", function(){})
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