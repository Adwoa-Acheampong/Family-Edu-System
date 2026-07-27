import React, { useEffect, useState } from 'react';
import { BookOpen, ExternalLink, Loader2, Plus, Video } from 'lucide-react';
import { User } from '../types';
import { getLessons, ingestLesson, isEngineRoomConfigured } from '../lib/api';

interface Lesson {
  id: string;
  title: string;
  youtubeUrl: string;
  notebookUrl?: string;
  notebookStatus: string;
  createdAt: string;
  transcript: {
    transcript: string;
    language: string;
  };
}

export function LessonBuilder({ user }: { user: User }) {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [title, setTitle] = useState('');
  const [addToNotebook, setAddToNotebook] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    if (!isEngineRoomConfigured) {
      setLessons([]);
      return;
    }
    getLessons(user.id)
      .then((data) => {
        if (active) setLessons(data.lessons || []);
      })
      .catch((err) => {
        if (active) setError(err instanceof Error ? err.message : 'Could not load lessons.');
      });
    return () => {
      active = false;
    };
  }, [user.id]);

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!youtubeUrl.trim()) return;
    setLoading(true);
    setError('');
    try {
      const result = await ingestLesson({
        userId: user.id,
        persona: user.persona,
        youtubeUrl: youtubeUrl.trim(),
        title: title.trim() || undefined,
        languages: ['en'],
        addToNotebook,
      });
      setLessons((current) => [result.lesson, ...current]);
      setYoutubeUrl('');
      setTitle('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create the lesson.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="mt-10">
      <div className="flex items-center gap-2 mb-4">
        <Video size={18} className="text-red-500" />
        <h2 className="text-sm font-bold uppercase tracking-widest text-gray-500">
          YouTube lessons
        </h2>
      </div>

      <div className="rounded-3xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#0a0a0a] p-5 sm:p-6">
        <form onSubmit={handleCreate} className="grid md:grid-cols-[1fr_1fr_auto] gap-3">
          <label className="block">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-2">
              YouTube URL
            </span>
            <input
              type="url"
              required
              value={youtubeUrl}
              onChange={(event) => setYoutubeUrl(event.target.value)}
              placeholder="https://youtube.com/watch?v=..."
              disabled={!isEngineRoomConfigured || loading}
              className="w-full h-11 rounded-xl border border-black/10 dark:border-white/10 bg-gray-50 dark:bg-black px-4 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-[var(--theme-color)]"
            />
          </label>
          <label className="block">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-2">
              Lesson title (optional)
            </span>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Use the video title"
              disabled={!isEngineRoomConfigured || loading}
              className="w-full h-11 rounded-xl border border-black/10 dark:border-white/10 bg-gray-50 dark:bg-black px-4 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-[var(--theme-color)]"
            />
          </label>
          <button
            type="submit"
            disabled={!isEngineRoomConfigured || loading}
            className="md:self-end h-11 px-5 rounded-xl bg-[var(--theme-color)] text-black font-bold text-xs uppercase tracking-wider disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
            Create
          </button>
        </form>

        <label className="mt-4 inline-flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300">
          <input
            type="checkbox"
            checked={addToNotebook}
            onChange={(event) => setAddToNotebook(event.target.checked)}
            disabled={!isEngineRoomConfigured || loading}
            className="accent-[var(--theme-color)]"
          />
          Add the video as a Gemini Notebook Enterprise source when configured
        </label>

        {!isEngineRoomConfigured && (
          <p className="mt-4 text-sm text-amber-600 dark:text-amber-400">
            Set VITE_ENGINE_ROOM_URL to enable transcript and notebook ingestion.
          </p>
        )}
        {error && (
          <p role="alert" className="mt-4 text-sm text-red-600 dark:text-red-400">
            {error}
          </p>
        )}
      </div>

      {lessons.length > 0 && (
        <div className="grid md:grid-cols-2 gap-4 mt-4">
          {lessons.map((lesson) => (
            <article
              key={lesson.id}
              className="rounded-2xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#0a0a0a] p-5"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-500/10 text-red-500 flex items-center justify-center shrink-0">
                  <Video size={20} />
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-gray-900 dark:text-white">{lesson.title}</h3>
                  <p className="mt-2 text-sm text-gray-500 line-clamp-3">
                    {lesson.transcript.transcript}
                  </p>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <a
                  href={lesson.youtubeUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-red-500/10 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-red-600 dark:text-red-400"
                >
                  Video <ExternalLink size={12} />
                </a>
                {lesson.notebookUrl && (
                  <a
                    href={lesson.notebookUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--theme-color)]/10 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-[var(--theme-color)]"
                  >
                    <BookOpen size={12} /> Notebook
                  </a>
                )}
                {lesson.notebookStatus !== 'not_requested' && (
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                    Notebook: {lesson.notebookStatus.replaceAll('_', ' ')}
                  </span>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
