#!/usr/bin/env nodejs

const SecureServer = require('./SecureServer');
const fs = require('fs');



var privateKey  = fs.readFileSync('key.pem', 'utf8');
var certificate = fs.readFileSync('cert.pem', 'utf8');
var client_cert = fs.readFileSync('client-cert.pem', 'utf8');
var options = {port: 8445, key: privateKey, cert: certificate, requestCert: true, ca: [client_cert]};


server = new SecureServer(options);



server.on('connection', function connection(ws, request) {
    ws.id = request.headers['token'].client_id;
    ws.on('message', function incoming(message,id) {
         console.log('received: %s from client_id %s', message, ws.id);
         ws.send('Message from Server ' + message);
       });
    ws.send('WSServer Connected');
 });