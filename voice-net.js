#!/usr/bin/env node

if(process.version < 'v0.6.0') {
    console.error('You need at least node v0.6.0');
    exit(1);
}

var net = require('net');
var util = require('util');
var dgram = require('dgram');


var registry = require('./registrycl');
var nat = require('./nat');

var args = process.argv.slice(0);
var remoteHost = null, port = 1337, user, callee, reg_host;

while(args.length > 0){
    var arg = args.shift();

    if(arg == '--host' || arg == '-h') {
        remoteHost = args.shift();
    } else if (arg == '--port' || arg == '-p') {
        port = parseInt(args.shift());
    } else if (arg == '--user') {
        user = args.shift();
    } else if (arg == '--callee') {
        callee = args.shift();
    } else if(arg == '--reg') {
        reg_host = args.shift();
    }
}

if(reg_host && user && callee) {

    var msg = util.format('Registering as %s on %s..', user, reg_host);
    process.stderr.write(msg);

    var reg = net.connect(6666, 'darkboxed.org');
    registry.init(reg);
    registry.register(reg, { user: user }, function(err){
        if(err) {
            console.error('FAIL :\'(');
            return error(err);
        }

        console.error('Success!');
        try_signal();
    });

    function try_signal(){
        var msg = util.format('Trying to signal %s..', callee);
        process.stderr.write(msg);

        registry.signalcb(reg, callee, ['presence', 'online'].join(','),function(err){
            if(err) {
                console.error('not registered');
                wait_signal();
            } else {
                console.error('Success!');
                setup_connection();
            }
        });
    }

    function wait_signal(){
        var msg = util.format('Waiting for %s to signal..', callee);
        process.stderr.write(msg);

        reg.on('signal', function(user, message){
            console.log('#', user, message);
            var message = message.split(',');
            var subject = message.shift();
            var arg = message.shift();

            if(user == callee && subject == 'persence' && arg == 'online') {
                console.error('He\'s here!');
                setup_connection();
            }
        });
    }

    function setup_connection(){
        var msg = util.format('Punching that fucking NAT..');
        process.stderr.write(msg);

        var state = nat.ready_for_punching(reg, function(err, dsock, address){

            socket = dsock;
            port = address;

            do_voice();
        });

        nat.get_ip(reg, state.dsock, function(err, address){
            registry.register(reg, {
                user: user,
                address: address.addr,
                port: address.port
            }, function(err){
                if(err) { console.error('FAILED :(('); process.exit(1); }

                console.error('WIN!');
                nat.punch(state, callee);
            });
        });
    }
} else {
    var socket = dgram.createSocket('udp4');

    do_voice()


    if (!remoteHost) {
        socket.bind(port);
    }
}

function do_voice(){
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

}
