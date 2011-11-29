#!/usr/bin/env node

if(process.version < 'v0.6.0') {
    console.error('You need at least node v0.6.0');
    exit(1);
}

var dgram = require('dgram');
var args = process.argv.slice(0);
var remoteHost = null, port = 1337;

while(args.length > 0){
    var arg = args.shift();

    if(arg == '--host' || arg == '-h') {
        remoteHost = args.shift();
    } else if (arg == '--port' || arg == '-p') {
        port = parseInt(args.shift());
    }
}

var socket = dgram.createSocket('udp4');

var seq = 0;
var mask = (1<<10)-1;

function accept_seq(mseq){
    if(((mseq + 1) & mask) > ((seq + 1) & mask)) {
        seq = mseq;
        return true;
    } else if( (mseq & mask) > (seq & mask) ){
        seq = mseq;
        return true;
    } else {
        return false;
    }
}


function parse_message(buffer){
    var msg_seq = buffer.readUInt16BE(0);
    var msg = buffer.slice(2);

    if(accept_seq(msg_seq)) {
        return msg;
    }

    return null;
}

function create_message(message){
    var msg = new Buffer(message.length + 2);
    message.copy(msg, 2, 0);


    msg.writeUInt16BE(++seq, 0);

    return msg;
}

socket.on('listening', function(){
    var address = socket.address();
    console.error("listening " + address.address + ":" + address.port);

    socket.on('message', function(msg, rinfo){
        if(msg = parse_message(msg)) {
            process.stdout.write(msg);
        }
    });
});

process.stdin.on('data', function(chunk) {
    var message = create_message(chunk);
    socket.send(message, 0, message.length, port, remoteHost);
    socket.send(message, 0, message.length, port, remoteHost);
});

process.stdin.resume();

if (!remoteHost) {
    socket.bind(port);
}
