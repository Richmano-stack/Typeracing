import GuestDashboard from '@/components/dashboard/GuestDashboard';

export const metadata = {
    title: 'Dashboard | TypeRace',
    description: 'Track your typing speed and progress.',
};

export default function DashboardPage() {
    // Frontend-only: Always show guest dashboard with local storage stats
    return <GuestDashboard />;
}
