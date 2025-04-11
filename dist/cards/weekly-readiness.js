"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.generate = generate;
const child_process_1 = require("child_process");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const util = __importStar(require("util"));
const core = __importStar(require("@actions/core"));
const exec = util.promisify(child_process_1.exec);
const token = core.getInput('OURA_API_TOKEN');
if (!token) {
    console.error('Error: OURA_API_TOKEN environment variable is not set.');
    process.exit(1);
}
// Return date string in YYYY-MM-DD offset by given number of days
function getIsoDate(offsetDays = 0) {
    const date = new Date();
    date.setDate(date.getDate() + offsetDays);
    return date.toISOString().split('T')[0];
}
// Fetch daily_readiness data for the past 7 days
async function fetchReadiness() {
    const startDate = getIsoDate(-7);
    const endDate = getIsoDate(0);
    const endpoint = `https://api.ouraring.com/v2/usercollection/daily_readiness?start_date=${startDate}&end_date=${endDate}`;
    console.log('Fetching readiness from:', endpoint);
    try {
        const response = await fetch(endpoint, {
            headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) {
            throw new Error(`HTTP error: ${response.status}`);
        }
        return (await response.json());
    }
    catch (error) {
        console.error('Error fetching daily_readiness:', error);
        return null;
    }
}
// Generate line chart details based on data and thresholds
function generateLineChart(dataPoints) {
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
    // Threshold definitions
    const thresholds = [
        { value: 60, label: 'Fair' },
        { value: 70, label: 'Good' },
        { value: 85, label: 'Optimal' },
    ];
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
    function scaleX(i) {
        return chartXStart + i * xStep;
    }
    function scaleY(score) {
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
function injectIntoTemplate(template, placeholders) {
    let output = template;
    for (const [key, value] of Object.entries(placeholders)) {
        const token = `{{${key}}}`;
        output = output.replaceAll(token, value);
    }
    return output;
}
async function generate() {
    const readinessData = await fetchReadiness();
    if (!readinessData || !readinessData.data) {
        console.error('No readiness data found. Aborting readiness card generation.');
        return;
    }
    // Convert API response to array of { day, score }
    const points = readinessData.data.map((item) => ({
        day: item.day || 'N/A',
        score: typeof item.score === 'number' ? item.score : 0,
    }));
    const { pathD, circles, xTicks, yTicks, dateRange, extraLines } = generateLineChart(points);
    // Read readiness SVG template
    const templatePath = path.join(__dirname, '..', 'templates', 'weekly-readiness.svg');
    let template = '';
    try {
        template = fs.readFileSync(templatePath, 'utf8');
    }
    catch (err) {
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
    // Write final SVG output to project root
    const outputDir = path.join(process.cwd(), 'oura-profile-card-output');
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }
    const outputPath = path.join(outputDir, 'weekly-readiness-card.svg');
    fs.writeFileSync(outputPath, finalSvg, 'utf8');
    console.log('Wrote weekly readiness card to', outputPath);
    // Commit generated file
    const commitFile = async () => {
        await exec('git config --global user.email "oura-profile-cards-bot@example.com"');
        await exec('git config --global user.name "oura-profile-cards[bot]"');
        await exec(`git add ${outputPath}`);
        try {
            await exec('git commit -m "Generate Oura profile cards"');
        }
        catch {
            console.log('Nothing to commit');
        }
        await exec('git push');
    };
    await commitFile();
}
//# sourceMappingURL=weekly-readiness.js.map