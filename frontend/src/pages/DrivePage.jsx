import React, { useState, useEffect } from 'react';
import FileTree from '../components/FileTree';
import FilePreviewModal from '../components/FilePreviewModal';
import { FileListSkeleton } from '../components/FileSkeleton';
import { LogOut, Search, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { getFiles } from '../api/gapis'

// .env 파일에서 공유 폴더 ID를 가져옵니다.
const FOLDER_ID = import.meta.env.VITE_SHARED_FOLDER_ID || 'root';

function DrivePage({ onLogout }) {
  const [rootFiles, setRootFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');


  useEffect(() => {
    fetchRootFiles();
  }, []);

  const fetchRootFiles = async () => {
    setLoading(true);
    setError(null);
    
    // 루트 폴더 ID를 기준으로 쿼리 생성
    let query = `'${FOLDER_ID}' in parents and trashed=false`;

    if(searchQuery){
        const safeQuery = searchQuery.replace(/'/g, "\\'");
        query += ` and name contains '${safeQuery}'`;
    }

    try {
      const {data} = await getFiles(query);
      setRootFiles(data);
    } catch (err) {
      setError(err.message);
      console.error(err);
      toast.error(`파일 목록 로드 실패: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
      fetchRootFiles();
  }

  return (
    <div className="p-5 flex flex-col h-screen w-[1024px] mx-auto bg-gray-900 text-gray-100">
        {/* 헤더 영역 */}
        <header className="flex items-center justify-between pb-4 border-b border-gray-700 mb-4">
            
            <div className="justify-items-start relative w-xl">
                
                {/* 돋보기 아이콘 */}
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <Search size={20} className="text-gray-400" />
                </div>
                
                {/* 입력 필드 */}
                <input 
                type="text" 
                className="block w-full p-3 pl-10 text-sm text-white border border-gray-600 rounded-lg bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-200 placeholder-gray-400 shadow-sm"
                placeholder="파일 이름 검색..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyUp={(e) => e.keyCode == 13 && handleSearch()}
                />
                
                {/* 초기화 버튼 */}
                {searchQuery && (
                <button 
                    onClick={() => { setSearchQuery(''); fetchRootFiles(); }}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 cursor-pointer"
                >
                    <X size={18} />
                </button>
                )}
                
            </div>
            <button 
            onClick={onLogout}
            className="inline-flex items-center px-3 py-2 text-sm font-medium text-white bg-[#db4437] rounded hover:bg-[#c53929] transition-colors duration-200"
            >
            <LogOut size={18} className="mr-2" />
            로그아웃
            </button>
            
        </header>

        {/* 메인 콘텐츠 영역 */}
        <main className="flex-1 overflow-y-auto custom-scrollbar bg-gray-900 rounded-lg">
            
            {error && (
            <div className="p-4 text-center text-red-400 bg-red-900/20 rounded-lg">
                <p>오류가 발생했습니다: {error}</p>
            </div>
            )}
            
            {loading ? (
                <FileListSkeleton count={6} />
            ) : (
                <FileTree nodes={rootFiles} />
            )}
        </main>
        
        {/* 파일 미리보기 모달 */}
        <FilePreviewModal />
    </div>
  );
}

export default DrivePage;
