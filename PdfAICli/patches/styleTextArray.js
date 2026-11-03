/** Metro passes format arrays to util.styleText; Node accepts one format. */
const util = require('util');
const orig = util.styleText.bind(util);
util.styleText = (format, text) => {
  if (Array.isArray(format)) {
    return format.reduceRight((acc, f) => orig(f, acc), text);
  }
  return orig(format, text);
};
