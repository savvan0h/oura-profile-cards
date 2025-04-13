import * as fs from 'fs';

import type { Threshold } from '@/types/chart';
import type { OuraReadinessResponse } from '@/types/oura';

import {
  getApiToken,
  getIsoDate,
  generateLineChart,
  injectIntoTemplate,
  writeSvgOutput,
  fetchOuraData,
} from '@/utils/common';

// Fetch daily_readiness data for the past 7 days
async function fetchReadiness(
  token: string
): Promise<OuraReadinessResponse | null> {
  const startDate = getIsoDate(-6);
  const endDate = getIsoDate(0);
  const endpoint = `https://api.ouraring.com/v2/usercollection/daily_readiness?start_date=${startDate}&end_date=${endDate}`;
  return await fetchOuraData<OuraReadinessResponse>(endpoint, token);
}

// Define readiness threshold values
function getReadinessThresholds(): Threshold[] {
  return [
    { value: 60, label: 'Fair' },
    { value: 70, label: 'Good' },
    { value: 85, label: 'Optimal' },
  ];
}

export async function generate(): Promise<string | undefined> {
  const token = getApiToken();
  const readinessData = await fetchReadiness(token);

  if (!readinessData || !readinessData.data) {
    console.error(
      'No readiness data found. Aborting readiness card generation.'
    );
    return;
  }

  // Convert API response to array of { day, score }
  const points = readinessData.data.map((item) => ({
    day: item.day || 'N/A',
    score: typeof item.score === 'number' ? item.score : 0,
  }));

  const { pathD, circles, xTicks, yTicks, dateRange, extraLines } =
    generateLineChart(points, getReadinessThresholds());

  // Read readiness SVG template
  let template = '';
  try {
    template = fs.readFileSync(
      require.resolve('../templates/weekly-readiness.svg'),
      'utf8'
    );
  } catch (err) {
    console.error('Error reading weekly readiness SVG template:', err);
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

  return writeSvgOutput('weekly-readiness-card.svg', finalSvg);
}
