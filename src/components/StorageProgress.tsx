import React from 'react';
import { Cloud } from 'lucide-react';
import { cn } from '../utils';

interface StorageProgressProps {
  usedBytes: number;
  totalBytes: number;
  className?: string;
}

export function StorageProgress({ usedBytes, totalBytes, className }: StorageProgressProps) {
  const percentage = Math.min(100, Math.max(0, (usedBytes / totalBytes) * 100));
  const freeBytes = totalBytes - usedBytes;

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div className={cn("bg-white dark:bg-[#0a0a0a] border border-black/10 dark:border-white/10 p-4 rounded-2xl", className)}>
      <div className="flex items-center gap-2 mb-3">
        <Cloud className="text-[var(--theme-color)] w-5 h-5" />
        <h3 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-widest">Google Drive Storage</h3>
      </div>
      
      <div className="mb-2">
        <div className="w-full bg-gray-200 dark:bg-black rounded-full h-2.5 overflow-hidden">
          <div 
            className="bg-[var(--theme-color)] h-full transition-all duration-500 ease-in-out" 
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
      
      <div className="flex justify-between items-center text-xs">
        <div className="text-gray-500 font-medium">
          <span className="text-gray-900 dark:text-white font-bold">{formatBytes(usedBytes)}</span> / {formatBytes(totalBytes)}
        </div>
        <div className="text-gray-500 font-medium">
          Used: <span className="text-[var(--theme-color)] font-bold">{percentage.toFixed(1)}%</span>
        </div>
      </div>
    </div>
  );
}
