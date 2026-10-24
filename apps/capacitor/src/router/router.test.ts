// @vitest-environment happy-dom
import { describe, expect, it, vi } from 'vitest';
import { Router } from './router';
import type { Route, RouteAuth } from './router';

function setup(initiallyLoggedIn = false) {
  const container = document.createElement('div');
  const state = { loggedIn: initiallyLoggedIn };
  const cleanups: Record<string, ReturnType<typeof vi.fn>> = {};
  const mounted: { path: string; state: Record<string, unknown> }[] = [];

  const make = (path: string, auth: RouteAuth): Route => ({
    path,
    auth,
    mount: (el, ctx) => {
      mounted.push({ path, state: { ...ctx.state } });
      el.textContent = path;
      const cleanup = vi.fn();
      cleanups[path] = cleanup;
      return cleanup;
    },
  });

  const router = new Router({
    container,
    routes: [
      make('/login', 'guest'),
      make('/home', 'required'),
      make('/detail', 'required'),
      make('/log', 'public'),
    ],
    isLoggedIn: () => state.loggedIn,
    loginPath: '/login',
    homePath: '/home',
  });
  return { router, container, state, cleanups, mounted };
}

describe('Router: navigasi dasar', () => {
  it('reset memasang layar dan mengosongkan riwayat', () => {
    const { router, container } = setup(true);
    router.reset('/home');
    expect(container.textContent).toBe('/home');
    expect(router.currentPath()).toBe('/home');
    expect(router.canGoBack()).toBe(false);
  });

  it('navigate menambah riwayat, back kembali dan membersihkan layar yang ditinggalkan', () => {
    const { router, container, cleanups } = setup(true);
    router.reset('/home');
    router.navigate('/log');
    expect(container.textContent).toBe('/log');
    expect(router.canGoBack()).toBe(true);
    expect(cleanups['/home']).toHaveBeenCalledOnce();

    expect(router.back()).toBe(true);
    expect(container.textContent).toBe('/home');
    expect(cleanups['/log']).toHaveBeenCalledOnce();
  });

  it('back di dasar riwayat mengembalikan false dan tidak mengubah layar', () => {
    const { router, container } = setup(true);
    router.reset('/home');
    expect(router.back()).toBe(false);
    expect(container.textContent).toBe('/home');
  });

  it('navigate ke layar yang sama diabaikan (tap ganda)', () => {
    const { router, mounted } = setup(true);
    router.reset('/home');
    router.navigate('/log');
    router.navigate('/log');
    expect(mounted.filter((m) => m.path === '/log')).toHaveLength(1);
    expect(router.back()).toBe(true);
    expect(router.canGoBack()).toBe(false);
  });

  it('replace mengganti layar tanpa menambah riwayat', () => {
    const { router } = setup(true);
    router.reset('/home');
    router.replace('/log');
    expect(router.currentPath()).toBe('/log');
    expect(router.canGoBack()).toBe(false);
  });

  it('reset membersihkan layar sebelumnya dan membuang riwayat', () => {
    const { router, cleanups } = setup(true);
    router.reset('/home');
    router.navigate('/log');
    router.reset('/home');
    expect(cleanups['/log']).toHaveBeenCalled();
    expect(router.canGoBack()).toBe(false);
  });

  it('state dibawa ke layar tujuan', () => {
    const { router, mounted } = setup(false);
    router.reset('/login', { sessionExpired: true });
    expect(mounted.at(-1)).toEqual({ path: '/login', state: { sessionExpired: true } });
  });
});

describe('Router: guard autentikasi', () => {
  it('layar wajib-login dialihkan ke Login bila belum login', () => {
    const { router } = setup(false);
    router.reset('/home');
    expect(router.currentPath()).toBe('/login');
  });

  it('layar tamu (Login) dialihkan ke Home bila sudah login', () => {
    const { router } = setup(true);
    router.reset('/login');
    expect(router.currentPath()).toBe('/home');
  });

  it('layar publik bisa dibuka tanpa login', () => {
    const { router } = setup(false);
    router.reset('/log');
    expect(router.currentPath()).toBe('/log');
  });

  it('rute tak dikenal dialihkan sesuai status login', () => {
    const guest = setup(false);
    guest.router.reset('/tidak-ada');
    expect(guest.router.currentPath()).toBe('/login');

    const member = setup(true);
    member.router.reset('/tidak-ada');
    expect(member.router.currentPath()).toBe('/home');
  });

  it('alihan guard membuang state milik tujuan asal', () => {
    const { router, mounted } = setup(false);
    router.reset('/home', { rahasia: 'x' });
    expect(mounted.at(-1)).toEqual({ path: '/login', state: {} });
  });

  it('back menilai ulang guard: layar wajib-login diganti Login bila sesi sudah hilang', () => {
    const { router, state } = setup(true);
    router.reset('/home');
    router.navigate('/log');
    state.loggedIn = false;
    router.back();
    expect(router.currentPath()).toBe('/login');
  });
});

describe('Router: ketahanan', () => {
  it('navigasi di dalam mount menggantikan layar lama dan tidak membocorkan pembersih', () => {
    const container = document.createElement('div');
    const firstCleanup = vi.fn();
    const secondCleanup = vi.fn();
    const router: Router = new Router({
      container,
      routes: [
        {
          path: '/login',
          auth: 'public',
          mount: (el, ctx) => {
            ctx.router.navigate('/home');
            el.textContent = 'login';
            return firstCleanup;
          },
        },
        { path: '/home', auth: 'public', mount: () => secondCleanup },
      ],
      isLoggedIn: () => false,
      loginPath: '/login',
      homePath: '/home',
    });
    router.reset('/login');
    expect(router.currentPath()).toBe('/home');
    expect(firstCleanup).toHaveBeenCalledOnce();
    expect(secondCleanup).not.toHaveBeenCalled();
  });

  it('menolak rute ganda dan tujuan alihan yang tidak terdaftar', () => {
    const container = document.createElement('div');
    const route: Route = { path: '/a', auth: 'public', mount: () => () => undefined };
    expect(
      () =>
        new Router({
          container,
          routes: [route, route],
          isLoggedIn: () => false,
          loginPath: '/a',
          homePath: '/a',
        })
    ).toThrow('Rute ganda');
    expect(
      () =>
        new Router({
          container,
          routes: [route],
          isLoggedIn: () => false,
          loginPath: '/a',
          homePath: '/b',
        })
    ).toThrow('tidak terdaftar');
  });
});
