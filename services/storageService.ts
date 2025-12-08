import { HealthReport } from '../types';

const STORAGE_KEY = 'vital_sync_history_v1';

export const saveReportToHistory = (report: HealthReport) => {
  try {
    const history = getHistory();
    // Add timestamp if not present
    const reportWithDate = {
        ...report,
        date: report.date || new Date().toISOString()
    };
    
    // Keep only the last 10 reports to avoid hitting storage limits
    const updatedHistory = [reportWithDate, ...history].slice(0, 10);
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedHistory));
  } catch (e) {
    console.error("Failed to save history", e);
  }
};

export const getHistory = (): HealthReport[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (e) {
    console.error("Failed to load history", e);
    return [];
  }
};

export const getLatestReport = (): HealthReport | null => {
  const history = getHistory();
  return history.length > 0 ? history[0] : null;
};

export const clearHistory = () => {
  localStorage.removeItem(STORAGE_KEY);
};