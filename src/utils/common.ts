import { exec as execCb } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as util from 'util';

import * as core from '@actions/core';

import type { ChartDetails, Threshold } from '@/types/chart';

export const exec = util.promisify(execCb);

// Get API token from environment
export function getApiToken(): string {
  const token = core.getInput('OURA_API_TOKEN');
  if (!token) {
    console.error('Error: OURA_API_TOKEN environment variable is not set.');
    process.exit(1);
  }
  return token;
}

// Return date string in YYYY-MM-DD offset by given number of days
export function getIsoDate(offsetDays = 0): string {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  return date.toISOString().split('T')[0];
}

// Generate line chart details based on data and thresholds
export function generateLineChart(
  dataPoints: Array<{ day: string; score: number }>,
  thresholds: Threshold[]
): ChartDetails {
  if (!dataPoints.length) {
    return {
      pathD: '',
      circles: '',
      xTicks: '',
      yTicks: '',
      dateRange: 'No data',
      extraLines: '',
    };
  }

  // Sort data by day ascending
  dataPoints.sort((a, b) => (a.day < b.day ? -1 : 1));
  const firstDay = dataPoints[0].day;
  const lastDay = dataPoints[dataPoints.length - 1].day;
  const dateRange = `${firstDay} → ${lastDay}`;

  // Get scores
  const allScores = dataPoints.map((d) => d.score);
  const minScore = Math.min(...allScores);
  const maxScore = Math.max(...allScores);

  // Use dynamic range from data and thresholds with padding
  const minPossible = Math.min(minScore, ...thresholds.map((t) => t.value)) - 5;
  const maxPossible = Math.max(maxScore, ...thresholds.map((t) => t.value)) + 5;

  // Layout for chart
  const chartXStart = 80;
  const chartXEnd = 620;
  const chartWidth = chartXEnd - chartXStart;
  const chartHeight = 140;
  const offsetY = 90;
  const N = dataPoints.length;
  const xStep = N > 1 ? chartWidth / (N - 1) : 0;

  // Scale functions
  function scaleX(i: number): number {
    return chartXStart + i * xStep;
  }
  function scaleY(score: number): number {
    const t = (score - minPossible) / (maxPossible - minPossible);
    return offsetY + chartHeight - t * chartHeight;
  }

  // Build SVG path and data point circles
  let pathD = '';
  let circles = '';
  dataPoints.forEach((pt, i) => {
    const x = scaleX(i);
    const y = scaleY(pt.score);
    pathD += i === 0 ? `M ${x},${y}` : ` L ${x},${y}`;
    circles += `<circle cx="${x}" cy="${y}" r="4" fill="#ffffff" />\n`;
  });

  // Build X-axis tick labels (using day as "MM-DD")
  let xTicks = '';
  dataPoints.forEach((pt, i) => {
    const x = scaleX(i);
    const label = pt.day.slice(5);
    xTicks += `
      <text x="${x}" y="${230 + 15}" text-anchor="middle"
            font-size="12" fill="#ffffff" font-family="Arial, sans-serif">
        ${label}
      </text>
    `;
  });

  // Build Y-axis tick labels (5 ticks)
  let yTicks = '';
  const tickCount = 5;
  for (let i = 0; i <= tickCount; i++) {
    const fraction = i / tickCount;
    const val = minPossible + fraction * (maxPossible - minPossible);
    const y = offsetY + chartHeight - fraction * chartHeight;
    yTicks += `
      <text x="${chartXStart - 10}" y="${y + 4}" text-anchor="end"
            font-size="12" fill="#ffffff" font-family="Arial, sans-serif">
        ${Math.round(val)}
      </text>
    `;
  }

  // Dotted threshold lines
  // Text labels are positioned in reserved right margin
  let extraLines = '';
  thresholds.forEach((th) => {
    if (th.value >= minPossible && th.value <= maxPossible) {
      const y = scaleY(th.value);
      extraLines += `
        <line x1="${chartXStart}" y1="${y}" x2="${chartXEnd}" y2="${y}"
              stroke="#bbbbbb" stroke-width="1" stroke-dasharray="3,3" />
        <text x="${chartXEnd + 10}" y="${y + 4}" text-anchor="start"
              font-size="12" fill="#bbbbbb" font-family="Arial, sans-serif">
          ${th.value} (${th.label})
        </text>
      `;
    }
  });

  return {
    pathD,
    circles,
    xTicks,
    yTicks,
    dateRange,
    extraLines,
  };
}

// Inject placeholders into SVG template
export function injectIntoTemplate(
  template: string,
  placeholders: Record<string, string>
): string {
  let output = template;
  for (const [key, value] of Object.entries(placeholders)) {
    const token = `{{${key}}}`;
    output = output.replaceAll(token, value);
  }
  return output;
}

// Write SVG file and return the file path
export function writeSvgOutput(fileName: string, svgContent: string): string {
  const outputDir = path.join(process.cwd(), 'oura-profile-card-output');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  const outputPath = path.join(outputDir, fileName);
  fs.writeFileSync(outputPath, svgContent, 'utf8');
  console.log(`Wrote ${fileName} to ${outputPath}`);
  return outputPath;
}

// Commit generated files
export async function commitGeneratedFiles(filePaths: string[]): Promise<void> {
  const skipCommit = core.getInput('SKIP_GIT_COMMIT') === 'true';

  if (skipCommit) {
    console.log(
      'Skipping git commit (development mode). Files generated but not committed.'
    );
    return;
  }

  await exec(
    'git config --global user.email "oura-profile-cards-bot@example.com"'
  );
  await exec('git config --global user.name "oura-profile-cards[bot]"');

  // Add all files to git
  for (const filePath of filePaths) {
    await exec(`git add ${filePath}`);
  }

  try {
    await exec('git commit -m "Generate Oura profile cards"');
  } catch {
    console.log('Nothing to commit');
  }
  await exec('git push');
}

// Generic fetch function for Oura API data
export async function fetchOuraData<T>(
  endpoint: string,
  token: string
): Promise<T | null> {
  console.log('Fetching data from:', endpoint);
  try {
    const response = await fetch(endpoint, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`);
    }
    return (await response.json()) as T;
  } catch (error) {
    console.error(`Error fetching data from ${endpoint}:`, error);
    return null;
  }
}
