/*

  Message encoding / decoding

*/

module.exports.decode = function (msg) {
  try {
    return JSON.parse(msg);
  } catch (e) {
    console.error('Invalid format', msg);
  }
};

module.exports.encode = function (data) {
  return JSON.stringify(data);
};
