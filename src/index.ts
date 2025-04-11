import * as weeklyReadiness from './cards/weekly-readiness';

(async function main() {
  await weeklyReadiness.generate();
  console.log('All cards have been updated.');
})();
