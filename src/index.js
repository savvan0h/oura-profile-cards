const readiness = require('./cards/readiness');

(async function main() {
  await readiness.generate();

  console.log('All cards have been updated.');
})();
