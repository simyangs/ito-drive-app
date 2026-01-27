import React from 'react';
import { useGoogleLogin, hasGrantedAllScopesGoogle } from '@react-oauth/google';
import { LogIn, Database, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/authStore';
import {googleLogin} from '../api/gapis';

function LoginPage({ onLoginSuccess }) {
  const login = useGoogleLogin({
    flow: 'auth-code',
    scope: 'https://www.googleapis.com/auth/drive.readonly',
    onSuccess: async(codeResponse) => {
      console.log('Login Success:', codeResponse);
      
      // 필수 권한 체크
      // codeResponse.scope는 사용자가 허용한 스코프 문자열을 포함합니다.
      // 주의: flow: 'auth-code'일 때는 codeResponse에 scope가 포함되어 오는지 확인해야 합니다.
      // 라이브러리 버전에 따라 동작이 다를 수 있으나, 보통 hasGrantedAllScopesGoogle를 사용할 수 있습니다.
      // 하지만 auth-code flow에서는 직접 토큰 교환 전이라 프론트엔드에서 scope 문자열 확인이 가장 확실합니다.
      
      const hasDriveScope = codeResponse.scope && codeResponse.scope.includes('drive.readonly');
      
      if (!hasDriveScope) {
        console.warn('필수 권한(drive.readonly)이 누락되었습니다.', codeResponse.scope);
        toast.error('파일 조회 권한이 필수입니다.\n로그인 시 모든 권한을 허용해주세요.', {
          duration: 5000,
          icon: '🚫',
        });
        return;
      }

      const loadingToast = toast.loading('로그인 처리 중...');

      try {
        const {data} = await googleLogin(codeResponse.code);
        useAuthStore.getState().setAccessToken(data.accessToken);
        toast.success('로그인 성공!', { id: loadingToast });
        onLoginSuccess(data);
      } catch (error) {
        console.error('Login Process Error:', error);
        toast.error('로그인 처리 중 오류가 발생했습니다.', { id: loadingToast });
      }

    },
    onError: () => {
      console.error('Login Failed');
      toast.error('구글 로그인에 실패했습니다.');
    },
  });

  return (
    <div className="relative flex items-center justify-center min-h-screen bg-gray-900 overflow-hidden">
        {/* 배경 장식 (은은한 빛 효과) */}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/10 rounded-full blur-[120px]"></div>

        <div className="relative z-10 w-full max-w-md p-8 mx-4 bg-gray-800 border border-gray-700 shadow-2xl rounded-2xl">
            <div className="flex flex-col items-center text-center">
                {/* 로고 아이콘 */}
                <div className="p-4 mb-6 bg-blue-500/10 rounded-2xl border border-blue-500/20">
                    <Database size={48} className="text-blue-500" />
                </div>
                
                <h1 className="mb-2 text-3xl font-extrabold text-white tracking-tight">
                    ITO Drive
                </h1>
                
                <p className="mb-8 text-gray-400 leading-relaxed">
                    프로젝트 방법론 및 공유 자산을<br />
                    안전하게 확인하고 다운로드하세요.
                </p>
                
                <div className="w-full space-y-4">
                    <button 
                        onClick={() => login()}
                        className="flex items-center justify-center w-full px-6 py-3.5 text-base font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-500 transform transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-blue-600/20"
                    >
                        <LogIn size={20} className="mr-3" />
                        Google 계정으로 로그인
                    </button>
                    
                    <div className="flex items-center justify-center gap-2 text-xs text-gray-500 pt-4">
                        <ShieldCheck size={14} />
                        <span>Google Drive Read-only 권한만 사용합니다.</span>
                    </div>
                </div>
            </div>
        </div>
        
        {/* 하단 푸터 (선택 사항) */}
        <div className="absolute bottom-6 text-sm text-gray-600">
            © 2026 ITO Project Team. All rights reserved.
        </div>
    </div>
  );
}

export default LoginPage;
