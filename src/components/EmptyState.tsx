import React from 'react';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  className = '',
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center p-8 text-center bg-white rounded-2xl border border-slate-100 shadow-subtle ${className}`}
    >
      <div className="w-14 h-14 rounded-2xl bg-[#DDF5E9]/60 flex items-center justify-center text-[#167D70] mb-4">
        <Icon className="w-7 h-7" />
      </div>
      <h3 className="text-base font-semibold text-[#123B35] mb-1.5">{title}</h3>
      <p className="text-sm text-slate-500 max-w-sm mb-5 leading-relaxed">{description}</p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="px-4 py-2 text-sm font-medium text-white bg-[#167D70] hover:bg-[#12675C] rounded-xl shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-[#167D70]/40"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};
