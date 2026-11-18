import React from 'react';

interface ContentWarningModalProps {
  onProceed: () => void;
  onCancel: () => void;
}

export const ContentWarningModal: React.FC<ContentWarningModalProps> = ({
  onProceed,
  onCancel,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#090A0D]/95 p-4">
      <div className="w-full max-w-md border border-[#777A80]/30 bg-[#17191D] p-7 text-center shadow-2xl">
        <div className="text-[11px] font-mono-tech uppercase tracking-[0.28em] text-[#A8B6C8]">
          Content Advisory
        </div>
        <h2 className="font-display text-xl tracking-[0.2em] text-[#E7E5E1] mt-1 mb-4 uppercase">
          Before You Enter
        </h2>
        <div className="h-px w-24 bg-[#581D27] mx-auto mb-5" />
        <p className="text-sm text-[#E7E5E1]/85 leading-relaxed mb-4">
          <span className="font-semibold text-[#E7E5E1]">CRYING DOOM</span> contains
          psychological horror themes, unsettling ambient audio, low-light environments,
          and sudden supernatural events.
        </p>
        <p className="text-xs text-[#777A80] mb-6 leading-relaxed">
          Headphones are recommended. Comfort options including reduced camera movement
          and reduced flashing effects are available in Settings.
        </p>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={onProceed}
            className="flex-1 py-2.5 bg-[#581D27] hover:bg-[#6e2431] border border-[#777A80]/40 text-[#E7E5E1] text-xs font-mono-tech uppercase tracking-[0.22em] transition-colors cursor-pointer"
          >
            Enter Chapter One
          </button>
          <button
            onClick={onCancel}
            className="sm:w-28 py-2.5 bg-[#090A0D] hover:bg-[#17191D] border border-[#777A80]/35 text-[#777A80] hover:text-[#E7E5E1] text-xs font-mono-tech uppercase tracking-[0.2em] transition-colors cursor-pointer"
          >
            Back
          </button>
        </div>
      </div>
    </div>
  );
};
