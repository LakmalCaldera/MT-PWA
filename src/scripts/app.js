

  'use strict';

  $(document).ready(function(){

  var app = {};


  /*****************************************************************************
   *
   * Event listeners for UI elements
   *
   ****************************************************************************/
  


  /*****************************************************************************
   *
   * Methods to update/refresh the UI
   *
   ****************************************************************************/



  /*****************************************************************************
   *
   * Methods for dealing with the model
   *
   ****************************************************************************/

  app.getBranches = function() {
    var url = "/geo/branches/?longitude=0&latitude=0&radius=2147483647";
    if ('caches' in window) {
      /*
       * Check if the service worker has already cached this url
       * If the service worker has the data, then display the cached
       * data while the app fetches the latest data.
       */
      caches.match(url).then(function(response) {
        if (response) {
          response.json().then(function updateFromCache(data) {
            app.updateBranchList(data);
          });
        }
      });
    }
    // Fetch the latest data.
    var request = new XMLHttpRequest();
    request.onreadystatechange = function() {
      if (request.readyState === XMLHttpRequest.DONE) {
        if (request.status === 200) {
          var data = JSON.parse(request.response);
          app.updateBranchList(data);
        }
      };
    };
    request.open('GET', url);
    request.send();
  };

  app.updateBranchList = function(branches){
    var template = Handlebars.compile($("#btn-template").html());
    branches.forEach(function(branch){
      $('#branch-list').html = "";
      $('#branch-list').append(template(branch));
    });

    $('.branch-btn').on('click', function(event){
      alert('Clicked');
    });

  }

  app.getBranches();

  /*if ('serviceWorker' in navigator) {
    navigator.serviceWorker
             .register('./service-worker.js')
             .then(function() { console.log('Service Worker Registered'); });
  }*/

  });

