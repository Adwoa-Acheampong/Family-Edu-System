import React, { useState } from 'react';
import { Loader2, Sparkles, CheckCircle2 } from 'lucide-react';
import { User } from '../types';
import { useAssignments } from '../hooks/useAssignments';
import { SubmissionWidget } from './SubmissionWidget';
import { cn } from '../utils';

/**
 * Compact live assignment strip for younger learners.
 * Keeps games/stories as the main UI while surfacing real API quests.
 */
export function QuestStrip({ user }: { user: User }) {
  const { assignments, loading, error, submit, pending, pendingCount, completedCount } =
    useAssignments(user.id);
  const [modal, setModal] = useState<{ isOpen: boolean; id: string; title: string }>({
    isOpen: false,
    id: '',
    title: '',
  });

  if (loading) {
    return (
      <div className="mx-4 md:mx-10 mt-4 mb-2 flex items-center gap-2 text-sm text-gray-500">
        <Loader2 size={14} className="animate-spin" /> Loading today's quests…
      </div>
    );
  }

  if (error || assignments.length === 0) {
    return null;
  }

  const next = pending[0];

  return (
    <>
      <div className="mx-4 md:mx-10 mt-4 mb-2 rounded-2xl border border-[var(--theme-color)]/25 bg-[var(--theme-color)]/10 px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex items-center gap-2 shrink-0">
          <Sparkles size={18} className="text-[var(--theme-color)]" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--theme-color)]">
            Today's quests
          </span>
        </div>
        <div className="flex-1 min-w-0">
          {next ? (
            <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
              {next.title}
              {next.description ? (
                <span className="text-gray-500 font-normal"> — {next.description}</span>
              ) : null}
            </p>
          ) : (
            <p className="text-sm font-semibold text-emerald-500 flex items-center gap-2">
              <CheckCircle2 size={16} /> All quests done for now!
            </p>
          )}
          <p className="text-[10px] text-gray-500 uppercase tracking-wider mt-0.5">
            {completedCount} done · {pendingCount} left · from API
          </p>
        </div>
        {next && (
          <button
            type="button"
            onClick={() => setModal({ isOpen: true, id: next.id, title: next.title })}
            className={cn(
              'shrink-0 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider',
              'bg-[var(--theme-color)] text-black hover:opacity-90'
            )}
          >
            {user.age <= 5 ? "I'm done!" : 'Open quest'}
          </button>
        )}
      </div>

      <SubmissionWidget
        isOpen={modal.isOpen}
        onClose={() => setModal({ isOpen: false, id: '', title: '' })}
        assignmentId={modal.id}
        assignmentTitle={modal.title}
        user={user}
        onSubmit={(id, data) => submit(id, data, 'course_adventure')}
      />
    </>
  );
}
