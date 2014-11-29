var Changes = require('./changes');

function Obj (applyPatchFunc, initialState, initialSeq) {
  this.applyPatch = applyPatchFunc || require('./default-apply-patch');

  this._state = initialState || {};
  this._changes = new Changes({
    initialSeq: initialSeq || 0,
    maxTail: 10
  });

  this.events = new (require('events').EventEmitter)();
}

/*

  Add a patch to the object.

*/
Obj.prototype.patch = function (data) {
  var seq = this._changes.push(data);
  this.applyPatch(this._state, data);
  this.events.emit('patch', data, seq);
  return seq;
};

/*

  Get the current state.

*/
Obj.prototype.getState = function () {
  // make a read-only copy
  var state = JSON.parse(JSON.stringify(this._state));

  return {
    state: state,
    seq: this._changes.getLastSeq()
  };
};

/*

  Get the current sequence ID.

*/
Obj.prototype.getSeq = function () {
  return this._changes.getLastSeq();
};

/*

  Get any changes since a certain point in time.

*/
Obj.prototype.getChangesSince = function (seq) {
  return this._changes.getSince(seq);
};

module.exports = Obj;
