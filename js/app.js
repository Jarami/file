requirejs.config({
    "baseUrl": "js/lib",
    "paths": {
      "app": "../app"
    },
    "shim": {
        "jquery-ui": ["jquery"],
        "jsrender.min": ["jquery"],
        "datatable": ["jquery"]
    }
});

// Load the main app module to start the app
requirejs(["app/main"]);