#!/usr/bin/env nodejs
const WebSocket = require('ws');
const https = require('https');
const jwt = require('jsonwebtoken');
const EventEmitter = require('events');

var client_id = 0;
var secretKey = makeID();

function makeID() {
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    for (var i = 0; i < 5; i++)
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    return text;
}

function add(req,res) {
    res.end();
}

function genToken() {
    client_id = client_id + 1;
    var token = jwt.sign({client_id}, secretKey);
    console.log(token);
    return token;
}
function auth(req, res, secretKey) {
    console.log("http secretKey",secretKey);
    if(!('token' in req.headers)) {
        res.write(genToken());
        res.end();
    } else {
        jwt.verify(req.headers['token'],secretKey,(err, decoded) => {
            if(!err){
                res.write(req.headers['token']);
                res.end();
            } else{
                res.write(genToken());
                res.end();
            }
        });
    }
}

function handleRequest(req,res) {
    if('/' == req.url) {
        switch (req.method) {
            case 'GET':
                auth(req,res, secretKey);
            case 'POST':
                add(req,res);
        }
    }
}

class SecureServer extends EventEmitter {
    constructor(options) {
        super();
        this._options = options;
        this._httpsServer = null;
        this._ws = null;
        this.initServer(options);
    }

    initServer(options) {
        if(options.port == null && options.host == null) {
            throw new TypeError('No port specified');
        }

        this._httpsServer = https.createServer(options);
        this._httpsServer.listen(options.port);
        this._httpsServer.on('request', handleRequest);

        this._ws = new WebSocket.Server(
        {
            server: this._httpsServer,
            verifyClient: verifyClient
        });

        if(this._ws){
            console.log('listening at %s', options.port)
            this._removeListeners = addListeners(this._ws, {
                message: this.emit.bind(this, 'message'),
                error: this.emit.bind(this, 'error'),
                headers: this.emit.bind(this,'headers'),
                connection: this.emit.bind(this, 'connection'),
                close: this.emit.bind('close')
            });
        }

    }
}

function verifyClient(info, done) {
    console.log('verify client');
    let pass = true;
    if (! ('token' in info.req.headers))
    {
        pass = false;
    } else {
        jwt.verify(info.req.headers['token'],secretKey,(err, decoded) => {
            if(err){
                console.log('jwt error %s', err);
                pass = false;
            } else{
                pass = true;
                info.req.headers['token'] = decoded;
                console.log('decoded token id %s', decoded.client_id);
            }
        });
    }
    done(res=pass);
}

function addListeners(server, map) {
    for (const event of Object.keys(map)) server.on(event, map[event]);
    return function removeListeners() {
      for (const event of Object.keys(map)) {
        server.removeListener(event, map[event]);
      }
    };
}

module.exports = SecureServer;