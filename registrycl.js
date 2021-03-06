var net = require('net');

exports.init = function(sock){
    sock.on('data', function(data){
        var lines = data.toString().split(/\n|\r/);

        lines.forEach(function(line){
            if(line) {
                sock.emit('line', line);
            }
        });
    });

    sock.on('line', function(line){
        var signal = line.match(/^#(.+)\|(.*)/);
        var response = line.match(/^%(.+)\|(.*)/)

        if(signal) {
            sock.emit('signal', signal[1], signal[2]);
        } else if(response) {
            sock.emit('response', response[1], response[2]);
        }
    });
}

exports.register = function(sock, info, callback){
    sock.user = info.user;
    sock.on('response', function resp(key, args){
        if(key == 'register;ok') {
            sock.removeListener('response', resp);
            callback(null);
        } else if(key == 'register;error') {
            sock.removeListener('response', resp);
            callback(new Error(args));
        }
    });

    sock.write(
        '%register|'+[info.user,info.address,info.port].join(',') + '\n'
    );
}

exports.signal = function(sock, user, message){
    sock.write('%signal|' + [user,message].join(',') + '\n');
}

exports.signalcb = function(sock, user, message, callback){
    sock.on('response', function resp(key, args){
        if(key == 'signal;ok') {
            sock.removeListener('response', resp);
            callback(null);
        } else if(key == 'signal;error') {
            sock.removeListener('response', resp);
            callback(new Error(args));
        }
    });
    sock.write('%signal|' + [user,message].join(',') + '\n');
}

exports.checki = function(sock, port){
    sock.write('%checki|' + port + '\n');
}

exports.info = function(sock, user, callback){
    sock.on('response', function resp(key, args){
        if(key == 'info;ok') {
            var args = args.split(',');
            var address = args.shift();
            var port = args.shift();

            sock.removeListener('response', resp);
            callback(null, {addr: address, port: port});
        } else if(key == 'info;error') {
            sock.removeListener('response', resp);
            callback(new Error(args));
        }
    });

    sock.write('%info|' + user + '\n');
}
