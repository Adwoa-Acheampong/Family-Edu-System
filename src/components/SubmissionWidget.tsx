import React, { useState } from 'react';
import { Upload, X, Mic, Send, FileText, CheckCircle2 } from 'lucide-react';
import { User } from '../types';
import { cn } from '../utils';

interface SubmissionWidgetProps {
  isOpen: boolean;
  onClose: () => void;
  assignmentId: string;
  assignmentTitle: string;
  user: User;
  onSubmit: (id: string, data: any) => Promise<void>;
}

export function SubmissionWidget({ isOpen, onClose, assignmentId, assignmentTitle, user, onSubmit }: SubmissionWidgetProps) {
  const [text, setText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  if (!isOpen) return null;

  const isToddler = user.age <= 5;

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmit(assignmentId, { textResponse: text });
      setIsSubmitted(true);
      setTimeout(() => {
        setIsSubmitted(false);
        setText('');
        onClose();
      }, 1500);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div 
        className={cn(
          "w-full max-w-lg bg-white dark:bg-[#0a0a0a] rounded-3xl overflow-hidden shadow-2xl border border-black/10 dark:border-white/10",
          isToddler ? "p-8 text-center" : "p-0"
        )}
      >
        {isSubmitted ? (
          <div className="p-12 flex flex-col items-center justify-center text-center">
            <div className="w-20 h-20 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mb-6">
              <CheckCircle2 size={40} />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Great job!</h2>
            <p className="text-gray-500">Your assignment has been submitted.</p>
          </div>
        ) : isToddler ? (
          <>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">Did you finish?</h2>
            <button 
              onClick={() => handleSubmit()}
              disabled={isSubmitting}
              className="w-full py-8 bg-green-500 hover:bg-green-600 text-white text-4xl font-black rounded-3xl shadow-[0_10px_0_rgb(21,128,61)] active:shadow-[0_0px_0_rgb(21,128,61)] active:translate-y-[10px] transition-all"
            >
              {isSubmitting ? "Wait..." : "I'M DONE!"}
            </button>
            <button 
              onClick={onClose}
              className="mt-8 text-gray-500 font-bold uppercase tracking-widest text-sm"
            >
              Not Yet
            </button>
          </>
        ) : (
          <>
            <div className="flex items-center justify-between p-6 border-b border-black/5 dark:border-white/5">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--theme-color)] mb-1">Turn In</div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">{assignmentTitle}</h2>
              </div>
              <button 
                onClick={onClose}
                className="w-10 h-10 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center text-gray-500 hover:bg-gray-200 dark:hover:bg-white/10 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6">
              <div className="mb-6">
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-widest mb-3">Upload File</label>
                <div className="border-2 border-dashed border-gray-300 dark:border-white/20 rounded-2xl p-8 flex flex-col items-center justify-center text-center hover:bg-gray-50 dark:hover:bg-white/5 transition-colors cursor-pointer">
                  <div className="w-12 h-12 bg-[var(--theme-color)]/10 text-[var(--theme-color)] rounded-full flex items-center justify-center mb-3">
                    <Upload size={24} />
                  </div>
                  <div className="text-sm font-bold text-gray-900 dark:text-white mb-1">Click or drag file to this area to upload</div>
                  <div className="text-xs text-gray-500">PDF, Word, Images, or Video (max 100MB)</div>
                </div>
              </div>
              
              <div className="mb-6">
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-widest mb-3">Or Type Response</label>
                <textarea 
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Write your answer here..."
                  className="w-full bg-gray-50 dark:bg-[#050505] border border-gray-200 dark:border-white/10 rounded-xl p-4 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-[var(--theme-color)] min-h-[120px] resize-none"
                />
              </div>
              
              <div className="flex gap-3">
                <button 
                  type="button"
                  className="flex-1 py-3 bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-gray-300 font-bold text-xs uppercase tracking-wider rounded-xl hover:bg-gray-200 dark:hover:bg-white/10 transition-colors flex items-center justify-center gap-2"
                >
                  <Mic size={16} /> Record Audio
                </button>
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-3 bg-[var(--theme-color)] text-white dark:text-black font-bold text-xs uppercase tracking-wider rounded-xl hover:opacity-90 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting ? 'Submitting...' : (
                    <>
                      <Send size={16} /> Turn In
                    </>
                  )}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
