jQuery.fn.log = function (msg) {
  console.log("%s: %o", msg, this);
  return this;
};