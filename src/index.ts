import * as weeklyReadiness from './cards/weekly-readiness';
import * as weeklySleep from './cards/weekly-sleep';
import { commitGeneratedFiles } from './utils/common';

(async function main() {
  const generatedFiles = (
    await Promise.all([weeklyReadiness.generate(), weeklySleep.generate()])
  ).filter(Boolean) as string[];

  if (generatedFiles.length > 0) {
    await commitGeneratedFiles(generatedFiles);
  }

  console.log('All cards have been updated.');
})();
