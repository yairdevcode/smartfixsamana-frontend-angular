export interface DailyEarnings {
  date: string;
  ownRepairsTotal: number;
  externalRepairsMyShare: number;
  total: number;
  ownRepairsCount: number;
  externalRepairsCount: number;
}

export interface RangeEarnings {
  startDate: string;
  endDate: string;
  ownRepairsTotal: number;
  externalRepairsMyShare: number;
  total: number;
  ownRepairsCount: number;
  externalRepairsCount: number;
}

export interface EarningsSummary {
  today: DailyEarnings;
  last30Days: RangeEarnings;
  currentMonth: RangeEarnings;
}
