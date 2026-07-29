import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Loader2, Save } from 'lucide-react';
import { useSaveSystemSettings, useSystemSettings } from '../hooks/useLiveData';
import { useUI } from '../context/UIContext';
import { appConfig } from '../config/env';

export function SystemConfigPage() {
  const navigate = useNavigate();
  const { setNotice } = useUI();
  const { data, isLoading } = useSystemSettings();
  const save = useSaveSystemSettings();

  const [pollMs, setPollMs] = useState(appConfig.pollIntervalMs);
  const [engineRoomUrl, setEngineRoomUrl] = useState(appConfig.engineRoomUrl);
  const [classroomCourseId, setClassroomCourseId] = useState('');
  const [enableNotifications, setEnableNotifications] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!data) return;
    if (typeof data.pollIntervalMs === 'number') setPollMs(data.pollIntervalMs);
    if (typeof data.engineRoomUrl === 'string') setEngineRoomUrl(data.engineRoomUrl);
    if (typeof data.classroomCourseId === 'string') setClassroomCourseId(data.classroomCourseId);
    if (typeof data.enableNotifications === 'boolean') setEnableNotifications(data.enableNotifications);
  }, [data]);

  const validate = () => {
    const next: Record<string, string> = {};
    if (pollMs < 5000) next.pollMs = 'Minimum 5000 ms';
    if (engineRoomUrl && !/^https?:\/\//i.test(engineRoomUrl) && engineRoomUrl.length > 0) {
      next.engineRoomUrl = 'Must start with http:// or https://';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    try {
      await save.mutateAsync({
        pollIntervalMs: pollMs,
        engineRoomUrl,
        classroomCourseId,
        enableNotifications,
      });
      setNotice('System configuration saved.');
    } catch (err) {
      setNotice(err instanceof Error ? err.message : 'Save failed');
    }
  };

  return (
    <div className="p-4 sm:p-6 md:p-10 max-w-3xl mx-auto animate-fade-in pb-24">
      <button
        type="button"
        onClick={() => navigate('/dashboard')}
        className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gray-500 hover:text-white mb-6"
      >
        <ArrowLeft size={14} /> Back
      </button>

      <div className="text-[10px] font-bold uppercase tracking-[0.25em] text-[var(--theme-color)] mb-2">
        System Config
      </div>
      <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight mb-2">Runtime configuration</h1>
      <p className="text-sm text-gray-500 mb-8">
        Persisted via API. Frontend env still controls build-time Vite variables.
      </p>

      {isLoading ? (
        <div className="flex items-center gap-2 text-gray-500 py-12">
          <Loader2 className="animate-spin" /> Loading…
        </div>
      ) : (
        <form onSubmit={onSubmit} className="space-y-6 rounded-3xl border border-white/10 bg-[#0a0a0a] p-6 sm:p-8">
          <Field
            label="Poll interval (ms)"
            error={errors.pollMs}
            hint="How often dashboards refresh live status"
          >
            <input
              type="number"
              min={5000}
              step={1000}
              value={pollMs}
              onChange={(e) => setPollMs(Number(e.target.value))}
              className="w-full h-11 rounded-xl bg-black border border-white/10 px-4 text-sm text-white focus:outline-none focus:border-[var(--theme-color)]"
            />
          </Field>

          <Field label="Engine Room URL" error={errors.engineRoomUrl} hint="e.g. http://localhost:8000">
            <input
              type="url"
              value={engineRoomUrl}
              onChange={(e) => setEngineRoomUrl(e.target.value)}
              placeholder="http://localhost:8000"
              className="w-full h-11 rounded-xl bg-black border border-white/10 px-4 text-sm text-white focus:outline-none focus:border-[var(--theme-color)]"
            />
          </Field>

          <Field label="Default Classroom course ID" hint="Optional Google Classroom course filter">
            <input
              value={classroomCourseId}
              onChange={(e) => setClassroomCourseId(e.target.value)}
              placeholder="course_..."
              className="w-full h-11 rounded-xl bg-black border border-white/10 px-4 text-sm text-white focus:outline-none focus:border-[var(--theme-color)]"
            />
          </Field>

          <label className="flex items-center gap-3 text-sm text-gray-300 cursor-pointer">
            <input
              type="checkbox"
              checked={enableNotifications}
              onChange={(e) => setEnableNotifications(e.target.checked)}
              className="accent-[var(--theme-color)] w-4 h-4"
            />
            Enable in-app status notifications
          </label>

          <button
            type="submit"
            disabled={save.isPending}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[var(--theme-color)] text-black font-bold text-xs uppercase tracking-wider disabled:opacity-50"
          >
            {save.isPending ? <Loader2 size={16} className="animate-spin" /> : save.isSuccess ? <CheckCircle2 size={16} /> : <Save size={16} />}
            {save.isPending ? 'Saving…' : 'Save configuration'}
          </button>
        </form>
      )}
    </div>
  );
}

function Field({
  label,
  error,
  hint,
  children,
}: {
  label: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">{label}</span>
      {children}
      {hint && !error && <span className="block text-xs text-gray-600 mt-1.5">{hint}</span>}
      {error && <span className="block text-xs text-red-400 mt-1.5">{error}</span>}
    </label>
  );
}
