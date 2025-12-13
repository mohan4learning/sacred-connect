import { cn } from "@/lib/utils";

type StatusType = 
  | 'pending' | 'confirmed' | 'completed' | 'cancelled'
  | 'requested' | 'accepted' | 'open' | 'matched' | 'closed';

interface StatusBadgeProps {
  status: StatusType | string;
  className?: string;
}

const statusStyles: Record<StatusType, string> = {
  pending: 'bg-amber-100 text-amber-800 border-amber-200',
  confirmed: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  completed: 'bg-sky-100 text-sky-800 border-sky-200',
  cancelled: 'bg-red-100 text-red-800 border-red-200',
  requested: 'bg-violet-100 text-violet-800 border-violet-200',
  accepted: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  open: 'bg-blue-100 text-blue-800 border-blue-200',
  matched: 'bg-purple-100 text-purple-800 border-purple-200',
  closed: 'bg-gray-100 text-gray-800 border-gray-200',
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border capitalize",
        statusStyles[status] || statusStyles.pending,
        className
      )}
    >
      {status}
    </span>
  );
}
