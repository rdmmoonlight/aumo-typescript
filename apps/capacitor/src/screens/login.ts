import fingerprintSvg from '@tabler/icons/outline/fingerprint.svg?raw';
import logoUrl from '../assets/images/app_logo.png';
import { createButton, createCheckbox, createIcon, createInput } from '../components/ui';
import { h } from '../core/dom';
import type { SignInParams, SignInResult } from '../auth/authService';
import type { BiometricLoginState, BiometricSignInResult } from '../auth/launchService';

export type SignInFn = (params: SignInParams) => Promise<SignInResult>;

/** Pesan saat server menolak token (SessionExpiredHandler.SESSION_EXPIRED_MESSAGE). */
export const SESSION_EXPIRED_MESSAGE = 'Sesi Anda telah berakhir. Silakan masuk kembali.';
export const REQUIRED_FIELDS_MESSAGE = 'Email dan password wajib diisi.';

export interface LoginDeps {
  signIn: SignInFn;
  loadBiometricState: () => Promise<BiometricLoginState>;
  signInWithBiometric: () => Promise<BiometricSignInResult>;
  /** Layar dibuka karena sesi berakhir (401). */
  sessionExpired: boolean;
  onSignedIn: () => void;
}

/** Layar Login: email, kata sandi, "Ingat saya", dan biometrik (padanan LoginScreen.kt). */
export function mountLogin(container: HTMLElement, deps: LoginDeps): () => void {
  let disposed = false;
  let busy = false;

  const email = createInput({
    label: 'Email',
    type: 'email',
    placeholder: 'admin@email.com',
    autocomplete: 'username',
  });
  const password = createInput({
    label: 'Password',
    type: 'password',
    placeholder: '••••••••',
    autocomplete: 'current-password',
  });
  const keep = createCheckbox({ label: 'Ingat saya di perangkat ini' });
  // Biometrik hanya berguna bila sesi disimpan, jadi memilihnya ikut mencentang "Ingat saya".
  const biometricSetup = createCheckbox({
    label: 'Masuk dengan biometrik lain kali',
    onChange: (checked) => {
      if (checked) keep.input.checked = true;
    },
  });
  biometricSetup.el.hidden = true;

  const error = h('p', { class: 'text-label text-bad', role: 'alert', hidden: true });
  const submit = createButton({ type: 'submit', fullWidth: true, className: 'mt-sm' }, 'Masuk');
  const biometricButton = createButton(
    {
      variant: 'outline',
      fullWidth: true,
      onClick: () => {
        void signInWithBiometric();
      },
    },
    createIcon(fingerprintSvg, 20),
    'Masuk dengan biometrik'
  );
  biometricButton.hidden = true;

  const showError = (message: string | null) => {
    const has = message !== null && message !== '';
    error.textContent = has ? message : '';
    error.hidden = !has;
  };

  const setBusy = (value: boolean) => {
    busy = value;
    submit.disabled = value;
    biometricButton.disabled = value;
    submit.textContent = value ? 'Memproses...' : 'Masuk';
  };

  const signIn = async () => {
    if (busy) return;
    const emailValue = email.input.value.trim();
    const passwordValue = password.input.value;
    if (emailValue === '' || passwordValue === '') {
      showError(REQUIRED_FIELDS_MESSAGE);
      return;
    }
    showError(null);
    setBusy(true);
    const outcome = await deps.signIn({
      email: emailValue,
      password: passwordValue,
      keepSignedIn: keep.input.checked,
      enableBiometric: biometricSetup.input.checked,
    });
    if (disposed) return;
    if (outcome.ok) {
      deps.onSignedIn();
      return;
    }
    setBusy(false);
    showError(outcome.message);
  };

  const signInWithBiometric = async () => {
    if (busy) return;
    showError(null);
    setBusy(true);
    const outcome = await deps.signInWithBiometric();
    if (disposed) return;
    if (outcome.ok) {
      deps.onSignedIn();
      return;
    }
    setBusy(false);
    showError(outcome.message);
  };

  const form = h(
    'form',
    {
      novalidate: true,
      class: 'mt-10 flex w-full flex-col gap-lg rounded-2xl bg-surface p-5',
      onsubmit: (event) => {
        event.preventDefault();
        void signIn();
      },
    },
    email.el,
    password.el,
    h('div', { class: 'flex flex-col' }, keep.el, biometricSetup.el),
    error,
    submit,
    biometricButton
  );

  container.replaceChildren(
    h(
      'main',
      { class: 'flex flex-col items-center p-screen pt-[72px] pb-8' },
      h('img', { src: logoUrl, alt: '', class: 'h-[88px] w-[88px]' }),
      h('h1', { class: 'mt-lg text-h3 font-bold' }, 'Aumo Finance'),
      h('p', { class: 'mt-sm text-caption text-content-muted' }, 'Kelola pembukuan keuangan Anda'),
      form
    )
  );

  if (deps.sessionExpired) showError(SESSION_EXPIRED_MESSAGE);

  void deps.loadBiometricState().then((state) => {
    if (disposed) return;
    biometricSetup.el.hidden = !state.showSetupCheckbox;
    biometricButton.hidden = !state.showLoginButton;
  });

  return () => {
    disposed = true;
  };
}
