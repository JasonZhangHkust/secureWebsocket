const EventEmitter = require('events');
const https = require('https');
const fs = require('fs');
const WebSocket = require('ws');

class SecuredWebsocketClient extends EventEmitter {
    constructor(address, options) {
        super();
        this._ws = null;
        this._token = null;
        fs.exists('./token.txt', (exists) => {
            if(exists) {
                this._token = fs.readFileSync('./token.txt', {encoding:'utf8'});
            }
            this.getToken(address, options);
        });
        this._options = options;
        this._address = address;
        this.on('TokenReady', this.saveToken);
        this.on('TokenReady', this.initWebsocket);
    }

    getToken(address, options) {
        options['headers'] = Object.assign({
            'token' : this._token
        });
        https.get(options, (res) => {
            const { statusCode } = res;
            const contentType = res.headers['content-type'];
            let error;
            if (statusCode !== 200) {
              error = new Error('Request Failed.\n' +
                                `Status Code: ${statusCode}`);
            }
            if (error) {
              console.error(error.message);
              // consume response data to free up memory
              res.resume();
              return;
            }
            res.setEncoding('utf8');
            let rawData = '';
            res.on('data', (chunk) => { rawData += chunk; });
            res.on('end', () => {
              try {
                this._token = rawData;
                this.emit('TokenReady', rawData);
              } catch (e) {
                console.error(e.message);
              }
            });
          }).on('error', (e) => {
            console.error(`Got error: ${e.message}`);
          });

    };

    initWebsocket() {
        this._options['headers'] = Object.assign({
            'token' : this._token
        });
        try {
            const ws = new WebSocket(this._address, this._options);
            this._ws = ws;
            ws.on('error', (err)=> {this.emit('error', err)});
            ws.on('message', (data)=> {this.emit('message', data)});
            ws.on('open', () => {this.emit('open')});
        } catch (error) {
            this.emit('error', error);
            this.emitClose();
        }
    }

    saveToken(token) {
        fs.writeFile('./token.txt', token, (err)=>{
            console.log(err);
        });
    }

    send(data) {
        if(this._ws) {
            this._ws.send(data);
        }
    }
}

module.exports = SecuredWebsocketClient;