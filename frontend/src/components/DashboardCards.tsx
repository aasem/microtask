import { TaskSummary } from '../services/taskService';
import { CheckCircle, Clock, AlertCircle, PlayCircle } from 'lucide-react';

interface DashboardCardsProps {
  summary: TaskSummary;
}

const DashboardCards = ({ summary }: DashboardCardsProps) => {
  const cards = [
    {
      title: 'Total Tasks',
      value: summary.total,
      icon: <Clock className="w-8 h-8 text-primary" />,
      bgColor: 'bg-blue-50',
    },
    {
      title: 'In Progress',
      value: summary.in_progress,
      icon: <PlayCircle className="w-8 h-8 text-blue-500" />,
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Completed',
      value: summary.completed,
      icon: <CheckCircle className="w-8 h-8 text-success" />,
      bgColor: 'bg-green-50',
    },
    {
      title: 'Overdue',
      value: summary.overdue,
      icon: <AlertCircle className="w-8 h-8 text-danger" />,
      bgColor: 'bg-red-50',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
      {cards.map((card, index) => (
        <div key={index} className={`card ${card.bgColor} p-6`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-2">{card.title}</p>
              <p className="text-3xl font-bold text-gray-900">{card.value}</p>
            </div>
            <div>{card.icon}</div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default DashboardCards;
