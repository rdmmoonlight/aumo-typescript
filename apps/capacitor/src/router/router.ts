// Router satu-Activity untuk app Capacitor. Riwayat disimpan di memori (bukan
// history browser): WebView Capacitor tidak punya bilah alamat, dan tombol Back
// Android ditangani eksplisit lewat androidBackButton.ts.

export type Cleanup = () => void;

/**
 * - required: wajib login; belum login dialihkan ke loginPath
 * - guest: hanya untuk yang belum login; sudah login dialihkan ke homePath
 * - public: bebas
 */
export type RouteAuth = 'required' | 'guest' | 'public';

/** Data kecil yang dibawa saat berpindah layar (mis. sessionExpired). */
export type RouteState = Readonly<Record<string, string | number | boolean>>;

export interface RouteContext {
  readonly path: string;
  readonly state: RouteState;
  readonly router: Router;
}

export interface Route {
  path: string;
  auth: RouteAuth;
  /** Menggambar layar ke container dan mengembalikan fungsi pembersih. */
  mount: (container: HTMLElement, context: RouteContext) => Cleanup;
}

export interface RouterOptions {
  container: HTMLElement;
  routes: readonly Route[];
  isLoggedIn: () => boolean;
  loginPath: string;
  homePath: string;
}

interface Entry {
  path: string;
  state: RouteState;
}

export class Router {
  private readonly options: RouterOptions;
  private readonly routes = new Map<string, Route>();
  private stack: Entry[] = [];
  private cleanup: Cleanup | null = null;
  private renderId = 0;

  constructor(options: RouterOptions) {
    this.options = options;
    for (const route of options.routes) {
      if (this.routes.has(route.path)) throw new Error(`Rute ganda: ${route.path}`);
      this.routes.set(route.path, route);
    }
    for (const path of [options.loginPath, options.homePath]) {
      if (!this.routes.has(path)) throw new Error(`Rute tujuan alihan tidak terdaftar: ${path}`);
    }
  }

  currentPath(): string | null {
    return this.stack.at(-1)?.path ?? null;
  }

  canGoBack(): boolean {
    return this.stack.length > 1;
  }

  /** Buka layar baru di atas layar saat ini. Navigasi ke layar yang sama diabaikan (tap ganda). */
  navigate(path: string, state: RouteState = {}): void {
    const target = this.resolve({ path, state });
    if (target.path === this.currentPath()) return;
    this.stack.push(target);
    this.render();
  }

  /** Ganti layar saat ini tanpa menambah riwayat. */
  replace(path: string, state: RouteState = {}): void {
    const target = this.resolve({ path, state });
    this.stack.pop();
    this.stack.push(target);
    this.render();
  }

  /** Kosongkan seluruh riwayat lalu buka layar (padanan FLAG_ACTIVITY_CLEAR_TASK). */
  reset(path: string, state: RouteState = {}): void {
    this.stack = [this.resolve({ path, state })];
    this.render();
  }

  /** Kembali satu layar. false bila sudah di dasar riwayat. */
  back(): boolean {
    if (!this.canGoBack()) return false;
    this.stack.pop();
    const previous = this.stack.at(-1);
    if (previous) {
      // Status login bisa berubah sejak layar itu dibuka, jadi guard dinilai ulang.
      this.stack[this.stack.length - 1] = this.resolve(previous);
    }
    this.render();
    return true;
  }

  private resolve(entry: Entry): Entry {
    const { loginPath, homePath, isLoggedIn } = this.options;
    const route = this.routes.get(entry.path);
    const loggedIn = isLoggedIn();
    if (!route) return { path: loggedIn ? homePath : loginPath, state: {} };
    if (route.auth === 'required' && !loggedIn) return { path: loginPath, state: {} };
    if (route.auth === 'guest' && loggedIn) return { path: homePath, state: {} };
    return entry;
  }

  private render(): void {
    this.cleanup?.();
    this.cleanup = null;

    const entry = this.stack.at(-1);
    const route = entry ? this.routes.get(entry.path) : undefined;
    if (!entry || !route) return;

    this.renderId += 1;
    const id = this.renderId;
    this.options.container.replaceChildren();
    const cleanup = route.mount(this.options.container, {
      path: entry.path,
      state: entry.state,
      router: this,
    });
    // Layar yang berpindah saat mount sudah digantikan oleh render yang lebih baru.
    if (id !== this.renderId) {
      cleanup();
      return;
    }
    this.cleanup = cleanup;
  }
}
