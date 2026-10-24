import './index.css';
import { installGlobalErrorHandlers } from './logging/logger';
import { installBackButton } from './router/androidBackButton';
import { Router } from './router/router';
import { BACK_LOCKED_PATHS, PATHS, routes } from './routes';
import { logger, session, setUnauthorizedListener } from './services';

const root = document.getElementById('root');
if (!root) throw new Error('Elemen #root tidak ditemukan');

installGlobalErrorHandlers(logger);

const router = new Router({
  container: root,
  routes,
  isLoggedIn: () => session.isLoggedIn(),
  loginPath: PATHS.login,
  homePath: PATHS.home,
});

// Server menolak token (401): sesi sudah dibersihkan oleh apiClient. Beberapa
// request paralel bisa menerima 401 bersamaan, jadi hanya yang pertama berpindah
// layar. Di Login/Logout tidak ada yang perlu dialihkan.
setUnauthorizedListener(() => {
  const current = router.currentPath();
  if (current === PATHS.login || current === PATHS.logout) return;
  logger.info('Session', 'Token ditolak server (401), kembali ke Login');
  router.reset(PATHS.login, { sessionExpired: true });
});

installBackButton(router, BACK_LOCKED_PATHS).catch((error: unknown) => {
  logger.error('Router', 'Gagal memasang tombol Back', error);
});

router.reset(PATHS.splash);
