import { getDaysInMonth } from "date-fns";

/**
 * Расчёт плановых часов по графику работы
 */
export function calculatePlannedHours(
  workSchedule: string,
  year: number,
  month: number
): number {
  const daysInMonth = getDaysInMonth(new Date(year, month - 1));
  
  switch (workSchedule) {
    case "5/2": {
      // Подсчитываем рабочие дни (пн-пт) в месяце
      let workDays = 0;
      for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month - 1, day);
        const dayOfWeek = date.getDay();
        if (dayOfWeek !== 0 && dayOfWeek !== 6) {
          workDays++;
        }
      }
      return workDays * 8;
    }
    
    case "2/2":
    case "3/3": {
      // Сменный график: половина дней по 12 часов
      return Math.floor(daysInMonth / 2) * 12;
    }
    
    case "6/1": {
      // 6 дней работа, 1 выходной: (6/7) от всех дней по 8 часов
      return Math.floor((daysInMonth * 6) / 7) * 8;
    }
    
    case "вахта (7/0)": {
      // Все дни рабочие по 8 часов
      return daysInMonth * 8;
    }
    
    default:
      // По умолчанию считаем как 5/2
      let workDays = 0;
      for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month - 1, day);
        const dayOfWeek = date.getDay();
        if (dayOfWeek !== 0 && dayOfWeek !== 6) {
          workDays++;
        }
      }
      return workDays * 8;
  }
}

/**
 * Расчёт заработной платы
 */
export function calculateSalary(
  paymentType: string,
  actualHours: number,
  plannedHours: number,
  monthlySalary?: number,
  hourlyRate?: number
): number {
  if (paymentType === "salary" && monthlySalary) {
    // Для окладников: полный оклад если отработано >= нормы,
    // иначе пропорционально
    if (actualHours >= plannedHours) {
      return monthlySalary;
    }
    return Math.round((monthlySalary / plannedHours) * actualHours);
  }
  
  if (paymentType === "hourly" && hourlyRate) {
    // Для почасовиков: ставка × часы
    return Math.round(hourlyRate * actualHours);
  }
  
  return 0;
}

/**
 * Разделение часов на аванс и зарплату
 */
export function splitHoursByPeriod(
  hours: { day: number; hours: number }[]
): { advanceHours: number; salaryHours: number } {
  let advanceHours = 0;
  let salaryHours = 0;
  
  hours.forEach(({ day, hours: dayHours }) => {
    if (day <= 15) {
      advanceHours += dayHours;
    } else {
      salaryHours += dayHours;
    }
  });
  
  return { advanceHours, salaryHours };
}
