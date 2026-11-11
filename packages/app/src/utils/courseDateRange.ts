/**
 * @file courseDateRange.ts
 * @description 코스의 실제 출발일과 기간을 목록·삭제 확인용 날짜 범위로 표시합니다.
 */
import type { CourseSummary } from '@yeolo/common';

/** Returns a display range without fabricating dates when the API value is incomplete. */
export function formatCourseDateRange(
  course: Pick<CourseSummary, 'startDate' | 'totalDays'>,
): string {
  const start = course.startDate?.slice(0, 10) ?? '';
  const date = new Date(`${start}T12:00:00Z`);
  if (
    !start ||
    !Number.isFinite(date.getTime()) ||
    date.toISOString().slice(0, 10) !== start
  )
    return '';
  const format = (value: string) => value.slice(2).replace(/-/g, '.');
  if (!Number.isInteger(course.totalDays) || course.totalDays < 1)
    return format(start);
  date.setUTCDate(date.getUTCDate() + course.totalDays - 1);
  return `${format(start)} - ${format(date.toISOString().slice(0, 10))}`;
}
