import { mountCatalog } from './screens/catalog';
import { mountCrashLog } from './screens/crashLog';
import { mountHome } from './screens/home';
import { mountLogin } from './screens/login';
import { mountLogout } from './screens/logout';
import { mountSplash } from './screens/splash';
import { authService, launchService, logger, session } from './services';
import type { Route } from './router/router';

export const PATHS = {
  splash: '/splash',
  login: '/login',
  home: '/home',
  logout: '/logout',
  crashLog: '/crashlog',
  catalog: '/katalog',
} as const;

/** Layar yang mengabaikan tombol Back: sedang memproses dan tidak boleh dibatalkan. */
export const BACK_LOCKED_PATHS: readonly string[] = [PATHS.splash, PATHS.logout];

export const routes: Route[] = [
  {
    path: PATHS.splash,
    auth: 'public',
    mount: (container, { router }) =>
      mountSplash(container, {
        resolveDestination: () => launchService.resolveStartDestination(),
        onFinished: (path) => {
          router.reset(path);
        },
      }),
  },
  {
    path: PATHS.login,
    auth: 'guest',
    mount: (container, { router, state }) =>
      mountLogin(container, {
        signIn: (params) => authService.signIn(params),
        loadBiometricState: () => launchService.getBiometricLoginState(),
        signInWithBiometric: () => launchService.signInWithBiometric(),
        sessionExpired: state.sessionExpired === true,
        // reset: Back dari Home keluar dari app, bukan kembali ke Login.
        onSignedIn: () => {
          router.reset(PATHS.home);
        },
      }),
  },
  {
    path: PATHS.home,
    auth: 'required',
    mount: (container, { router }) =>
      mountHome(container, {
        fullName: session.fullName,
        onOpenCrashLog: () => {
          router.navigate(PATHS.crashLog);
        },
        onOpenCatalog: () => {
          router.navigate(PATHS.catalog);
        },
        onLogout: () => {
          router.reset(PATHS.logout);
        },
      }),
  },
  {
    // Public agar idempotent: sesi sudah bersih saat layar ini dipasang ulang.
    path: PATHS.logout,
    auth: 'public',
    mount: (container, { router }) =>
      mountLogout(container, {
        signOut: () => authService.signOut(),
        onDone: () => {
          router.reset(PATHS.login);
        },
        onError: (error) => {
          logger.error('Logout', 'Gagal menghapus sesi tersimpan', error);
        },
      }),
  },
  {
    path: PATHS.crashLog,
    auth: 'public',
    mount: (container, { router }) =>
      mountCrashLog(container, {
        readLog: () => logger.read(),
        clearLog: () => logger.clear(),
        onBack: () => {
          router.back();
        },
      }),
  },
  {
    // Rute pengembangan (katalog komponen Fase 3).
    path: PATHS.catalog,
    auth: 'public',
    mount: (container, { router }) =>
      mountCatalog(container, {
        onOpenCrashLog: () => {
          router.navigate(PATHS.crashLog);
        },
        onBack: () => {
          router.back();
        },
      }),
  },
];
