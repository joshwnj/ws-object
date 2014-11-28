function Changes (opts) {
  if (!opts) { opts = {}; }

  this._seq = opts.initialSeq || 0;
  this._items = [];
  this._maxTail = opts.maxTail || 20;
}

/*

  Push a change onto the feed

*/
Changes.prototype.push = function (item) {
  this._seq += 1;
  this._items.push(item);

  // drop the tail item when it gets too long
  if (this._items.length > this._maxTail) {
    this._items.shift();
  }

  return this._seq;
};

/*

  Get the sequence number of the last change

*/
Changes.prototype.getLastSeq = function () {
  return this._seq;
};

/*

  Get a list of changes since the given sequence number

*/
Changes.prototype.getSince = function (seq) {
  //> if the history we're asking for hasn't happened yet, throw an error
  if (seq > this._seq) {
    throw new Error('history too far forward');
  }

  var size = this._seq - seq;

  //> if the history we're asking for has been erased, throw an error
  if (size > this._items.length) {
    throw new Error('history too far behind');
  }

  return this._items.slice(this._items.length - size);
};

module.exports = Changes;
