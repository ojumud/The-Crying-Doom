import React, { useState } from 'react';
import { BookOpen, Eye, FileText, Image as ImageIcon, KeyRound, Radio, X } from 'lucide-react';
import {
  CLUE_DEFINITIONS,
  ClueId,
  INVENTORY_ITEMS,
  InventoryItemId,
} from '../game/types';
import { PuzzleSymbolSvg } from './PuzzleSymbolSvg';

interface InventoryModalProps {
  inventory: InventoryItemId[];
  clues: ClueId[];
  onInspectItem: (id: InventoryItemId) => void;
  onClose: () => void;
}

export const InventoryModal: React.FC<InventoryModalProps> = ({
  inventory,
  clues,
  onInspectItem,
  onClose,
}) => {
  const [tab, setTab] = useState<'items' | 'journal'>('items');

  const renderIcon = (id: InventoryItemId) => {
    switch (id) {
      case 'old_diary':
        return <BookOpen className="w-6 h-6 text-[#E7E5E1]" />;
      case 'old_photograph':
        return <ImageIcon className="w-6 h-6 text-[#A8B6C8]" />;
      case 'basement_key':
        return <KeyRound className="w-6 h-6 text-[#E7E5E1]" />;
      case 'recording_evidence':
        return <Radio className="w-6 h-6 text-[#A8B6C8]" />;
    }
  };

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-[#090A0D]/86 p-4">
      <div className="w-full max-w-2xl border border-[#777A80]/30 bg-[#17191D] text-[#E7E5E1] p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#777A80]/25 pb-4 mb-5">
          <div>
            <div className="text-[11px] font-mono-tech uppercase tracking-[0.25em] text-[#A8B6C8]">
              Crystal&apos;s Investigation
            </div>
            <h2 className="font-display text-xl tracking-wider mt-0.5">
              Inventory &amp; Evidence Journal
            </h2>
          </div>
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-[#777A80]/35 hover:border-[#A8B6C8] text-xs font-mono-tech uppercase text-[#A8B6C8] hover:text-[#E7E5E1] cursor-pointer"
          >
            <span>Close [I]</span>
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex gap-2 mb-5">
          <button
            onClick={() => setTab('items')}
            className={`px-4 py-2 text-xs font-mono-tech uppercase tracking-widest border cursor-pointer ${
              tab === 'items'
                ? 'border-[#581D27] bg-[#581D27]/75 text-[#E7E5E1]'
                : 'border-[#777A80]/30 bg-[#090A0D] text-[#777A80] hover:text-[#E7E5E1]'
            }`}
          >
            Items ({inventory.length}/4)
          </button>
          <button
            onClick={() => setTab('journal')}
            className={`px-4 py-2 text-xs font-mono-tech uppercase tracking-widest border cursor-pointer ${
              tab === 'journal'
                ? 'border-[#581D27] bg-[#581D27]/75 text-[#E7E5E1]'
                : 'border-[#777A80]/30 bg-[#090A0D] text-[#777A80] hover:text-[#E7E5E1]'
            }`}
          >
            Evidence Journal ({clues.length}/5)
          </button>
        </div>

        {tab === 'items' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[55vh] overflow-y-auto pr-1">
            {(Object.keys(INVENTORY_ITEMS) as InventoryItemId[]).map((id) => {
              const def = INVENTORY_ITEMS[id];
              const collected = inventory.includes(id);
              return (
                <div
                  key={id}
                  className={`border p-4 flex flex-col justify-between ${
                    collected
                      ? 'border-[#777A80]/35 bg-[#090A0D]/80'
                      : 'border-[#777A80]/15 bg-[#090A0D]/40 opacity-50'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="p-2 border border-[#777A80]/25 bg-[#17191D]">
                        {renderIcon(id)}
                      </div>
                      <span className="text-[10px] font-mono-tech uppercase tracking-widest text-[#777A80]">
                        {collected ? 'Collected' : 'Undiscovered'}
                      </span>
                    </div>
                    <h3 className="text-sm font-semibold text-[#E7E5E1]">
                      {collected ? def.name : '???'}
                    </h3>
                    <p className="text-xs text-[#A8B6C8]/80 mt-1 leading-relaxed">
                      {collected ? def.description : 'Not yet discovered inside the house.'}
                    </p>
                  </div>

                  {collected && def.inspectable && (
                    <button
                      onClick={() => onInspectItem(id)}
                      className="mt-3 flex items-center justify-center gap-1.5 px-3 py-1.5 border border-[#514235] bg-[#514235]/35 hover:bg-[#514235]/60 text-[#E7E5E1] text-xs font-mono-tech uppercase tracking-wider cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Inspect</span>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col gap-3 max-h-[55vh] overflow-y-auto pr-1">
            {clues.length === 0 ? (
              <div className="border border-[#777A80]/25 bg-[#090A0D]/60 p-8 text-center text-sm text-[#777A80] font-serif-hand italic">
                No clues recorded yet. Examine objects around the house to uncover what happened here.
              </div>
            ) : (
              clues.map((cid) => {
                const clue = CLUE_DEFINITIONS[cid];
                return (
                  <div
                    key={cid}
                    className="border border-[#777A80]/30 bg-[#090A0D]/75 p-4 flex items-start justify-between gap-4"
                  >
                    <div className="flex items-start gap-3">
                      <FileText className="w-4 h-4 text-[#A8B6C8] mt-0.5 shrink-0" />
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-semibold text-[#E7E5E1]">{clue.title}</h3>
                          <span className="text-[10px] font-mono-tech uppercase text-[#777A80]">
                            · {clue.source}
                          </span>
                        </div>
                        <p className="text-xs text-[#A8B6C8]/85 mt-1 leading-relaxed">{clue.detail}</p>
                      </div>
                    </div>
                    {cid === 'photo_back_message' && (
                      <div className="p-2 border border-[#514235] bg-[#17191D] text-[#E7E5E1] shrink-0">
                        <PuzzleSymbolSvg symbol="tri_moon" className="w-8 h-8" />
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
};
