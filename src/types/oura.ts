export interface DailyReadiness {
  day: string;
  score: number;
}

export interface OuraReadinessResponse {
  data: Array<{
    day?: string;
    score?: number;
  }>;
}
