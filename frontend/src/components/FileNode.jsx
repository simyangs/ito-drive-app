import React, { useState, useEffect } from 'react';
import FileTree from './FileTree';
import { Folder, File, Download, ExternalLink, Eye } from 'lucide-react';
import toast from 'react-hot-toast';
import { getFiles, downloadFile } from '../api/gapis'
import { useUiStore } from '../store/uiStore';
import { FileListSkeleton } from './FileSkeleton';

function FileNode({ node }) {
  const [isOpen, setIsOpen] = useState(false);
  const [children, setChildren] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const setPreviewFile = useUiStore((state) => state.setPreviewFile);

  const isFolder = node.mimeType === 'application/vnd.google-apps.folder';

  const handleToggle = () => {
    if (isFolder) {
      setIsOpen(!isOpen);
    }
  };

  useEffect(() => {
    // 폴더이고, 열려있고, 아직 자식 노드를 불러오지 않았다면 API 호출
    if (isFolder && isOpen && children.length === 0) {
      const fetchChildren = async () => {
        setIsLoading(true);
        // 부모 ID를 기준으로 쿼리
        const query = `'${node.id}' in parents and trashed=false`;

        try {
          const {data} = await getFiles(query);
          setChildren(data);
        } catch (error) {
          console.error("Failed to fetch folder contents:", error);
          toast.error("폴더 내용을 불러오는데 실패했습니다.");
        } finally {
          setIsLoading(false);
        }
      };
      fetchChildren();
    }
  }, [isOpen, isFolder, node.id, children.length]);

  const handleDblClick = (e) => {
    e.stopPropagation();
    if (!isFolder) {
        setPreviewFile(node);
    } else {
        handleToggle(); // 폴더 더블클릭 시 토글
    }
  }

  const handlePreview = (e) => {
    e.stopPropagation();
    setPreviewFile(node);
  }

  const handleDownload = async (e) => {
    e.stopPropagation(); 
    if (isFolder) return;

    const toastId = toast.loading(`${node.name} 다운로드 시작...`);
    try {
      await downloadFile(node.id, node.name);
      toast.success(`${node.name} 다운로드 완료!`, { id: toastId });
    } catch (error) {
      console.error("Download failed:", error);
      toast.error(`${node.name} 다운로드 실패.`, { id: toastId });
    }
  };

  return (
    <div className="ml-5 py-0.5">
        <div 
            onClick={handleToggle}
            onDoubleClick={handleDblClick}
            className={`group flex items-center gap-2 p-1.5 rounded transition-colors duration-200 ${
            isFolder ? 'cursor-pointer hover:bg-gray-800' : 'cursor-default hover:bg-gray-800/50'
            }`}
        >
            {isFolder ? (
            <Folder size={16} className="text-yellow-500 fill-yellow-500/20" />
            ) : (
            <File size={16} className="text-blue-400" />
            )}
            
            <span className="text-gray-300 truncate select-none group-hover:text-white transition-colors flex-1">
            {node.name}
            </span>

            {!isFolder && (
            <div className="flex items-center gap-1 ml-auto opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <button 
                onClick={handlePreview} 
                title="미리보기" 
                className="p-1 text-gray-400 rounded hover:text-white hover:bg-gray-700"
                >
                <Eye size={16} />
                </button>
                <button 
                onClick={handleDownload} 
                title="다운로드" 
                className="p-1 text-gray-400 rounded hover:text-white hover:bg-gray-700"
                >
                <Download size={16} />
                </button>
                <a 
                href={node.webViewLink} 
                target="_blank" 
                rel="noopener noreferrer" 
                title="새 탭에서 보기" 
                onClick={e => e.stopPropagation()}
                className="p-1 text-gray-400 rounded hover:text-white hover:bg-gray-700"
                >
                <ExternalLink size={16} />
                </a>
            </div>
            )}
        </div>

        {isOpen && (
            isLoading 
            ? <div className="ml-5"><FileListSkeleton count={3} /></div>
            : <FileTree nodes={children} />
        )}
    </div>
  );
}

export default FileNode;
