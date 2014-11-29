var message = require('./message');
var EventEmitter = require('events').EventEmitter;

/*

Handle socket events
----

*/

var handlers = {};

/*

Received a patch.

*/
handlers.patch = function (self, data) {
  //> We can only apply the patch if the sequence remains unbroken.
  //> if this happens we tell the server we need a fresh copy
  if (data.seq !== self.obj.seq + 1) {
    self.events.emit('error', 'SEQ BROKEN', data);
    self._send({
      cmd: 'refresh'
    });
    return;
  }

  //> update our copy of the state, and the sequence.
  self.applyPatch(self.obj.state, data.data);
  self.obj.seq = data.seq;

  self.events.emit('patch', data.data, data.seq);
};

/*

Received a refresh.

*/
handlers.refresh = function (self, data) {
  self.obj.state = data.state;
  self.obj.seq = data.seq;

  self.events.emit('refresh', self.obj.state, self.obj.seq);
};

function Client (ws, applyPatchFunc) {
  this.obj = {
    state: {},
    seq: 0
  };

  this.ws = ws;
  this.applyPatch = applyPatchFunc;
  this.events = new EventEmitter();

  this._setup();
}

Client.prototype.patch = function (data) {
  //> update the state (but not seq)
  this.applyPatch(this.obj.state, data);

  // TODO: need own copy
  handlers['patch-ack'] = function (self, data) {
    delete handlers['patch-ack'];

    self.events.emit('patch-ack', data);
  };

  //> send the patch cmd to the server along with the current seq
  this._send({
    cmd: 'patch',
    data: data,
    seq: this.obj.seq
  });
};

Client.prototype._send = function (data) {
  this.ws.send(message.encode(data));
};

Client.prototype._setup = function () {
  var self = this;
  this.ws.addEventListener('message', function (event) {
    var data = message.decode(event.data);
    if (!data) { return; }

    var handler = handlers[data.type];
    if (!handler) {
      return self.events.emit('error', 'UNKNOWN MSG TYPE', data);
    }

    handler(self, data);
  });
};

module.exports = Client;
