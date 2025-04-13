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
const fs = __importStar(require("fs"));
const common_1 = require("@/utils/common");
// Fetch daily_readiness data for the past 7 days
async function fetchReadiness(token) {
    const startDate = (0, common_1.getIsoDate)(-6);
    const endDate = (0, common_1.getIsoDate)(0);
    const endpoint = `https://api.ouraring.com/v2/usercollection/daily_readiness?start_date=${startDate}&end_date=${endDate}`;
    return await (0, common_1.fetchOuraData)(endpoint, token);
}
// Define readiness threshold values
function getReadinessThresholds() {
    return [
        { value: 60, label: 'Fair' },
        { value: 70, label: 'Good' },
        { value: 85, label: 'Optimal' },
    ];
}
async function generate() {
    const token = (0, common_1.getApiToken)();
    const readinessData = await fetchReadiness(token);
    if (!readinessData || !readinessData.data) {
        console.error('No readiness data found. Aborting readiness card generation.');
        return;
    }
    // Convert API response to array of { day, score }
    const points = readinessData.data.map((item) => ({
        day: item.day || 'N/A',
        score: typeof item.score === 'number' ? item.score : 0,
    }));
    const { pathD, circles, xTicks, yTicks, dateRange, extraLines } = (0, common_1.generateLineChart)(points, getReadinessThresholds());
    // Read readiness SVG template
    let template = '';
    try {
        template = fs.readFileSync(require.resolve('../templates/weekly-readiness.svg'), 'utf8');
    }
    catch (err) {
        console.error('Error reading weekly readiness SVG template:', err);
        return;
    }
    // Inject generated content into template
    const finalSvg = (0, common_1.injectIntoTemplate)(template, {
        PATH_DATA: pathD,
        CIRCLES: circles,
        X_TICKS: xTicks,
        Y_TICKS: yTicks,
        DATE_RANGE: dateRange,
        EXTRA_LINES: extraLines,
    });
    return (0, common_1.writeSvgOutput)('weekly-readiness-card.svg', finalSvg);
}
//# sourceMappingURL=weekly-readiness.js.map