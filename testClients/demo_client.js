const fs = require('fs');
const https = require('https');
const request = require('request');
const readline = require('readline');
var token = "host1";
const SecureWebsocket = require('./securedws');

var options = {
  host: '127.0.0.1',
  port: 8445,
  ca: fs.readFileSync('cert.pem'),
  checkServerIdentity: () => undefined,
  key: fs.readFileSync('client-key.pem'),
  cert: fs.readFileSync('client-cert.pem')
};

ws = new SecureWebsocket('https://127.0.0.1:8445', options);

var stdin = process.openStdin();
stdin.addListener("data", function(d) {
	if(!ws){
		return
	}
	if (d.toString().trim()) {
		ws.send(d.toString().trim());
    	console.log("you entered: [" +
        	d.toString().trim() + "]");
	}

  });
  
  ws.on('message', function incoming(data) {
    console.log(data);
  });
