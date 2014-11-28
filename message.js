/*

  Message encoding / decoding

*/

var MSG_PREFIX = 'srp:';

module.exports.isValid = function (msg) {
  return msg.substr(0, MSG_PREFIX.length) === MSG_PREFIX;
};

module.exports.decode = function (msg) {
  var raw = msg.substr(MSG_PREFIX.length);
  try {
    return JSON.parse(raw);
  } catch (e) {
    console.error('Invalid format', msg);
    return;
  }
};

module.exports.encode = function (data) {
  return MSG_PREFIX + JSON.stringify(data);
};
