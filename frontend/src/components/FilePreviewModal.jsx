import React from 'react';
import { X, ExternalLink, Download } from 'lucide-react';
import { useUiStore } from '../store/uiStore';
import { downloadFile } from '../api/gapis';
import toast from 'react-hot-toast';

function FilePreviewModal() {
  const { previewFile, closePreview } = useUiStore();

  if (!previewFile) return null;

  // Google Drive 미리보기 전용 URL 생성
  // webViewLink는 보통 '.../view' 형태이므로 '.../preview'로 변환하거나 ID를 직접 사용
  const previewUrl = `https://drive.google.com/file/d/${previewFile.id}/preview`;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      closePreview();
    }
  };

  const handleDownload = async () => {
      const toastId = toast.loading(`${previewFile.name} 다운로드 시작...`);
      try {
        await downloadFile(previewFile.id, previewFile.name);
        toast.success(`${previewFile.name} 다운로드 완료!`, { id: toastId });
      } catch (error) {
        console.error("Download failed:", error);
        toast.error(`${previewFile.name} 다운로드 실패.`, { id: toastId });
      }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200"
      onClick={handleBackdropClick}
    >
      <div className="relative w-full max-w-5xl h-[85vh] bg-gray-900 rounded-lg shadow-2xl flex flex-col border border-gray-700">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h3 className="text-lg font-semibold text-white truncate pr-4">
            {previewFile.name}
          </h3>
          <div className="flex items-center gap-2">
            <button
                onClick={handleDownload}
                className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
                title="다운로드"
            >
                <Download size={20} />
            </button>
            <a 
              href={previewFile.webViewLink} 
              target="_blank" 
              rel="noopener noreferrer"
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
              title="새 탭에서 열기"
            >
              <ExternalLink size={20} />
            </a>
            <button 
              onClick={closePreview}
              className="p-2 text-gray-400 hover:text-white hover:bg-red-500/20 hover:text-red-400 rounded transition-colors"
              title="닫기"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 bg-gray-800 relative overflow-hidden">
            {/* Google Drive Preview Iframe */}
            <iframe
                src={previewUrl}
                title="File Preview"
                className="w-full h-full border-0"
                allow="autoplay"
            />
        </div>
        
        {/* Footer (Optional info) */}
        <div className="p-3 bg-gray-900 text-xs text-gray-500 border-t border-gray-700 text-center">
             미리보기가 작동하지 않으면 '새 탭에서 열기'를 사용하세요.
        </div>
      </div>
    </div>
  );
}

export default FilePreviewModal;
