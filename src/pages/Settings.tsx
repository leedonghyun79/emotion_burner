import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useAuthContext } from '../context/AuthContext';

export default function Settings() {
  const navigate = useNavigate();
  const { resetApp } = useApp();
  const { logout, loading: authLoading } = useAuthContext();

  useEffect(() => {
    // 네이티브 헤더 타이틀 설정
    document.title = '설정';
  }, []);

  const handleLogout = async () => {
    if (authLoading) return;

    if (window.confirm('로그아웃 하시겠습니까?')) {
      try {
        // 1. 서버 로그아웃 호출
        await logout();

        // 2. 앱 전역 상태 및 LocalStorage 초기화
        resetApp();

        // 3. 온보딩 화면으로 이동
        window.location.href = '/';
      } catch (e) {
        console.error('Logout failed:', e);
        // 에러가 나더라도 강제 초기화
        resetApp();
        window.location.href = '/';
      }
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* 설정 목록 */}
      <div className="pt-4">
        <button
          onClick={() => navigate(-1)}
          className="px-6 py-4 text-[#8B95A1] flex items-center gap-1 active:opacity-60 transition-opacity"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          뒤로가기
        </button>

        <button
          onClick={handleLogout}
          className="w-full px-6 py-5 flex items-center justify-between active:bg-gray-50 transition-colors"
        >
          <span className="text-[17px] font-medium text-[#333D4B]">로그아웃</span>
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M9 5L16 12L9 19"
              stroke="#B0B8C1"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        {/* 구분선 */}
        <div className="mx-6 h-[1px] bg-[#F2F4F6]" />

        <div className="px-6 py-8">
          <p className="text-[13px] text-[#8B95A1] leading-relaxed">
            서비스 이용 중 불편한 점이 있으시면<br />
            help@example.com으로 문의해 주세요.
          </p>
          <p className="mt-4 text-[12px] text-[#B0B8C1]">
            버전 1.0.0
          </p>
        </div>
      </div>
    </div>
  );
}
