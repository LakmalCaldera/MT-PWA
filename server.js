var proxy = require('express-http-proxy');
const bodyParser = require('body-parser');
var express = require('express');
var fs = require('fs');
var https = require('https');
var path = require('path');
var app = express();
var webPush = require('web-push');
var configFile = 'proxy-config.json';
var host = 'localhost:9090';
var authToken = 'nosecrets';
var port = '80';
var sslPort = '4443';
var supportSSL = false;
var validAPIGWCert = "1";
var APIGWHasSSL = true;
var subscriptionJson = {};
var payload = "";



//update configurations using config.json
var configuration = JSON.parse(
	fs.readFileSync(configFile)
);

host = configuration.apigw_ip_port.value;
port = configuration.local_webserver_port.value;
authToken = configuration.auth_token.value;
sslPort = configuration.local_webserver_ssl_port.value;
supportSSL = (configuration.support_ssl.value.trim() === 'true') ? true : false;
validAPIGWCert = (configuration.gateway_certificate_is_valid.value.trim() === 'true') ? "1" : "0";
APIGWHasSSL = (configuration.gateway_has_certificate.value.trim() === 'true') ? true : false;


//this will bypass certificate errors in node to API gateway encrypted channel, if set to '1'
//if '0' communication will be blocked. So production this should be set to '0'
process.env.NODE_TLS_REJECT_UNAUTHORIZED = validAPIGWCert;

var privateKey, certificate, credentials;

if (supportSSL) {
	privateKey = fs.readFileSync('sslcert/server.key', 'utf8');
	certificate = fs.readFileSync('sslcert/server.crt', 'utf8');
	credentials = { key: privateKey, cert: certificate };
}

app.use(express.static(__dirname + '/src'));

// Redirect no_visit requests to index.html
/*app.get('/no_visit$', function (req, res) {
	res.sendFile(path.join(__dirname + '/src', 'index.html'));
});

// Redirect all requests that start with branches and end, to index.html
app.get('/branches*', function (req, res) {
	res.sendFile(path.join(__dirname + '/src', 'index.html'));
});

// Redirect all requests that start with services and end, to index.html
app.get('/services$', function (req, res) {
	res.sendFile(path.join(__dirname + '/src', 'index.html'));
});

// Redirect all requests that start with ticket info and end, to index.html
app.get('/ticket$', function (req, res) {
	res.sendFile(path.join(__dirname + '/src', 'index.html'));
});*/


// Proxy mobile example to API gateway
var apiProxy = proxy(host, {									// ip and port off apigateway
	forwardPath: function (req, res) {
		return require('url').parse(req.originalUrl).path;
	},
	decorateRequest: function (req) {
		req.headers['auth-token'] = authToken		// api_token for mobile user
		req.headers['Content-Type'] = 'application/json'
		console.log(req.path, req.headers);
		return req;
	},
	https: APIGWHasSSL
});

app.use("/geo/branches/*", apiProxy);
app.use("/MobileTicket/branches/*", apiProxy);
app.use("/MobileTicket/services/*", apiProxy);
app.use("/MobileTicket/MyVisit/*", apiProxy);
app.use("/rest/servicepoint/*", apiProxy);
app.use("/rest/entrypoint/*", apiProxy);

if (supportSSL) {
	var httpsServer = https.createServer(credentials, app);
	httpsServer.listen(sslPort, function () {
		var listenAddress = httpsServer.address().address;
		var listenPort = httpsServer.address().port;

		console.log("Mobile Ticket app listening at https://%s:%s over SSL", listenAddress, listenPort);
	});
}
else {
	var server = app.listen(port, function () {  										// port the mobileTicket will listen to.
		var listenAddress = server.address().address;
		var listenPort = server.address().port;
		console.log("Mobile Ticket app listening at http://%s:%s", listenAddress, listenPort);

	});
}

/*
app.use(bodyParser.json());

app.post('/notify', function(req, res) {
	var payload = req.body.msg;
	console.log('/notify ' + payload);
	sendPushMsg(payload, subscriptionJson);
})

app.post('/notification', function (req, res) {
	console.log('/notification ' + JSON.stringify(req.body.sub));
	subscriptionJson = req.body.sub;
});

function sendPushMsg(payload, subscriptionJson) {
	console.log('=================== sendPushMsg() to FCM' + JSON.stringify(subscriptionJson));
	var options = {
		vapidDetails: {
			subject: 'mailto:prasad.era@gmail.com',
			publicKey: 'BIXD8Wr-HJTQQwsvR3KvwHak-tIs_o0x4DH7HId162-wFPQkQidrLTBV92n8MlJ_AFHlTYjKIthLV2N4U8S9cuE',
			privateKey: 'NCzQA0CdXsJeDo4c2rWvk81U2d1cChrUoR99QDpNUc8'
		},
		TTL: 60
	};

	webPush.sendNotification(
		subscriptionJson,
		payload,
		options
	);

}*/

