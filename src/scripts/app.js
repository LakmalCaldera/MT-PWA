


// var webPush = require('web-push');
$(document).ready(function () {

  var applicationServerPublicKey = 'BIXD8Wr-HJTQQwsvR3KvwHak-tIs_o0x4DH7HId162-wFPQkQidrLTBV92n8MlJ_AFHlTYjKIthLV2N4U8S9cuE';

  // const pushButton = document.querySelector('.js-push-btn');

  var isSubscribed = false;
  var swRegistration = null;
  var app = {};
  var subscriptionJson = {};

  /*****************************************************************************
   *
   * Methods to update/refresh the UI
   *
   ****************************************************************************/
  app.showBranchList = function () {
    $('#branch').show();
    $('#service').hide();
  }

  app.showServiceList = function () {
    $('#branch').hide();
    $('#service').show();
  }

  app.navigateToBranchList = function (branches) {
    // update header
    app.updateHeader("Select a branch:");

    // Show branch list
    app.showBranchList();

    // Get template
    var template = Handlebars.compile($("#btn-template").html());

    // Empty content
    $('#branch__list').html("");

    // Load in new data
    branches.forEach(function (branch) {
      $('#branch__list').append(template(branch));
    });

    // Setup Eventhandlers
    $('.list-btn').on('click', function (event) {
      app.getServices($(this).attr('data-id'), app.navigateToServiceList);
    });
  }


  app.navigateToServiceList = function (services) {
    // update header
    app.updateHeader("Select a service:");

    // Show service list
    app.showServiceList();

    // Get template
    var template = Handlebars.compile($("#btn-template").html());

    // Empty content
    $('#service__list').html("");

    // Load in new data
    services.forEach(function (service) {
      $('#service__list').append(template(service));
    });

    // Setup Eventhandlers
    $('.list-btn').on('click', function (event) {
      // alert('Clicked');

      sendPushMsg('service id: ' + $(this).attr('data-id'));
    });
  }

  app.updateHeader = function (_title) {
    // Get template
    var template = Handlebars.compile($("#header-template").html());
    $('#header').html(template({ title: _title }));

    $('#butRefresh').on('click', function () {
      // Refresh all of the forecasts
      app.getBranches(app.navigateToBranchList);
    });

  }

  /*****************************************************************************
   *
   * Methods for dealing with the model
   *
   ****************************************************************************/

  app.getBranches = function (callback) {
    var url = "/geo/branches/?longitude=0&latitude=0&radius=2147483647";
    if ('caches' in window) {
      /*
       * Check if the service worker has already cached this url
       * If the service worker has the data, then display the cached
       * data while the app fetches the latest data.
       */
      caches.match(url).then(function (response) {
        if (response) {
          response.json().then(function updateFromCache(data) {
            callback(data);
          });
        }
      });
    }
    // Fetch the latest data.
    var request = new XMLHttpRequest();
    request.onreadystatechange = function () {
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


  app.getServices = function (branchId, callback) {
    var url = "MobileTicket/branches/" + branchId + "/services/wait-info";
    if ('caches' in window) {
      /*
       * Check if the service worker has already cached this url
       * If the service worker has the data, then display the cached
       * data while the app fetches the latest data.
       */
      caches.match(url).then(function (response) {
        if (response) {
          response.json().then(function updateFromCache(data) {
            callback(data);
          });
        }
      });
    }
    // Fetch the latest data.
    var request = new XMLHttpRequest();
    request.onreadystatechange = function () {
      if (request.readyState === XMLHttpRequest.DONE) {
        if (request.status === 200) {
          var data = JSON.parse(request.response);
          data.forEach(function (item) {
            item.id = item.serviceId;
            item.name = item.serviceName;
          });
          callback(data);
        }
      };
    };
    request.open('GET', url);
    request.send();
  };

  app.getBranches(app.navigateToBranchList);

  if ('serviceWorker' in navigator && 'PushManager' in window) {
    console.log('Service Worker and Push is supported');
    navigator.serviceWorker.register('./service-worker.js', { scope: '/' })
      .then(function (swReg) {
        console.log('Service Worker is registered', swReg);

        swRegistration = swReg;
        initialiseUI();
      })
      .catch(function (error) {
        console.error('Service Worker Error', error);
      });
  } else {
    console.warn('Push messaging is not supported');
  }

  function initialiseUI() {
    // Set the initial subscription value
    swRegistration.pushManager.getSubscription()
      .then(function (subscription) {
        isSubscribed = !(subscription === null);

        if (isSubscribed) {
          console.log('User IS already subscribed.');
          updateSubscriptionOnServer(subscription);
        } else {
          console.log('User is NOT subscribed.');
          subscribeUser();
        }
        updateSubscription();
      });
  }

  function subscribeUser() {
    const applicationServerKey = urlB64ToUint8Array(applicationServerPublicKey);
    swRegistration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: applicationServerKey
    })
      .then(function (subscription) {
        console.log('User is subscribed.');
        updateSubscriptionOnServer(subscription);
        isSubscribed = true;

      })
      .catch(function (err) {
        console.log('Failed to subscribe the user: ', err);
      });
  }

  function unsubscribeUser() {
    swRegistration.pushManager.getSubscription()
      .then(function (subscription) {
        if (subscription) {
          return subscription.unsubscribe();
        }
      })
      .catch(function (error) {
        console.log('Error unsubscribing', error);
      })
      .then(function () {
        updateSubscriptionOnServer(null);
        console.log('User is unsubscribed.');
        isSubscribed = false;
      });
  }


  function updateSubscriptionOnServer(subscription) {
    // TODO: Send subscription to application server
    if (subscription) {
      subscriptionJson.textContent = JSON.stringify(subscription);
      $.ajax({
        type: "POST",
        url: "notification",
        // The key needs to match your method's input parameter (case-sensitive).
        data: JSON.stringify({ sub: subscription }),
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        success: function (data) { },
        failure: function (errMsg) {
        }
      });
      console.log('Subscrition response: ' + subscriptionJson.textContent);
    } else {
      console.log('Subscription not success');
    }
  }

  function sendPushMsg(payload) {
    $.ajax({
      type: "POST",
      url: "notify",
      // The key needs to match your method's input parameter (case-sensitive).
      data: JSON.stringify({ msg: payload }),
      contentType: "application/json; charset=utf-8",
      dataType: "json",
      success: function (data) {
        console.log('sendPushMsg success:' + data);
      },
      failure: function (errMsg) {
        console.error('sendPushMsg faild', errMsg);
      }
    });
  }


  function updateSubscription() {
    if (Notification.permission === 'denied') {
      updateSubscriptionOnServer(null);
      return;
    }
  }

  function urlB64ToUint8Array(base64String) {
    var padding = '='.repeat((4 - base64String.length % 4) % 4);
    var base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/');

    var rawData = window.atob(base64);
    var outputArray = new Uint8Array(rawData.length);

    for (var i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

});

