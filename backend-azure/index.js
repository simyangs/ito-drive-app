require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const { google } = require('googleapis');
const path = require('path');
const app = express();
const ORIGIN_URL = process.env.ORIGIN_URL || 'http://localhost:3000';


console.log(`ORIGIN_URL: [${ORIGIN_URL}]`);

// === 미들웨어 설정 ===
app.use(cors({
  origin: ORIGIN_URL.trim(), // 프론트엔드 주소 (Vite 기본 포트)
  credentials: true, // 쿠키 주고받기 허용 (필수)
}));
app.use(cookieParser()); // 쿠키 파싱 미들웨어
app.use(express.json());

// === Google OAuth2 클라이언트 설정 ===
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  'postmessage' // React useGoogleLogin flow: 'auth-code' 사용 시 리다이렉트 URI 대신 사용
);

// ==========================================
// 1. 로그인 & 토큰 교환 API
// ==========================================
app.post('/api/auth/google', async (req, res) => {
  try {
    const { code } = req.body; // 프론트에서 보낸 인증 코드

    // 1. 코드를 토큰으로 교환
    const { tokens } = await oauth2Client.getToken(code);
    
    // 2. 리프레시 토큰이 왔는지 확인 (첫 로그인 시에만 옴)
    if (tokens.refresh_token) {
      console.log('Refresh Token to use:', tokens.refresh_token);
      // 3. 리프레시 토큰을 쿠키에 저장 (보안 옵션 필수)
      const isProd = process.env.NODE_ENV === 'production';
      res.cookie('refreshToken', tokens.refresh_token, {
        httpOnly: true,  // 자바스크립트로 접근 불가 (XSS 방지)
        secure: isProd,  // 배포 시(HTTPS) 필수
        sameSite: isProd ? 'none' : 'lax', // 크로스 도메인 쿠키 전송을 위해 배포 시 'none' 필요
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30일
        path: '/',
      });
      console.log('Refresh Token 쿠키 설정 완료');
    }

    // 4. 액세스 토큰은 바로 사용하도록 응답으로 전송
    res.json({
      accessToken: tokens.access_token,
      user: {
        // 필요하다면 여기서 id_token을 디코딩해서 유저 정보를 같이 보내줄 수 있음
        // name: ..., email: ...
      }
    });

  } catch (error) {
    console.error('로그인 에러:', error);
    res.status(500).json({ error: '로그인 처리에 실패했습니다.' });
  }
});

// ==========================================
// 2. 토큰 갱신 API (액세스 토큰 만료 시 호출)
// ==========================================
app.post('/api/auth/refresh', async (req, res) => {
  try {
    // 1. 쿠키에서 리프레시 토큰 꺼내기
    const refreshToken = req.cookies.refreshToken;
    
    if (!refreshToken) {
      return res.status(401).json({ error: '로그인이 필요합니다.' });
    }

    // 2. Google API 클라이언트에 리프레시 토큰 설정
    oauth2Client.setCredentials({ refresh_token: refreshToken });

    // 3. 액세스 토큰 재발급 요청
    const { credentials } = await oauth2Client.refreshAccessToken();

    // 4. 새 액세스 토큰 응답
    console.log('액세스 토큰 갱신 성공');
    res.json({ accessToken: credentials.access_token });

  } catch (error) {
    console.error('토큰 갱신 실패:', error);
    res.status(401).json({ error: '토큰 갱신 실패. 다시 로그인하세요.' });
  }
});

// ==========================================
// 3. 로그아웃 API
// ==========================================
app.post('/api/auth/logout', (req, res) => {
  // 쿠키 삭제
  res.clearCookie('refreshToken');
  res.json({ message: '로그아웃 되었습니다.' });
});


app.post('/api/drive/files', async(req, res)=>{
  try{
    
    const authHeader = req.headers.authorization;
    if(!authHeader){
      return res.status(401).json({error: '토큰이 없음'});
    }

    const accessToken = authHeader.split(' ')[1];
    oauth2Client.setCredentials({access_token: accessToken});
    const drive = google.drive({version: 'v3', auth: oauth2Client});
    
    const response = await drive.files.list({
      q: req.body.query,
      fields: 'files(id,name,mimeType,webViewLink,iconLink)',
      pageSize: 1000,
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
      orderBy: 'folder,name',
    });

    res.json(response.data.files);
  }catch(error){
    if (error.response && error.response.status === 401) {
      return res.status(401).json({ error: '구글 토큰 만료됨' });
    }
    console.log(error);
    res.status(500).json({ error: '파일 목록을 가져오지 못했습니다.' });
  }
});

app.post('/api/drive/downloadFile', async(req, res)=>{
  try{
    const {fileId} = req.body;
    const authHeader = req.headers.authorization;
    if(!authHeader){
      return res.status(401).json({error: '토큰이 없음'});
    }

    const accessToken = authHeader.split(' ')[1];
    oauth2Client.setCredentials({access_token: accessToken});
    const drive = google.drive({version: 'v3', auth: oauth2Client});
    
    const fileMeta = await drive.files.get({
      fileId: fileId,
      fields: 'name, size, mimeType',
      supportsAllDrives: true
    });
    
    const fileName = encodeURIComponent(fileMeta.data.name);

    if (fileMeta.data.mimeType.includes('application/vnd.google-apps')) {
       return res.status(400).json({ error: '구글 오피스 파일은 export 기능을 써야 합니다.' });
    }

    // 3. 파일 스트림 요청 (alt: 'media')
    const response = await drive.files.get(
      { fileId: fileId, alt: 'media' },
      { responseType: 'stream' } // ⭐ 핵심: 스트림으로 받기
    );
    
    // 4. 응답 헤더 설정 (브라우저가 다운로드로 인식하게 함)
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${fileName}`);
    res.setHeader('Content-Type', fileMeta.data.mimeType);
    res.setHeader('Content-Length', fileMeta.data.size);

    // 5. 구글 -> Express -> 클라이언트 (파이프 연결)
    response.data.pipe(res);
  }catch(error){
    if (error.response && error.response.status === 401) {
      return res.status(401).json({ error: '구글 토큰 만료됨' });
    }
    console.log(error);
    res.status(500).json({ error: '파일 다운로드 실패' });
  }
});

//app.use(express.static(path.join(__dirname, '/static')));
const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`CORS allowed for: ${ORIGIN_URL}`);
});

module.exports = app;