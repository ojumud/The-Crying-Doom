import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { DIARY_PAGES } from '../data/dialogue';

interface DiaryModalProps {
  onPlayPageFlip: () => void;
  onClose: (finishedReading: boolean) => void;
}

export const DiaryModal: React.FC<DiaryModalProps> = ({ onPlayPageFlip, onClose }) => {
  const [pageIdx, setPageIdx] = useState(0);
  const [reachedEnd, setReachedEnd] = useState(false);
  const [flipDir, setFlipDir] = useState<'none' | 'next' | 'prev'>('none');

  const current = DIARY_PAGES[pageIdx];

  const turnPage = (nextIdx: number, dir: 'next' | 'prev') => {
    if (nextIdx < 0 || nextIdx >= DIARY_PAGES.length) return;
    onPlayPageFlip();
    setFlipDir(dir);
    if (nextIdx === DIARY_PAGES.length - 1) {
      setReachedEnd(true);
    }
    window.setTimeout(() => {
      setPageIdx(nextIdx);
      setFlipDir('none');
    }, 150);
  };

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/82 p-4">
      <div className="relative w-full max-w-xl">
        {/* Leather book spine & aged paper surface */}
        <div
          className={`relative border-2 border-[#3b281b] bg-[#d6c7a8] text-[#211912] p-7 sm:p-10 shadow-2xl transition-transform duration-150 ${
            flipDir === 'next'
              ? '-translate-x-2 opacity-80'
              : flipDir === 'prev'
              ? 'translate-x-2 opacity-80'
              : 'translate-x-0 opacity-100'
          }`}
          style={{
            backgroundImage:
              'radial-gradient(circle at 80% 20%, rgba(120, 88, 52, 0.18), transparent 55%), linear-gradient(180deg, #dccfae 0%, #c9b793 100%)',
          }}
        >
          {/* Torn / damaged stain effect on Final Entry */}
          {current.damaged && (
            <>
              <div
                className="pointer-events-none absolute top-0 right-0 w-28 h-28 opacity-40"
                style={{
                  background:
                    'radial-gradient(circle at top right, #2e1d12 0%, rgba(46,29,18,0.3) 45%, transparent 72%)',
                }}
              />
              <div
                className="pointer-events-none absolute bottom-0 right-0 w-20 h-16 bg-[#17120e]"
                style={{ clipPath: 'polygon(100% 0, 100% 100%, 15% 100%, 45% 58%)' }}
              />
            </>
          )}

          {/* Header */}
          <div className="flex items-center justify-between border-b border-[#8f7958]/60 pb-3 mb-6">
            <span className="font-mono-tech text-xs tracking-[0.26em] uppercase text-[#5c4631]">
              {current.entryLabel}
            </span>
            <button
              onClick={() => onClose(reachedEnd || pageIdx === DIARY_PAGES.length - 1)}
              className="flex items-center gap-1 text-xs font-mono-tech uppercase tracking-wider text-[#5c4631] hover:text-[#1f160e] cursor-pointer"
            >
              <span>Close</span>
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Handwritten Diary Body */}
          <div className="min-h-[175px] flex flex-col justify-center">
            <p
              className={`font-serif-hand text-2xl sm:text-3xl leading-relaxed italic ${
                current.damaged ? 'text-[#2c1510]' : 'text-[#231911]'
              }`}
            >
              &ldquo;{current.text}&rdquo;
            </p>
            {current.damaged && (
              <p className="mt-5 text-xs font-mono-tech uppercase tracking-widest text-[#703024]">
                [The lower corner of the page is torn and stained.]
              </p>
            )}
          </div>

          {/* Page Navigation */}
          <div className="flex items-center justify-between border-t border-[#8f7958]/60 pt-4 mt-6">
            <button
              onClick={() => turnPage(pageIdx - 1, 'prev')}
              disabled={pageIdx === 0}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono-tech uppercase tracking-wider border ${
                pageIdx === 0
                  ? 'border-transparent text-[#8f7958]/50 cursor-not-allowed'
                  : 'border-[#7a6345] text-[#2a1e14] hover:bg-[#c2ae87] cursor-pointer'
              }`}
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </button>

            <span className="text-xs font-mono-tech text-[#5c4631] tabular-nums">
              Page {pageIdx + 1} / {DIARY_PAGES.length}
            </span>

            {pageIdx < DIARY_PAGES.length - 1 ? (
              <button
                onClick={() => turnPage(pageIdx + 1, 'next')}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono-tech uppercase tracking-wider border border-[#7a6345] bg-[#cbb994] hover:bg-[#bfa97e] text-[#1f160e] cursor-pointer"
              >
                Next Page
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={() => onClose(true)}
                className="px-4 py-1.5 text-xs font-mono-tech uppercase tracking-wider bg-[#382315] hover:bg-[#4c301e] text-[#ebe0ca] cursor-pointer"
              >
                Put Diary Away
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
