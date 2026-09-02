import TrendDashboard from '../../../components/pro/TrendDashboard';
import { connection } from 'next/server';
import { getTrendDashboard } from './actions';

function currentMonth() {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Tokyo', year: 'numeric', month: '2-digit',
  });
  const parts = Object.fromEntries(formatter.formatToParts(new Date()).map((part) => [part.type, part.value]));
  return `${parts.year}-${parts.month}`;
}

function monthBounds(month: string) {
  const [year, value] = month.split('-').map(Number);
  const last = new Date(Date.UTC(year, value, 0)).getUTCDate();
  return { from: `${month}-01`, to: `${month}-${String(last).padStart(2, '0')}` };
}

export default async function ProDashboardPage() {
  await connection();
  const month = currentMonth();
  const result = await getTrendDashboard(monthBounds(month));
  return <TrendDashboard initialResult={result} initialMonth={month} />;
}
