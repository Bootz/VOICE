#!/usr/bin/env node

var dgram = require('dgram');
var args = process.argv.slice(0);
var remoteHost = null, port = 1337;


while(args.length > 0){
    var arg = args.shift();

    if(arg == '--host' || arg == '-h') {
        remoteHost = args.shift();
    } else if (arg == '--port' || arg == '-p') {
        port = args.shift();
    }
}



var socket = dgram.createSocket('udp4');

var seq = 0;

socket.on('listening', function(){
    var address = socket.address();
    console.error("listening " + address.address + ":" + address.port);

    socket.on('message', function(msg, rinfo){
        process.stdout.write(msg);
    });
});

process.stdin.on('data', function(chunk) {
    socket.send(chunk, 0, chunk.length, port, remoteHost);
});

process.stdin.resume();


if (!remoteHost && port) {
    socket.bind(parseInt(port));
}


