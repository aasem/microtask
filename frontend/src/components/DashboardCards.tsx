import { TaskSummary } from "../services/taskService";
import { CheckCircle, Clock, AlertCircle, PlayCircle } from "lucide-react";

interface DashboardCardsProps {
  summary: TaskSummary;
}

const DashboardCards = ({ summary }: DashboardCardsProps) => {
  const cards = [
    {
      title: "Total Tasks",
      value: summary.total ?? 0,
      icon: <Clock className="w-8 h-8 text-indigo-600" />,
      bgColor: "bg-indigo-100",
    },
    {
      title: "In Progress",
      value: summary.in_progress ?? 0,
      icon: <PlayCircle className="w-8 h-8 text-blue-700" />,
      bgColor: "bg-blue-50",
    },
    {
      title: "Completed",
      value: summary.completed ?? 0,
      icon: <CheckCircle className="w-8 h-8 text-green-700" />,
      bgColor: "bg-green-50",
    },
    {
      title: "Overdue",
      value: summary.overdue ?? 0,
      icon: <AlertCircle className="w-8 h-8 text-red-700" />,
      bgColor: "bg-red-50",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-4">
      {cards.map((card, index) => (
        <div key={index} className={`card ${card.bgColor} p-4`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <p className="text-sm font-medium text-gray-600">{card.title}</p>
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
