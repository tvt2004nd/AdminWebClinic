import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Stethoscope, Lock, Mail } from 'lucide-react';
import styles from './Login.module.css';
import api, { setAuthToken } from '../../services/api';

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    api.post('/api/auth/login', { username: email, password })
      .then((res) => {
        setIsLoading(false);
        const token = res.data.token || res.data.accessToken || res.data.jwt;
        if (token) {
          setAuthToken(token);
        }
        // mark auth for legacy checks in the app
        localStorage.setItem('isAuthenticated', 'true');
        navigate('/dashboard');
      })
      .catch((err) => {
        setIsLoading(false);
        alert(err?.response?.data?.message || 'Đăng nhập thất bại');
      });

    try {
      const res = await fetch('http://localhost:8080/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: email, password }),
      });
      if (!res.ok) {
        const err = await res.text();
        alert(err || 'Đăng nhập thất bại');
        return;
      }
      const data = await res.json();
      localStorage.setItem('auth', JSON.stringify({ token: data.token, roles: data.roles }));
      localStorage.setItem('isAuthenticated', 'true');
      navigate('/dashboard');
    } catch {
      alert('Không thể kết nối máy chủ');
    } finally {
      setIsLoading(false);
    }

  };

  return (
    <div className={styles.loginContainer}>
      <div className={styles.loginCard}>
        <div className={styles.logoContainer}>
          <div className={styles.logoIcon}>
            <Stethoscope size={32} color="white" />
          </div>
          <h1 className={styles.brandName}>DermaCare Admin</h1>
          <p className={styles.subtitle}>Hệ thống quản lý phòng khám da liễu</p>
        </div>

        <form onSubmit={handleLogin} className={styles.form}>
          <div className={styles.inputGroup}>
            <label>Email hoặc Tên đăng nhập</label>
            <div className={styles.inputWrapper}>
              <Mail className={styles.inputIcon} size={20} />
              <input 
                type="text" 
                placeholder="admin@dermacare.vn" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className={styles.inputGroup}>
            <label>Mật khẩu</label>
            <div className={styles.inputWrapper}>
              <Lock className={styles.inputIcon} size={20} />
              <input 
                type="password" 
                placeholder="••••••••" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <div className={styles.options}>
            <label className={styles.checkbox}>
              <input type="checkbox" />
              <span>Ghi nhớ đăng nhập</span>
            </label>
            <a href="#" className={styles.forgotPassword}>Quên mật khẩu?</a>
          </div>

          <button type="submit" className={styles.submitBtn} disabled={isLoading}>
            {isLoading ? 'Đang xử lý...' : 'Đăng nhập'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
