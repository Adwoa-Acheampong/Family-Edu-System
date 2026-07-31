import React, { useCallback, useEffect, useState } from 'react';
import { User } from '../types';
import { getMockCourses } from '../data';
import { ClassroomCard, Assignment } from './ClassroomCard';
import { SubmissionWidget } from './SubmissionWidget';
import { LessonBuilder } from './LessonBuilder';
import { DocumentUploader } from './DocumentUploader';
import {
  getAssignments,
  getModules,
  hasGoogleSession,
  isEngineRoomConfigured,
  startGoogleOAuth,
  submitAssignment,
  syncClassroom,
} from '../lib/api';
import { BookOpen, Sparkles, Trophy, Target, Bot, Palette, GraduationCap, Loader2, RefreshCw } from 'lucide-react';
import { cn } from '../utils';

interface Course {
  id: string;
  title: string;
  emoji: string;
  progress: number;
}

function coursesFromAssignments(assignments: Assignment[], fallbackUserId: string): Course[] {
  const byCourse = new Map<string, Assignment[]>();
  for (const a of assignments) {
    const key = a.courseId || a.courseName || 'default';
    if (!byCourse.has(key)) byCourse.set(key, []);
    byCourse.get(key)!.push(a);
  }
  if (byCourse.size === 0) return getMockCourses(fallbackUserId);
  return Array.from(byCourse.entries()).map(([id, items]) => {
    const done = items.filter((x) => x.status !== 'PENDING').length;
    return {
      id,
      title: items[0]?.courseName || id.replace(/^course_/, '').replace(/_/g, ' '),
      emoji: '📚',
      progress: items.length ? Math.round((done / items.length) * 100) : 0,
    };
  });
}

export function LearningHub({ user }: { user: User }) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'DONE'>('ALL');
  const [submitOpen, setSubmitOpen] = useState(false);
  const [activeAssignment, setActiveAssignment] = useState<Assignment | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [syncError, setSyncError] = useState('');
  const [dataSource, setDataSource] = useState<'api' | 'google' | 'empty'>('empty');

  const loadFromApi = useCallback(async () => {
    setLoading(true);
    setSyncError('');
    try {
      const [assignData, moduleData] = await Promise.all([
        getAssignments(user.id),
        getModules(user.id).catch(() => ({ modules: [] }))
      ]);
      const list: Assignment[] = (assignData.assignments || []).map((a: any) => ({
        id: a.id,
        courseId: a.courseId,
        courseName: a.courseName,
        title: a.title,
        description: a.description,
        dueDate: a.dueDate,
        points: a.points,
        status: a.status || 'PENDING',
      }));
      const moduleList: Assignment[] = (moduleData.modules || []).map((m: any) => ({
        id: m.id,
        courseId: 'module_curriculum',
        courseName: 'AI Curriculum',
        title: m.title,
        description: m.description || m.objectives,
        points: 50,
        status: m.status === 'COMPLETED' ? 'GRADED' : 'PENDING'
      }));
      const combinedList = [...list, ...moduleList];
      setAssignments(combinedList);
      setCourses(coursesFromAssignments(combinedList, user.id));
      setDataSource(combinedList.length ? 'api' : 'empty');
    } catch (err) {
      setSyncError(err instanceof Error ? err.message : 'Could not load assignments');
      setAssignments([]);
      setCourses([]);
      setDataSource('empty');
    } finally {
      setLoading(false);
    }
  }, [user.id]);

  const syncLiveClassroom = useCallback(async () => {
    if (!isEngineRoomConfigured || !hasGoogleSession()) {
      await loadFromApi();
      return;
    }
    setSyncing(true);
    setSyncError('');
    try {
      const data = await syncClassroom(user.id);
      const liveAssignments: Assignment[] = (data.assignments || []).map((assignment: any) => ({
        id: assignment.id,
        courseId: assignment.courseId,
        courseName: assignment.courseName,
        title: assignment.title,
        description: assignment.description,
        dueDate: assignment.dueDate,
        alternateLink: assignment.alternateLink,
        materials: assignment.materials,
        points: assignment.maxPoints ?? assignment.points,
        status:
          assignment.submissionState === 'RETURNED'
            ? 'GRADED'
            : assignment.submissionState === 'TURNED_IN' || assignment.status === 'SUBMITTED'
              ? 'SUBMITTED'
              : assignment.status === 'GRADED'
                ? 'GRADED'
                : 'PENDING',
      }));
      if (liveAssignments.length) {
        setAssignments(liveAssignments);
        const liveCourses: Course[] = (data.courses || []).map((course: any) => {
          const courseAssignments = liveAssignments.filter((item) => item.courseId === course.id);
          const completed = courseAssignments.filter((item) => item.status !== 'PENDING').length;
          return {
            id: course.id,
            title: course.name,
            emoji: '📚',
            progress: courseAssignments.length
              ? Math.round((completed / courseAssignments.length) * 100)
              : 0,
          };
        });
        setCourses(liveCourses.length ? liveCourses : coursesFromAssignments(liveAssignments, user.id));
        setDataSource('google');
      } else {
        await loadFromApi();
      }
    } catch (err) {
      setSyncError(err instanceof Error ? err.message : 'Classroom sync failed.');
      await loadFromApi();
    } finally {
      setSyncing(false);
    }
  }, [user.id, loadFromApi]);

  useEffect(() => {
    setFilter('ALL');
    void syncLiveClassroom();
  }, [syncLiveClassroom]);

  const filtered = assignments.filter((a) => {
    if (filter === 'PENDING') return a.status === 'PENDING';
    if (filter === 'DONE') return a.status !== 'PENDING';
    return true;
  });

  const pendingCount = assignments.filter((a) => a.status === 'PENDING').length;
  const isYoung = user.age <= 8;

  const handleView = (id: string) => {
    const a = assignments.find((x) => x.id === id);
    if (!a) return;
    setActiveAssignment(a);
    if (a.status === 'PENDING') setSubmitOpen(true);
  };

  const handleSubmit = async (
    id: string,
    data: { textResponse?: string; file?: File; fileName?: string }
  ) => {
    const assignment = assignments.find((item) => item.id === id);
    if (!assignment) throw new Error('Assignment not found.');
    await submitAssignment(assignment.courseId || 'course_family', id, {
      ...data,
      userId: user.id,
    });
    setAssignments((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: 'SUBMITTED' as const } : a))
    );
  };

  return (
    <div className="p-4 sm:p-6 md:p-10 font-sans max-w-6xl mx-auto animate-fade-in pb-24">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-[0.25em] text-[var(--theme-color)] mb-2">
            Learning Hub
          </div>
          <h1 className="text-3xl md:text-5xl font-black tracking-tight text-gray-900 dark:text-white">
            {isYoung ? `Let's learn, ${user.name}!` : `${user.name}'s courses`}
          </h1>
          <p className="text-gray-500 mt-2 text-sm md:text-base max-w-xl">
            {isYoung
              ? 'Pick a quest below. You can ask the Engine Room for help anytime.'
              : 'Courses and assignments from the API / Google Classroom.'}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {isEngineRoomConfigured && !hasGoogleSession() ? (
            <button
              type="button"
              onClick={async () => {
                setSyncError('');
                try {
                  const { authorizationUrl } = await startGoogleOAuth();
                  window.location.assign(authorizationUrl);
                } catch (err) {
                  setSyncError(err instanceof Error ? err.message : 'Could not start Google sign-in.');
                }
              }}
              className="px-3 py-1.5 rounded-full text-xs font-bold border border-[var(--theme-color)]/30 bg-[var(--theme-color)]/10 text-[var(--theme-color)]"
            >
              Connect Google
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => void syncLiveClassroom()}
            disabled={syncing || loading}
            className="px-3 py-1.5 rounded-full text-xs font-bold border border-black/10 dark:border-white/10 text-gray-500 inline-flex items-center gap-1.5 disabled:opacity-50"
          >
            {syncing || loading ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
            {syncing || loading ? 'Loading' : 'Refresh'}
          </button>
          <span className="px-3 py-1.5 rounded-full text-xs font-bold border border-[var(--theme-color)]/30 bg-[var(--theme-color)]/10 text-[var(--theme-color)]">
            {pendingCount} pending
          </span>
          <span className="px-3 py-1.5 rounded-full text-xs font-bold border border-black/10 dark:border-white/10 text-gray-500">
            {courses.length} courses
          </span>
        </div>
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-2 text-xs">
        <span
          className={cn(
            'rounded-full px-3 py-1.5 font-bold',
            dataSource === 'google'
              ? 'bg-green-500/10 text-green-600 dark:text-green-400'
              : dataSource === 'api'
                ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
          )}
        >
          {dataSource === 'google'
            ? 'Live Google Classroom'
            : dataSource === 'api'
              ? 'API assignment store'
              : 'No assignments yet'}
        </span>
        {syncError && (
          <span role="alert" className="text-red-600 dark:text-red-400">
            {syncError}
          </span>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-gray-500 gap-2">
          <Loader2 className="animate-spin" /> Loading assignments…
        </div>
      ) : (
        <>
          <section className="mb-10">
            <div className="flex items-center gap-2 mb-4">
              <GraduationCap size={18} className="text-[var(--theme-color)]" />
              <h2 className="text-sm font-bold uppercase tracking-widest text-gray-500">Courses</h2>
            </div>
            {courses.length === 0 ? (
              <p className="text-sm text-gray-500">No courses for this profile yet.</p>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {courses.map((c) => (
                  <div
                    key={c.id}
                    className="group relative overflow-hidden rounded-2xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#0a0a0a] p-5 hover:border-[var(--theme-color)]/40 transition-all hover:-translate-y-0.5 shadow-sm"
                  >
                    <div className="text-3xl mb-3">{c.emoji}</div>
                    <h3 className="font-bold text-gray-900 dark:text-white mb-3 capitalize">{c.title}</h3>
                    <div className="w-full h-1.5 rounded-full bg-gray-100 dark:bg-black overflow-hidden border border-black/5 dark:border-white/5">
                      <div
                        className="h-full rounded-full bg-[var(--theme-color)] transition-all duration-700"
                        style={{ width: `${c.progress}%` }}
                      />
                    </div>
                    <div className="flex justify-between mt-2 text-[10px] font-bold uppercase tracking-wider text-gray-500">
                      <span>Progress</span>
                      <span className="text-[var(--theme-color)]">{c.progress}%</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-2">
                <BookOpen size={18} className="text-[var(--theme-color)]" />
                <h2 className="text-sm font-bold uppercase tracking-widest text-gray-500">Assignments</h2>
              </div>
              <div className="flex gap-1 p-1 rounded-xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5">
                {(['ALL', 'PENDING', 'DONE'] as const).map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setFilter(f)}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors',
                      filter === f
                        ? 'bg-[var(--theme-color)] text-black'
                        : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
                    )}
                  >
                    {f === 'DONE' ? 'Submitted' : f}
                  </button>
                ))}
              </div>
            </div>

            {filtered.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-black/10 dark:border-white/10 p-12 text-center">
                <Trophy className="mx-auto mb-3 text-[var(--theme-color)]" size={32} />
                <p className="font-bold text-gray-900 dark:text-white">All caught up!</p>
                <p className="text-sm text-gray-500 mt-1">No assignments in this view.</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {filtered.map((a) => (
                  <ClassroomCard
                    key={a.id}
                    assignment={a}
                    onView={handleView}
                    onHelp={() => window.dispatchEvent(new CustomEvent('fes-open-ai'))}
                  />
                ))}
              </div>
            )}
          </section>

          <LessonBuilder user={user} />
          <DocumentUploader user={user} />
        </>
      )}

      <SubmissionWidget
        isOpen={submitOpen}
        onClose={() => {
          setSubmitOpen(false);
          setActiveAssignment(null);
        }}
        assignmentId={activeAssignment?.id || ''}
        assignmentTitle={activeAssignment?.title || ''}
        user={user}
        onSubmit={handleSubmit}
      />
    </div>
  );
}

export function MyProfile({ user }: { user: User }) {
  const isYoung = user.age <= 8;

  return (
    <div className="p-4 sm:p-6 md:p-10 font-sans max-w-3xl mx-auto animate-fade-in pb-24">
      <div className="text-[10px] font-bold uppercase tracking-[0.25em] text-[var(--theme-color)] mb-2">
        Profile
      </div>
      <h1 className="text-3xl md:text-5xl font-black tracking-tight text-gray-900 dark:text-white mb-8">
        {isYoung ? `This is ${user.name}` : 'My Profile'}
      </h1>

      <div className="bg-white dark:bg-[#0a0a0a] border border-black/10 dark:border-white/10 rounded-3xl overflow-hidden shadow-xl">
        <div
          className="h-28 relative"
          style={{ background: `linear-gradient(135deg, ${user.themeHex}55, transparent)` }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-white dark:from-[#0a0a0a] to-transparent" />
        </div>

        <div className="px-6 sm:px-8 pb-8 -mt-14 relative flex flex-col items-center text-center">
          <div
            className="w-28 h-28 rounded-[1.75rem] flex items-center justify-center text-4xl font-bold text-black shadow-2xl border-4 border-white dark:border-[#0a0a0a]"
            style={{ backgroundColor: user.themeHex }}
          >
            {user.avatarInitials}
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold mt-4 text-gray-900 dark:text-white">{user.name}</h2>
          <div className="text-[var(--theme-color)] font-bold tracking-[0.2em] uppercase text-xs mt-1">
            {user.persona}
          </div>

          <div className="w-full grid grid-cols-2 sm:grid-cols-4 gap-3 mt-8 text-left">
            <Stat label="Age" value={String(user.age)} />
            <Stat label="Role" value={user.role} />
            <Stat label="Theme" value={user.theme} />
            <Stat label="ID" value={user.id.toUpperCase()} />
          </div>

          <div className="w-full mt-6 space-y-3 text-left">
            <InfoRow icon={<Target size={16} />} title="Learning focus" body={user.learningFocus} />
            <InfoRow icon={<Bot size={16} />} title="AI companion" body={user.aiAssistantRole} />
            <InfoRow
              icon={<Palette size={16} />}
              title="Theme color"
              body={
                <span className="inline-flex items-center gap-2">
                  <span
                    className="w-3 h-3 rounded-full border border-black/10"
                    style={{ backgroundColor: user.themeHex }}
                  />
                  {user.themeHex}
                </span>
              }
            />
            <InfoRow
              icon={<Sparkles size={16} />}
              title="How you learn"
              body={
                isYoung
                  ? 'Short games, stories, and lots of encouragement.'
                  : user.role === 'admin'
                    ? 'Strategic systems thinking and rapid iteration.'
                    : 'Practical steps, practice, and clear feedback.'
              }
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-gray-50 dark:bg-black/50 p-3 rounded-2xl border border-black/5 dark:border-white/5">
      <div className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mb-1">{label}</div>
      <div className="text-sm font-bold text-gray-900 dark:text-white capitalize truncate">{value}</div>
    </div>
  );
}

function InfoRow({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: React.ReactNode;
}) {
  return (
    <div className="flex gap-3 p-4 rounded-2xl bg-gray-50 dark:bg-black/40 border border-black/5 dark:border-white/5">
      <div className="w-9 h-9 rounded-xl bg-[var(--theme-color)]/15 text-[var(--theme-color)] flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div className="min-w-0">
        <div className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-0.5">{title}</div>
        <div className="text-sm font-medium text-gray-900 dark:text-white">{body}</div>
      </div>
    </div>
  );
}
