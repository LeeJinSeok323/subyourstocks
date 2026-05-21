import { useNavigate } from 'react-router-dom';
import { FileQuestion, Home } from 'lucide-react';
import './notfound.css';

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="notfound-page">
      <div className="notfound-card">
        <FileQuestion size={52} className="notfound-icon" />
        <h1 className="notfound-code">404</h1>
        <p className="notfound-title">페이지를 찾을 수 없습니다</p>
        <p className="notfound-desc">
          요청하신 주소가 존재하지 않거나 잘못된 경로입니다.
        </p>
        <button className="notfound-btn" onClick={() => navigate('/')}>
          <Home size={15} />
          메인으로 돌아가기
        </button>
      </div>
    </div>
  );
}
