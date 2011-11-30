var net = require('net');
var dgram = require('dgram');
var registry = require('./registrycl');


exports.ready_for_punching = function(sock, callback){
    var punch_state = {
        sock: sock,
        callback: callback
    };

    sock.once('signal', function(user, message){
        try {
            message = message.split(',');
            var cmd = message.shift();
            if(cmd == 'punch') {
                exports.punch(punch_state, user, message);
            }
        } catch(e) {
            console.error(e);
        }
    });

    var dsock = dgram.createSocket('udp4');
    dsock.bind();
    punch_state.dsock = dsock;

    return punch_state;
}

exports.punch = function(state, user, message){
    var dsock = state.dsock;

    if(message) {
        var addr = message.shift();
        var port = message.shift();

        do_punch({ addr: addr, port: port});
    } else {
        registry.info(state.sock, state.sock.user, function(err, my_address){
            if(err) { state.callback(err); return; }

            var msg = ['punch', my_address.addr, my_address.port];
            registry.signal(state.sock, user, msg.join(','));

            registry.info(state.sock, user, function(err, other_addr){
                if(err) { state.callback(err); return; }

                do_punch(other_addr);
            });
        });
    }

    function do_punch(address){
        var addr = address.addr;
        var port = address.port;

        var trying = new Buffer('trying');
        var ack = new Buffer('ack');

        var buffer = trying;

        var interval = setInterval(function(){
            dsock.send(buffer, 0, buffer.length, port, addr);
        }, 20);

        dsock.on('message', function onmsg(data){
            buffer = ack;

            if(data.toString() == 'ack') {
                dsock.removeListener('message', onmsg);
                state.callback(null, dsock, address);
            }
        });
    }
}

exports.get_ip = function get_my_ip(sock, dsock, callback){
    var checki_response = function(key, args){
        if(key == 'checki;ok') {
            var args = args.split(',');
            var token = args.shift();

            var buffer = new Buffer(token);

            var addr = sock.remoteAddress;
            var port = sock.remotePort;

            dsock.send(buffer, 0, buffer.length, port, addr);
        } else if(key == 'checki') {
            args = args.split(',');
            var my_address = args.shift();
            var my_port = args.shift();

            sock.removeListener('response', checki_response);
            callback(null, {addr: my_address, port: my_port});
        }
    }

    sock.on('response', checki_response);
    registry.checki(sock);
}
