import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // frontend/.env 파일 전체 로드 (VITE_ 접두사 없는 것도 포함)
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],
    resolve: {
      alias: { '@': '/src' },
    },
    server: {
      port: parseInt(env.VITE_DEV_PORT) || 4000,
      proxy: {
        '/api': `http://localhost:${env.BACKEND_PORT || 5000}`,
      },
    },
  };
});
