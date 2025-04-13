import { exec as execCb } from 'child_process';
import type { ChartDetails, Threshold } from '@/types/chart';
export declare const exec: typeof execCb.__promisify__;
export declare function getApiToken(): string;
export declare function getIsoDate(offsetDays?: number): string;
export declare function generateLineChart(dataPoints: Array<{
    day: string;
    score: number;
}>, thresholds: Threshold[]): ChartDetails;
export declare function injectIntoTemplate(template: string, placeholders: Record<string, string>): string;
export declare function writeSvgOutput(fileName: string, svgContent: string): string;
export declare function commitGeneratedFiles(filePaths: string[]): Promise<void>;
export declare function fetchOuraData<T>(endpoint: string, token: string): Promise<T | null>;
