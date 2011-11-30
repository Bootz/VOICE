var net = require('net');
var registry = require('./registrycl');
var nat = require('./nat');

var user = process.argv[2];
var other_user = process.argv[3];

var reg = net.connect(6666, 'darkboxed.org');
registry.init(reg);
registry.register(reg, { user: user });

var state = nat.ready_for_punching(reg, function(err, dsock){
    if(err) throw err;

    console.log('Success');
});

nat.get_ip(reg, state.dsock, function(err, address){
    registry.register(reg, {
        user: user,
        address: address.addr,
        port: address.port
    });

    if(other_user) {
        nat.punch(state, other_user);
    }
});
