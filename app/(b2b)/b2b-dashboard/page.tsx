import { permanentRedirect } from 'next/navigation';

export default function LegacyB2bDashboardPage() {
  permanentRedirect('/pro/dashboard');
}
