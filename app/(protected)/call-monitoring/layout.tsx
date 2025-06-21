import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Call Monitoring - OOAK CRM',
  description: 'Real-time call monitoring and analytics dashboard',
};

export default function CallMonitoringLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      {children}
    </div>
  );
} 