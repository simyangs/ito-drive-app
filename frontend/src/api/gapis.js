
import axios from 'axios';
import { useAuthStore } from '../store/authStore';
const TOKEN_STORAGE_KEY = 'google-drive-app-token';

const apiClient = axios.create({
  baseURL: '/api',
  withCredentials: true,
});

apiClient.interceptors.request.use(
  (config)=>{
    const accessToken = useAuthStore.getState().accessToken;
    
    if(accessToken){
      config.headers['Authorization'] = `Bearer ${accessToken}`;
    }else{
      console.log('토큰없음');
      useAuthStore.getState().logout();
    }
    return config;
  },
  (error)=> {
    console.log(error);
    Promise.reject(error);
  }
);

apiClient.interceptors.response.use(
  (response)=> {
    return response;
  },
  async(error)=>{
    const originalRequest = error.config;
    if(error.response?.status === 401 && originalRequest?._retry != true){
      
      originalRequest._retry = true;

      try{
        console.log('토큰만료 재발급 시도');

        const {data} = await axios.post(
          '/api/auth/refresh',
          {},
          {withCredentials: true}
        );

        const newAccessToken = data.accessToken;

        useAuthStore.getState().setAccessToken(newAccessToken);

        originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
        apiClient.defaults.headers.common['Authorization'] = `Bearer ${newAccessToken}`;

        return apiClient(originalRequest);
      }catch(refreshError){
        console.error('리프레시 토큰도 만료됨. 로그아웃 필요.');

        useAuthStore.getState().logout();
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export const googleLogin = async(code)=>{
  return await apiClient.post('/auth/google', {code});


}

export const refreshToken = async()=>{
  return await apiClient.post('/auth/refresh');
}

export const getFiles = async(query) =>{
    return await apiClient.post('/drive/files', {query});
    
}

export const downloadFile = async(fileId, fileName) =>{
    const response = await apiClient.post('/drive/downloadFile',
      {fileId: fileId},
      {responseType: 'blob'});

    const blob = new Blob([response.data]);
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
}

export const revokeToken = async()=>{
  return await apiClient.post('/auth/revoke');
}