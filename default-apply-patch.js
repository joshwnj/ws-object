module.exports = function applyPatch (state, p) {
  switch (p.type) {
  case 'set':
    state[p.key] = p.val;
    break;

  case 'del':
    delete state[p.key];
    break;

  default:
    throw new Error('Unknown patch type');
  }
};
