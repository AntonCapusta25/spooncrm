import React, { useState } from 'react';
import { CrmLead, CrmProfile } from '../types/crm';
import { uploadPosProof } from '../lib/supabase';
import { Camera, X, UploadCloud, CheckCircle } from 'lucide-react';

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
      setError("Please attach a counter setup photo of the installed POS");
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
      setError("Failed to upload photo to storage. Please try again.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40 backdrop-blur-xs select-none">
      <div className="bg-white border-t sm:border border-[#EDEDEB] rounded-t-2xl sm:rounded-xl w-full max-w-lg max-h-[92dvh] overflow-y-auto shadow-2xl text-[#37352F] pb-safe">
        
        {/* Header */}
        <div className="p-4 border-b border-[#EDEDEB] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">📷</span>
            <div>
              <h3 className="text-sm font-bold text-[#37352F]">Attach POS Installation Proof</h3>
              <p className="text-xs text-[#787774]">{lead.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#787774] hover:text-[#37352F] p-1 rounded hover:bg-[#F7F6F3]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {error && (
            <div className="p-2.5 rounded bg-[#FFE2DD] text-[#D44026] text-xs">
              {error}
            </div>
          )}

          <div>
            <label className="font-semibold text-[#787774] block mb-1">
              Counter Photo Proof (Sunmi on counter):
            </label>
            <div className="border border-dashed border-[#D4D4D0] hover:border-[#37352F] rounded-lg p-4 text-center bg-[#F7F6F3] transition-colors relative">
              {previewUrl ? (
                <div className="relative">
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="max-h-48 mx-auto rounded object-contain shadow-xs"
                  />
                  <button
                    type="button"
                    onClick={() => { setFile(null); setPreviewUrl(null); }}
                    className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1 text-xs hover:bg-black"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <label className="cursor-pointer block py-6">
                  <UploadCloud className="w-8 h-8 text-[#9B9A97] mx-auto mb-1.5" />
                  <span className="font-semibold text-[#37352F] block">
                    Click to choose photo or capture from camera
                  </span>
                  <span className="text-[#9B9A97] text-[11px] mt-0.5 block">
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

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-[#787774] block mb-1">Hardware Model:</label>
              <select
                value={terminalModel}
                onChange={(e) => setTerminalModel(e.target.value)}
                className="w-full bg-[#F7F6F3] text-xs text-[#37352F] border border-[#EDEDEB] rounded-md px-2.5 py-1.5 focus:outline-none"
              >
                <option value="Sunmi V2s POS Terminal">Sunmi V2s</option>
                <option value="Sunmi T2 Lite">Sunmi T2 Lite</option>
                <option value="Sunmi D2s Plus">Sunmi D2s Plus</option>
              </select>
            </div>

            <div>
              <label className="font-semibold text-[#787774] block mb-1">Installer:</label>
              <input
                type="text"
                disabled
                value={currentProfile?.name || 'Oleksandr Filippov'}
                className="w-full bg-[#F7F6F3] text-xs text-[#787774] border border-[#EDEDEB] rounded-md px-2.5 py-1.5"
              />
            </div>
          </div>

          <div>
            <label className="font-semibold text-[#787774] block mb-1">Notes & Setup Verification:</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-[#F7F6F3] text-xs text-[#37352F] border border-[#EDEDEB] rounded-md px-2.5 py-1.5 focus:outline-none"
              placeholder="e.g. WiFi connected, printed test receipt..."
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2 border-t border-[#EDEDEB]">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded text-xs text-[#787774] hover:text-[#37352F] hover:bg-[#F7F6F3]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isUploading}
              className="bg-[#FF5A1F] hover:bg-[#E04B14] text-white font-semibold text-xs py-1.5 px-4 rounded shadow-xs transition-colors"
            >
              {isUploading ? 'Uploading...' : 'Save Proof & Mark Ready'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
