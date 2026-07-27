import React from 'react';
import { BookOpen, CheckCircle2, Clock } from 'lucide-react';
import { cn } from '../utils';

export interface Assignment {
  id: string;
  courseId?: string;
  courseName?: string;
  title: string;
  description?: string;
  dueDate?: string;
  alternateLink?: string;
  materials?: unknown[];
  status: 'PENDING' | 'SUBMITTED' | 'GRADED';
  points?: number;
}

interface ClassroomCardProps {
  assignment: Assignment;
  className?: string;
  onView?: (id: string) => void;
  onHelp?: (id: string) => void;
}

export function ClassroomCard({ assignment, className, onView, onHelp }: ClassroomCardProps) {
  const isSubmitted = assignment.status !== 'PENDING';
  
  return (
    <div className={cn("bg-white dark:bg-[#0a0a0a] border border-black/10 dark:border-white/10 p-4 rounded-xl transition-all hover:border-[var(--theme-color)]/30 group", className)}>
      <div className="flex items-start gap-3">
        <div className={cn(
          "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
          isSubmitted ? "bg-green-500/10 text-green-500" : "bg-[var(--theme-color)]/10 text-[var(--theme-color)]"
        )}>
          {isSubmitted ? <CheckCircle2 size={20} /> : <BookOpen size={20} />}
        </div>
        
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-1 truncate">{assignment.title}</h4>
          {assignment.courseName && (
            <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--theme-color)] mb-2 truncate">
              {assignment.courseName}
            </div>
          )}
          
          <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 mb-3">
            {assignment.dueDate ? (
              <div className="flex items-center gap-1">
                <Clock size={12} />
                <span>Due {new Date(assignment.dueDate).toLocaleDateString()}</span>
              </div>
            ) : (
              <span>No due date</span>
            )}
            {assignment.points !== undefined && (
              <div className="font-bold text-[var(--theme-color)]">{assignment.points} XP</div>
            )}
          </div>
          
          <div className="flex gap-2">
            <button 
              onClick={() => onView?.(assignment.id)}
              className={cn(
                "px-3 py-1.5 text-[10px] font-bold uppercase rounded-md transition-colors",
                isSubmitted 
                  ? "bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/10" 
                  : "bg-[var(--theme-color)] text-white hover:opacity-90"
              )}
            >
              {isSubmitted ? 'View Submission' : 'Start Task'}
            </button>
            <button 
              onClick={() => onHelp?.(assignment.id)}
              className="px-3 py-1.5 bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400 text-[10px] font-bold uppercase rounded-md hover:bg-gray-200 dark:hover:bg-white/10 transition-colors"
            >
              AI Help
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
