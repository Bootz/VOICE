var net = require('net');
var dgram = require('dgram');

var registry = {};
var connections = {};
var tokens = {};

var server = net.createServer();

server.on('connection', function(socket){
    socket.on('data', function(data){
        var lines = data.toString().split(/\n|\r/);

        lines.forEach(function(line){
            if(line) {
                socket.emit('line', line);
            }
        });
    });

    socket.on('line', function(line){
        try {
            var connection = connections[conn(socket)] || {};
            var user = connection.user;

            var line = line.match(/^%([a-z]+)\|(.*)/);

            var cmd = line[1];
            var args = line[2].split(',');

            switch(cmd) {
            case 'register':
                user = args.shift();
                var address = args.shift();
                var port = args.shift()

                var c = conn(socket);

                connections[c] = { socket: socket,
                                   user: user };

               registry[user] = registry[user] || {};
                var entry = registry[user];

                entry.address = address;
                entry.port = port;
                entry.connection = c;

                socket.on('close', function(){
                    console.log(user + ' closed the connection');
                    registry[user] = null;
                    connections[c] = null;
                });

                socket.write('%register;ok|\n');
                console.log('%s registered: %j', user, entry);

                break;
            case 'info':
                var other_user = args.shift();
                var entry = registry[other_user];

                socket.write('%info;ok|' + [entry.address,entry.port].join(',')
                             + '\n');

                break;
            case 'signal':
                if(!user) throw new Error('register first');

                var to_user = args.shift();
                var message = args.join(',');
                var c = registry[to_user].connection;
                connections[c].socket.write('#'+ user +'|'  + message + '\n');

                socket.write('%signal;ok|\n');

                break;
            case 'checki':
                if(!user) throw new Error('register first');

                var port = args.shift();
                var token = Math.floor(Math.random()*Math.pow(10,16))
                    .toString(16);

                registry[user].checki_token = token;
                tokens[token] = user;

                // remove token after timout
                setTimeout(function(){
                    tokens[token] = undefined;
                    if(registry[user]) {
                        registry[user].checki_token = null;
                    }
                }, 100000);

                checkport(socket.remoteAddress, parseInt(port), token);
                socket.write(
                    '%checki;ok|' + [token,socket.remoteAddress].join(',') + '\n'
                );

                break;
            }

        } catch(e) {
            socket.write('%error|' + e.message + '\n');
            console.log('%s caused an error: %s while / %s'
                        , user, e.message, line && line.input);
        }
    });
});

var addrserv = dgram.createSocket('udp4');
addrserv.on('message', function(data, remoteInfo){
    var addr = remoteInfo.address;
    var port = remoteInfo.port;

    var token = data.toString();
    var user = tokens[token];
    console.log('checki', token, user);
    if(user) {
        var connection = registry[user].connection;
        var sock = connections[connection].socket;
        sock.write('%checki|' + [addr,port].join(','));

        tokens[token] = undefined;
        registry[user].checki_token = null;
    }
});

server.listen(6666);
addrserv.bind(6666);

function checkport(ip, port, data){
    var sock = dgram.createSocket('udp4');
    var buffer = new Buffer(data);
    sock.send(buffer, 0, buffer.length, port, ip, function(err){
        sock.close();
    });
}

function conn(socket){
    return socket.remoteAddress +':'+ socket.remotePort;
}

function args(args){
    return args.join(',');
}
