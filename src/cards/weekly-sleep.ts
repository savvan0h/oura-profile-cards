import * as fs from 'fs';

import type { Threshold } from '@/types/chart';
import type { OuraSleepResponse } from '@/types/oura';

import {
  getApiToken,
  getIsoDate,
  generateLineChart,
  injectIntoTemplate,
  writeSvgOutput,
  fetchOuraData,
} from '@/utils/common';

// Fetch daily_sleep data for the past 7 days
async function fetchSleep(token: string): Promise<OuraSleepResponse | null> {
  const startDate = getIsoDate(-7);
  const endDate = getIsoDate(0);
  const endpoint = `https://api.ouraring.com/v2/usercollection/daily_sleep?start_date=${startDate}&end_date=${endDate}`;
  return await fetchOuraData<OuraSleepResponse>(endpoint, token);
}

// Define sleep threshold values
function getSleepThresholds(): Threshold[] {
  return [
    { value: 60, label: 'Fair' },
    { value: 70, label: 'Good' },
    { value: 85, label: 'Optimal' },
  ];
}

export async function generate(): Promise<string | undefined> {
  const token = getApiToken();
  const sleepData = await fetchSleep(token);

  if (!sleepData || !sleepData.data) {
    console.error('No sleep data found. Aborting sleep card generation.');
    return;
  }

  // Convert API response to array of { day, score }
  const points = sleepData.data.map((item) => ({
    day: item.day || 'N/A',
    score: typeof item.score === 'number' ? item.score : 0,
  }));

  const { pathD, circles, xTicks, yTicks, dateRange, extraLines } =
    generateLineChart(points, getSleepThresholds());

  // Read sleep SVG template
  let template = '';
  try {
    template = fs.readFileSync(
      require.resolve('../templates/weekly-sleep.svg'),
      'utf8'
    );
  } catch (err) {
    console.error('Error reading weekly sleep SVG template:', err);
    return;
  }

  // Inject generated content into template
  const finalSvg = injectIntoTemplate(template, {
    PATH_DATA: pathD,
    CIRCLES: circles,
    X_TICKS: xTicks,
    Y_TICKS: yTicks,
    DATE_RANGE: dateRange,
    EXTRA_LINES: extraLines,
  });

  return writeSvgOutput('weekly-sleep-card.svg', finalSvg);
}
