
export interface TaskItem {
  text: string;
  author: string;
  lastModified?: number;
}

export interface DaySchedule {
  day: string;
  am?: TaskItem[];
  pm?: TaskItem[];
  isHoliday?: boolean;
  holidayName?: string;
  desc?: string;
}

export interface WeekSchedule {
  week: number;
  title: string;
  dateRange: string;
  days: DaySchedule[];
}

export interface Comment {
  id: string;
  text: string;
  author: string;
  timestamp: number;
}

export interface ProgramDetail {
  checkpoints: string[];
  faq?: string[];
  emergency?: string[];
  description?: string;
}

export type ProgramDataMap = Record<string, ProgramDetail>;

export enum ModalTab {
  CHECK = 'check',
  FAQ = 'faq',
  EMERGENCY = 'emergency',
  AI_TUTOR = 'ai_tutor'
}
