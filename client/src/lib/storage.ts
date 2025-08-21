import { Employee, TimeEntry, Report, Setting } from '@shared/schema';

export class LocalStorageManager {
  private static instance: LocalStorageManager;

  static getInstance(): LocalStorageManager {
    if (!LocalStorageManager.instance) {
      LocalStorageManager.instance = new LocalStorageManager();
    }
    return LocalStorageManager.instance;
  }

  // Employees
  saveEmployees(employees: Employee[]): void {
    localStorage.setItem('employees', JSON.stringify(employees));
  }

  getEmployees(): Employee[] {
    const data = localStorage.getItem('employees');
    return data ? JSON.parse(data) : [];
  }

  // Time Entries
  saveTimeEntries(entries: TimeEntry[]): void {
    localStorage.setItem('timeEntries', JSON.stringify(entries));
  }

  getTimeEntries(): TimeEntry[] {
    const data = localStorage.getItem('timeEntries');
    return data ? JSON.parse(data) : [];
  }

  // Reports
  saveReports(reports: Report[]): void {
    localStorage.setItem('reports', JSON.stringify(reports));
  }

  getReports(): Report[] {
    const data = localStorage.getItem('reports');
    return data ? JSON.parse(data) : [];
  }

  // Settings
  saveSettings(settings: Setting[]): void {
    localStorage.setItem('settings', JSON.stringify(settings));
  }

  getSettings(): Setting[] {
    const data = localStorage.getItem('settings');
    return data ? JSON.parse(data) : [];
  }

  // Sync queue for offline functionality
  addToSyncQueue(action: string, data: any): void {
    const queue = this.getSyncQueue();
    queue.push({
      id: Date.now().toString(),
      action,
      data,
      timestamp: new Date().toISOString(),
    });
    localStorage.setItem('syncQueue', JSON.stringify(queue));
  }

  getSyncQueue(): any[] {
    const data = localStorage.getItem('syncQueue');
    return data ? JSON.parse(data) : [];
  }

  clearSyncQueue(): void {
    localStorage.removeItem('syncQueue');
  }

  // Clear all data
  clearAll(): void {
    const keys = ['employees', 'timeEntries', 'reports', 'settings', 'syncQueue'];
    keys.forEach(key => localStorage.removeItem(key));
  }
}

export const localStorageManager = LocalStorageManager.getInstance();
