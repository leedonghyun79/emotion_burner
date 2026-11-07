import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import './Home.css';

export default function Onboarding() {
  const navigate = useNavigate();
  const { completeOnboarding } = useApp();

  useEffect(() => {
    document.title = '감정소각장';
  }, []);

  const handleStart = () => {
    completeOnboarding('사용자');
    navigate('/', { replace: true });
  };

  return (
    <div className="stage" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%', padding: '20px 0' }}>
        <div className="eyebrow" style={{ marginBottom: 12 }}>EMOTION BURNER</div>

        <img
          src="https://static.toss.im/appsintoss/13599/a4bcaf19-fc5b-4761-aa58-5fcc6e0a57dd.png"
          alt="감정소각장 로고"
          style={{ width: '160px', height: '160px', objectFit: 'contain', marginBottom: '24px' }}
        />

        <h1 className="title-text" style={{ fontSize: '32px', marginBottom: '16px', lineHeight: 1.2 }}>
          내 안의 감정들을<br />
          <span style={{ color: 'var(--ember)' }}>모두 태워버리세요</span>
        </h1>

        <p style={{ fontSize: '15px', color: 'var(--cream-dim)', textAlign: 'center', lineHeight: 1.5, margin: 0 }}>
          스트레스, 고민, 화나는 일...<br />
          감정소각장에 버리고 보상을 받아가세요.
        </p>
      </div>

      <div style={{ width: '100%', maxWidth: '400px', paddingBottom: '24px', flexShrink: 0 }}>
        <button className="action-btn soft-ember" onClick={handleStart}>
          시작하기
        </button>
      </div>
    </div>
  );
}
