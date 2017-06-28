

  'use strict';

  $(document).ready(function(){

  var app = {};


  /*****************************************************************************
   *
   * Event listeners for UI elements
   *
   ****************************************************************************/
    app.addBranchClickHandler = function(elem){

    }


  /*****************************************************************************
   *
   * Methods to update/refresh the UI
   *
   ****************************************************************************/
   app.showBranchList = function(){
    $('#branch').show();
    $('#service').hide();
   }

   app.showServiceList = function(){
    $('#branch').hide();
    $('#service').show();
   }

   app.navigateToBranchList = function(branches){
    // Show branch list
    app.showBranchList();

    // Get template
    var template = Handlebars.compile($("#btn-template").html());
    
    // Empty content
    $('#branch__list').html = "";
    
    // Load in new data
    branches.forEach(function(branch){
      $('#branch__list').append(template(branch));
    });

    // Setup Eventhandlers
    $('.list-btn').on('click', function(event){
      app.getServices($(this).attr('data-id'), app.navigateToServiceList);
    });
  }


  app.navigateToServiceList = function(services){
    // Show service list
    app.showServiceList();

    // Get template
    var template = Handlebars.compile($("#btn-template").html());
    
    // Empty content
    $('#service__list').html = "";
    
    // Load in new data
    services.forEach(function(service){
      $('#service__list').append(template(service));
    });

    // Setup Eventhandlers
    $('.list-btn').on('click', function(event){
      alert('Clicked');
    });
  }

  /*****************************************************************************
   *
   * Methods for dealing with the model
   *
   ****************************************************************************/

  app.getBranches = function(callback) {
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
            callback(data);
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
          callback(data);
        }
      };
    };
    request.open('GET', url);
    request.send();
  };


  app.getServices = function(branchId, callback) {
    var url = "MobileTicket/branches/"+ branchId +"/services/wait-info";
    if ('caches' in window) {
      /*
       * Check if the service worker has already cached this url
       * If the service worker has the data, then display the cached
       * data while the app fetches the latest data.
       */
      caches.match(url).then(function(response) {
        if (response) {
          response.json().then(function updateFromCache(data) {
            callback(data);
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
          data.forEach(function(item){
            item.id = item.serviceId;
          });
          callback(data);
        }
      };
    };
    request.open('GET', url);
    request.send();
  };


  app.getBranches(app.navigateToBranchList);

  /*if ('serviceWorker' in navigator) {
    navigator.serviceWorker
             .register('./service-worker.js')
             .then(function() { console.log('Service Worker Registered'); });
  }*/

  });

