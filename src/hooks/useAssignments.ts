import { useCallback, useEffect, useState } from 'react';
import { Assignment } from '../components/ClassroomCard';
import { getAssignments, getModules, submitAssignment } from '../lib/api';

export function useAssignments(userId: string) {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const reload = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [assignData, moduleData] = await Promise.all([
        getAssignments(userId),
        getModules(userId).catch(() => ({ modules: [] }))
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
      setAssignments([...list, ...moduleList]);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load assignments');
      setAssignments([]);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const submit = useCallback(
    async (
      id: string,
      data: { textResponse?: string; file?: File; fileName?: string },
      courseIdFallback = 'course_family'
    ) => {
      const item = assignments.find((a) => a.id === id);
      await submitAssignment(item?.courseId || courseIdFallback, id, {
        ...data,
        userId,
      });
      setAssignments((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status: 'SUBMITTED' as const } : a))
      );
    },
    [assignments, userId]
  );

  const pending = assignments.filter((a) => a.status === 'PENDING');
  const done = assignments.filter((a) => a.status !== 'PENDING');
  const progress =
    assignments.length === 0 ? 0 : Math.round((done.length / assignments.length) * 100);

  return {
    assignments,
    loading,
    error,
    reload,
    submit,
    pending,
    done,
    progress,
    pendingCount: pending.length,
    completedCount: done.length,
  };
}
