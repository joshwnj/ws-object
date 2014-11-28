var message = require('./message');
var handlers = {};

handlers.patch = function (self, data) {
  //> only accept a patch if the seq matches (to prove that we are not updating an old version)
  var currentSeq = self.obj.getSeq();
  if (data.seq !== currentSeq) {
    //> send the client a failure message
    self._send({
      type: 'patch-ack',
      ok: false,
      seq: data.seq,
      expected: currentSeq
    });
    console.error('Ignoring out-of-date patch (seq: %d, expected: %d)', data.seq, currentSeq);
    return;
  }

  //> apply the patch and send acknowledgement to the client
  self.obj.patch(data.data);
  self._send({
    type: 'patch-ack',
    ok: true,
    seq: data.seq
  });
};

handlers.refresh = function (self) {
  self._sendRefresh();
};

function Client (obj, wsClient) {
  this.obj = obj;
  this.wsClient = wsClient;
  this._setup();
}

Client.prototype.isValidMessage = message.isValid;

Client.prototype._send = function (data) {
  this.wsClient.send(message.encode(data));
};

Client.prototype._sendRefresh = function () {
  var data = this.obj.getState();
  data.type = 'refresh';
  this._send(data);
};

Client.prototype._onMessage = function (msg) {
  if (!message.isValid(msg)) { return; }

  var data = message.decode(msg);
  if (!data) { return; }

  var handler = handlers[data.cmd];
  if (!handler) {
    console.error('Unknown cmd', data);
    return;
  }

  handler(this, data);
};

Client.prototype._setup = function () {
  var self = this;

  //> incoming messages that meet the expected format are handled
  this.wsClient.on('message', this._onMessage.bind(this));

  //> patch events are forwarded to the socket client
  var onPatch = function (data, seq) {
    self._send({
      type: 'patch',
      data: data,
      seq: seq
    });
  };

  this.obj.events.on('patch', onPatch);
  this.wsClient.on('close', function () {
    self.obj.events.removeListener('patch', onPatch);
  });

  // send a refresh event to initialize the object
  this._sendRefresh();
};

module.exports = Client;
