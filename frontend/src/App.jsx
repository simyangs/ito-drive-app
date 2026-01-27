import React, { useState, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import LoginPage from './pages/LoginPage';
import DrivePage from './pages/DrivePage';
import { useAuthStore } from './store/authStore';

const TOKEN_STORAGE_KEY = 'google-drive-app-token';

function App() {
  // 1. localStorage에서 토큰을 읽어와 초기 상태를 설정합니다.
  // const [token, setToken] = useState(() => {
  //   try {
  //     const storedToken = localStorage.getItem(TOKEN_STORAGE_KEY);
  //     return storedToken ? JSON.parse(storedToken) : null;
  //   } catch (error) {
  //     console.error("localStorage에서 토큰을 파싱하는데 실패했습니다.", error);
  //     return null;
  //   }
  // });
  const {accessToken, setAccessToken, logout} = useAuthStore();

  // 2. 토큰 상태가 변경될 때마다 localStorage에 저장합니다.
  // useEffect(() => {
  //   if (!token) {
  //     // 토큰이 null이면 localStorage에서도 제거합니다.
  //     localStorage.removeItem(TOKEN_STORAGE_KEY);
  //   }
  // }, [token]);

  const handleLogin = (token) => {
    console.log('handleLogin', token);
    //localStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(token));
    //setAccessToken(token);
  }

  // 로그아웃 처리 함수
  const handleLogout = () => {
    if (accessToken) {
      google.accounts.oauth2.revoke(accessToken, () => {
        logout();
        //setToken(null); // 상태를 null로 설정하면 useEffect가 실행되어 localStorage도 정리됩니다.
        console.log('Token revoked and cleared from storage');
      });
    }
  };
  console.log(accessToken);
  
  return (
    <>
      <Toaster position="top-right" />
      {!accessToken ? (
        <LoginPage onLoginSuccess={handleLogin} />
      ) : (
        <DrivePage onLogout={handleLogout} />
      )}
    </>
  );
}

export default App;
