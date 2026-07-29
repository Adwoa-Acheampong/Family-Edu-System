import React, { useState } from 'react';
import { BookOpen, CheckCircle2, ChevronRight, Loader2, RefreshCw } from 'lucide-react';
import { User } from '../types';
import { ClassroomCard } from './ClassroomCard';
import { SubmissionWidget } from './SubmissionWidget';
import { useAssignments } from '../hooks/useAssignments';

export function MasterDashboard({ user }: { user: User }) {
  const {
    assignments,
    loading,
    error,
    reload,
    submit,
    pending,
    progress,
    pendingCount,
    completedCount,
  } = useAssignments(user.id);

  const [modal, setModal] = useState<{ isOpen: boolean; id: string; title: string }>({
    isOpen: false,
    id: '',
    title: '',
  });

  const current = pending[0] || assignments[0];

  return (
    <div className="p-6 md:p-12 max-w-5xl mx-auto">
      <div className="mb-12 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-5xl font-serif text-white mb-4 leading-tight">
            Welcome back,
            <br />
            <span className="text-[var(--theme-color)]">{user.name}</span>
          </h1>
          <p className="text-xl text-gray-400 font-light">
            Your lessons come from the family assignment store — not a static demo page.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void reload()}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 text-xs font-bold uppercase tracking-wider text-gray-400 hover:text-white disabled:opacity-50"
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
          Refresh
        </button>
      </div>

      {error && (
        <div className="mb-6 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center gap-2 text-gray-500 py-16 justify-center">
          <Loader2 className="animate-spin" /> Loading your lessons…
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-[#0a0a0a] border border-white/10 p-10 rounded-[2rem] hover:border-[var(--theme-color)]/50 transition-colors">
            <div className="w-16 h-16 rounded-2xl bg-[var(--theme-color)]/10 text-[var(--theme-color)] flex items-center justify-center mb-8 border border-[var(--theme-color)]/20">
              <BookOpen size={32} />
            </div>
            <div className="text-sm font-bold tracking-widest text-gray-500 uppercase mb-3">
              {current?.status === 'PENDING' ? 'CURRENT LESSON' : 'LATEST LESSON'}
            </div>
            {current ? (
              <>
                <h2 className="text-3xl font-serif text-white mb-6">{current.title}</h2>
                <p className="text-gray-300 text-lg leading-relaxed mb-10">
                  {current.description || 'Open this lesson when you are ready.'}
                </p>
                {current.status === 'PENDING' ? (
                  <button
                    type="button"
                    onClick={() =>
                      setModal({ isOpen: true, id: current.id, title: current.title })
                    }
                    className="w-full py-5 bg-[var(--theme-color)] text-black text-lg font-bold rounded-2xl flex items-center justify-center gap-3 hover:bg-[var(--theme-color)]/90 transition-colors"
                  >
                    Continue lesson <ChevronRight size={24} />
                  </button>
                ) : (
                  <div className="flex items-center gap-3 text-[var(--theme-color)] font-bold text-lg">
                    <CheckCircle2 size={28} /> Completed
                  </div>
                )}
              </>
            ) : (
              <p className="text-gray-400 text-lg">No lessons in the API for this profile yet.</p>
            )}
          </div>

          <div className="bg-[#0a0a0a] border border-white/10 p-10 rounded-[2rem]">
            <div className="text-sm font-bold tracking-widest text-gray-500 uppercase mb-6">
              TODAY'S PROGRESS
            </div>
            <div className="text-5xl font-serif text-white mb-2">{progress}%</div>
            <p className="text-gray-400 mb-6">
              {completedCount} done · {pendingCount} remaining
            </p>
            <div className="w-full h-3 rounded-full bg-black border border-white/10 overflow-hidden mb-8">
              <div
                className="h-full bg-[var(--theme-color)] transition-all duration-700"
                style={{ width: `${progress}%` }}
              />
            </div>

            <div className="space-y-3 max-h-64 overflow-y-auto">
              {assignments.map((a) => (
                <label
                  key={a.id}
                  className="flex items-center p-4 rounded-2xl bg-black border border-white/5 cursor-pointer hover:border-white/20 transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={a.status !== 'PENDING'}
                    readOnly
                    className="w-6 h-6 rounded border-white/20 text-[var(--theme-color)] bg-black"
                  />
                  <span className="ml-4 text-lg text-gray-200 flex-1">{a.title}</span>
                  {a.status === 'PENDING' && (
                    <button
                      type="button"
                      onClick={() => setModal({ isOpen: true, id: a.id, title: a.title })}
                      className="text-xs font-bold uppercase tracking-wider text-[var(--theme-color)]"
                    >
                      Open
                    </button>
                  )}
                </label>
              ))}
            </div>
          </div>
        </div>
      )}

      {!loading && assignments.length > 1 && (
        <section className="mt-10">
          <h2 className="text-sm font-bold tracking-widest text-gray-500 uppercase mb-4">
            All lessons
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            {assignments.map((a) => (
              <ClassroomCard
                key={a.id}
                assignment={a}
                onView={(id) => setModal({ isOpen: true, id, title: a.title })}
                onHelp={() => window.dispatchEvent(new CustomEvent('fes-open-ai'))}
              />
            ))}
          </div>
        </section>
      )}

      <SubmissionWidget
        isOpen={modal.isOpen}
        onClose={() => setModal({ isOpen: false, id: '', title: '' })}
        assignmentId={modal.id}
        assignmentTitle={modal.title}
        user={user}
        onSubmit={(id, data) => submit(id, data, 'course_kitchen')}
      />
    </div>
  );
}
