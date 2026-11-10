import React, { useState } from 'react';
import { CrmLead, CrmProfile } from '../types/crm';
import { uploadPosProof } from '../lib/supabase';
import { Camera, X, UploadCloud, CheckCircle, Wrench, AlertCircle } from 'lucide-react';

interface PosProofModalProps {
  lead: CrmLead | null;
  onClose: () => void;
  onSuccess: () => void;
  currentProfile: CrmProfile | null;
}

export const PosProofModal: React.FC<PosProofModalProps> = ({
  lead,
  onClose,
  onSuccess,
  currentProfile
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [terminalModel, setTerminalModel] = useState<string>('Sunmi V2s POS Terminal');
  const [notes, setNotes] = useState<string>('Tested paper roll and printed test slip. Ready for operations.');
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  if (!lead) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      setFile(selected);
      setPreviewUrl(URL.createObjectURL(selected));
      setError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError("Please attach or capture a photo of the installed POS terminal");
      return;
    }

    setIsUploading(true);
    setError(null);

    const uploader = currentProfile?.name || 'Oleksandr Filippov';
    const proof = await uploadPosProof(lead.id, file, uploader, notes, terminalModel);

    setIsUploading(false);
    if (proof) {
      onSuccess();
      onClose();
    } else {
      setError("Failed to upload photo to Supabase Storage. Please try again.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-850">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-orange-500/20 text-orange-400 border border-orange-500/30 flex items-center justify-center">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-white">Attach POS Installation Proof</h3>
              <p className="text-[11px] text-slate-400">Restaurant: {lead.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="bg-rose-950/80 border border-rose-500/40 text-rose-300 text-xs p-3 rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Photo Preview / Upload Area */}
          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1.5">
              Counter Photo Proof (Sunmi Terminal on counter):
            </label>
            <div className="border-2 border-dashed border-slate-700 hover:border-orange-500 rounded-xl p-4 text-center bg-slate-950/40 transition-colors relative">
              {previewUrl ? (
                <div className="relative">
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="max-h-48 mx-auto rounded-lg object-contain shadow-md"
                  />
                  <button
                    type="button"
                    onClick={() => { setFile(null); setPreviewUrl(null); }}
                    className="absolute top-2 right-2 bg-black/70 text-white rounded-full p-1 text-xs hover:bg-rose-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <label className="cursor-pointer block py-6">
                  <UploadCloud className="w-10 h-10 text-orange-400 mx-auto mb-2" />
                  <span className="text-xs font-bold text-white block">
                    Click to upload photo or take camera picture
                  </span>
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    PNG, JPG, or HEIC up to 10MB
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                POS Hardware Model:
              </label>
              <select
                value={terminalModel}
                onChange={(e) => setTerminalModel(e.target.value)}
                className="w-full bg-slate-800 text-xs text-slate-200 border border-slate-700 rounded-xl px-3 py-2 focus:ring-1 focus:ring-orange-500 focus:outline-none"
              >
                <option value="Sunmi V2s POS Terminal">Sunmi V2s (Mobile)</option>
                <option value="Sunmi T2 Lite (Counter)">Sunmi T2 Lite (Counter)</option>
                <option value="Sunmi D2s Plus (Dual Screen)">Sunmi D2s Plus (Dual Screen)</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Verified Installer:
              </label>
              <input
                type="text"
                disabled
                value={currentProfile?.name || 'Oleksandr Filippov'}
                className="w-full bg-slate-800/50 text-xs text-slate-400 border border-slate-700/60 rounded-xl px-3 py-2"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Installation Notes & Verification:
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-slate-800 text-xs text-slate-200 border border-slate-700 rounded-xl p-3 focus:ring-1 focus:ring-orange-500 focus:outline-none"
              placeholder="e.g. WiFi connected, printed test receipt, owner trained on Orderpad"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isUploading}
              className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-extrabold text-xs py-2.5 px-5 rounded-xl shadow-lg shadow-orange-500/25 transition-all flex items-center gap-1.5"
            >
              <CheckCircle className="w-4 h-4" />
              {isUploading ? 'Uploading Proof...' : 'Save Proof & Mark Ready'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
