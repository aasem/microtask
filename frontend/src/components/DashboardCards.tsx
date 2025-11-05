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
      icon: <Clock className="w-8 h-8 text-indigo-600" />,
      bgColor: 'bg-indigo-100',
    },
    {
      title: 'In Progress',
      value: summary.in_progress,
      icon: <PlayCircle className="w-8 h-8 text-amber-600" />,
      bgColor: 'bg-amber-100',
    },
    {
      title: 'Completed',
      value: summary.completed,
      icon: <CheckCircle className="w-8 h-8 text-emerald-600" />,
      bgColor: 'bg-emerald-100',
    },
    {
      title: 'Overdue',
      value: summary.overdue,
      icon: <AlertCircle className="w-8 h-8 text-rose-600" />,
      bgColor: 'bg-rose-100',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
      {cards.map((card, index) => (
        <div key={index} className={`card ${card.bgColor} p-6`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-2">{card.title}</p>
              <p className="text-4xl font-bold text-gray-900">{card.value}</p>
            </div>
            <div>{card.icon}</div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default DashboardCards;
