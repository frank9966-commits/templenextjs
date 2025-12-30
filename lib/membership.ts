export type DateOnly = `${number}-${number}-${number}`;

const pad2 = (n: number) => String(n).padStart(2, "0");

export function formatDateOnly(d: Date): DateOnly {
  const yyyy = d.getUTCFullYear();
  const mm = pad2(d.getUTCMonth() + 1);
  const dd = pad2(d.getUTCDate());
  return `${yyyy}-${mm}-${dd}` as DateOnly;
}

export function parseDateOnly(dateOnly: string): Date {
  const [y, m, d] = dateOnly.split("-").map((v) => Number(v));
  return new Date(Date.UTC(y, m - 1, d));
}

export function addDays(dateOnly: string, days: number): DateOnly {
  const d = parseDateOnly(dateOnly);
  d.setUTCDate(d.getUTCDate() + days);
  return formatDateOnly(d);
}

export function addMonths(dateOnly: string, months: number): DateOnly {
  const d = parseDateOnly(dateOnly);
  const y = d.getUTCFullYear();
  const m = d.getUTCMonth();
  const day = d.getUTCDate();

  const target = new Date(Date.UTC(y, m + months, 1));
  const last = endOfMonth(formatDateOnly(target));
  const lastDay = parseDateOnly(last).getUTCDate();
  const clampedDay = Math.min(day, lastDay);

  target.setUTCDate(clampedDay);
  return formatDateOnly(target);
}

export function startOfMonth(dateOnly: string): DateOnly {
  const d = parseDateOnly(dateOnly);
  return formatDateOnly(new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1)));
}

export function endOfMonth(dateOnly: string): DateOnly {
  const d = parseDateOnly(dateOnly);
  const end = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0));
  return formatDateOnly(end);
}

export function computeNextRenewal(params: {
  expiresOn: DateOnly;
  nextDueOn: DateOnly;
}): {
  periodStart: DateOnly;
  periodEnd: DateOnly;
  newExpiresOn: DateOnly;
  newNextDueOn: DateOnly;
} {
  // 約定：next_due_on = expires_on + 1 day（通常是次月 1 號）
  const periodStart = params.nextDueOn;
  const periodEnd = endOfMonth(periodStart);
  const newExpiresOn = periodEnd;
  const newNextDueOn = addDays(newExpiresOn, 1);

  return { periodStart, periodEnd, newExpiresOn, newNextDueOn };
}

export function computeNextRenewalWithCycle(params: {
  expiresOn: DateOnly;
  nextDueOn: DateOnly;
  cycleMonths: number;
}): {
  periodStart: DateOnly;
  periodEnd: DateOnly;
  newExpiresOn: DateOnly;
  newNextDueOn: DateOnly;
} {
  const cycleMonths = Math.max(1, Math.floor(params.cycleMonths));

  const periodStart = params.nextDueOn;
  const endAnchor = addMonths(periodStart, cycleMonths - 1);
  const periodEnd = endOfMonth(endAnchor);
  const newExpiresOn = periodEnd;
  const newNextDueOn = addDays(newExpiresOn, 1);

  return { periodStart, periodEnd, newExpiresOn, newNextDueOn };
}

export function isReminderNeeded(params: {
  nextDueOn: DateOnly;
  now?: Date;
}): boolean {
  const now = params.now ?? new Date();
  const today = formatDateOnly(now);
  const remindFrom = addMonths(params.nextDueOn, 1);
  // today >= remindFrom
  return parseDateOnly(today).getTime() >= parseDateOnly(remindFrom).getTime();
}
