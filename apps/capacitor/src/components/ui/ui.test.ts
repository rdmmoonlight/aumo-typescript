// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { h } from '../../core/dom';
import {
  createButton,
  createCard,
  createCheckbox,
  createConfirmDialog,
  createInput,
  createList,
  createListItem,
  createSnackbar,
  createTopBar,
} from './index';

afterEach(() => {
  document.body.replaceChildren();
});

describe('h()', () => {
  it('class, atribut, event, dan anak teks', () => {
    const onClick = vi.fn();
    const el = h(
      'button',
      { class: 'a b', 'aria-label': 'x', onclick: onClick, hidden: true },
      'Halo',
      null,
      false
    );
    expect(el.className).toBe('a b');
    expect(el.getAttribute('aria-label')).toBe('x');
    expect(el.hidden).toBe(true);
    expect(el.textContent).toBe('Halo');
    el.click();
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('teks pengguna tidak pernah diurai sebagai HTML (anti-XSS)', () => {
    const payload = '<img src=x onerror=alert(1)>';
    const el = h('p', null, payload);
    expect(el.querySelector('img')).toBeNull();
    expect(el.textContent).toBe(payload);
  });

  it('nilai false/null/undefined dilewati', () => {
    const el = h('div', { 'data-a': false, 'data-b': null, 'data-c': undefined });
    expect(el.attributes.length).toBe(0);
  });
});

describe('createButton', () => {
  it('varian, lebar penuh, dan nonaktif', () => {
    const btn = createButton({ variant: 'danger', fullWidth: true, disabled: true }, 'Hapus');
    expect(btn.type).toBe('button');
    expect(btn.disabled).toBe(true);
    expect(btn.className).toContain('bg-bad');
    expect(btn.className).toContain('w-full');
    expect(btn.className).toContain('min-h-button');
  });

  it('memanggil onClick', () => {
    const onClick = vi.fn();
    createButton({ onClick }, 'Ok').click();
    expect(onClick).toHaveBeenCalledOnce();
  });
});

describe('createInput', () => {
  it('label terhubung ke input lewat id', () => {
    const field = createInput({ label: 'Email' });
    document.body.append(field.el);
    const label = field.el.querySelector('label');
    expect(label?.htmlFor).toBe(field.input.id);
    expect(field.input.id).not.toBe('');
  });

  it('setError menampilkan pesan dan atribut aksesibilitas; null menghapusnya', () => {
    const field = createInput({ label: 'Tanggal' });
    field.setError('Salah');
    const error = field.el.querySelector('p');
    expect(error?.hidden).toBe(false);
    expect(error?.textContent).toBe('Salah');
    expect(field.input.getAttribute('aria-invalid')).toBe('true');
    expect(field.input.getAttribute('aria-describedby')).toBe(error?.id);
    expect(field.input.className).toContain('border-bad');

    field.setError(null);
    expect(error?.hidden).toBe(true);
    expect(field.input.hasAttribute('aria-invalid')).toBe(false);
    expect(field.input.className).toContain('border-outline');
  });

  it('onInput menerima nilai terbaru', () => {
    const onInput = vi.fn();
    const field = createInput({ label: 'X', onInput });
    field.input.value = 'abc';
    field.input.dispatchEvent(new Event('input'));
    expect(onInput).toHaveBeenCalledWith('abc');
  });

  it('id unik antar input', () => {
    expect(createInput({ label: 'A' }).input.id).not.toBe(createInput({ label: 'B' }).input.id);
  });
});

describe('createCard dan list', () => {
  it('card elevated memakai surface-elevated', () => {
    expect(createCard({ elevated: true }).className).toContain('bg-surface-elevated');
    expect(createCard({}).classList.contains('bg-surface')).toBe(true);
    expect(createCard({}).classList.contains('bg-surface-elevated')).toBe(false);
  });

  it('list item klik menjadi tombol, tanpa klik menjadi div', () => {
    const onClick = vi.fn();
    const list = createList([
      createListItem({ title: 'A', supporting: 'a', onClick }),
      createListItem({ title: 'B' }),
    ]);
    const items = list.querySelectorAll('li');
    expect(items[0].querySelector('button')).not.toBeNull();
    expect(items[1].querySelector('button')).toBeNull();
    items[0].querySelector('button')?.click();
    expect(onClick).toHaveBeenCalledOnce();
    expect(items[0].textContent).toContain('A');
  });
});

describe('createTopBar', () => {
  it('tombol kembali hanya ada bila onBack diberikan', () => {
    const onBack = vi.fn();
    const withBack = createTopBar({ title: 'Judul', onBack });
    withBack.querySelector('button')?.click();
    expect(onBack).toHaveBeenCalledOnce();
    expect(withBack.querySelector('svg')).not.toBeNull();
    expect(withBack.querySelector('h1')?.textContent).toBe('Judul');
    expect(createTopBar({ title: 'X' }).querySelector('button')).toBeNull();
  });
});

describe('createSnackbar', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('tampil lalu hilang sesuai durasi', () => {
    const bar = createSnackbar();
    expect(bar.el.hidden).toBe(true);
    bar.show('Tersimpan', 'short');
    expect(bar.el.hidden).toBe(false);
    expect(bar.el.textContent).toBe('Tersimpan');
    vi.advanceTimersByTime(3999);
    expect(bar.el.hidden).toBe(false);
    vi.advanceTimersByTime(1);
    expect(bar.el.hidden).toBe(true);
  });

  it('pesan baru mengganti pesan lama dan mengulang timer', () => {
    const bar = createSnackbar();
    bar.show('Satu', 'short');
    vi.advanceTimersByTime(3000);
    bar.show('Dua', 'short');
    vi.advanceTimersByTime(3000);
    expect(bar.el.hidden).toBe(false);
    expect(bar.el.textContent).toBe('Dua');
  });

  it('destroy melepas elemen dan menghentikan timer', () => {
    const bar = createSnackbar();
    document.body.append(bar.el);
    bar.show('x');
    bar.destroy();
    expect(document.body.contains(bar.el)).toBe(false);
  });
});

describe('createConfirmDialog', () => {
  it('tombol konfirmasi dan batal memanggil callback masing-masing', () => {
    const onConfirm = vi.fn();
    const onDismiss = vi.fn();
    const dialog = createConfirmDialog({
      title: 'Hapus?',
      message: 'Yakin?',
      confirmText: 'Hapus',
      dismissText: 'Batal',
      destructive: true,
      onConfirm,
      onDismiss,
    });
    const buttons = dialog.el.querySelectorAll('button');
    expect(dialog.el.querySelector('h2')?.textContent).toBe('Hapus?');
    expect(buttons[1].className).toContain('bg-bad');
    buttons[0].click();
    buttons[1].click();
    expect(onDismiss).toHaveBeenCalledOnce();
    expect(onConfirm).toHaveBeenCalledOnce();
  });

  it('Esc (cancel) tidak menutup sendiri, melainkan memanggil onDismiss', () => {
    const onDismiss = vi.fn();
    const dialog = createConfirmDialog({
      title: 'T',
      message: 'M',
      confirmText: 'Ya',
      dismissText: 'Tidak',
      onConfirm: vi.fn(),
      onDismiss,
    });
    const event = new Event('cancel', { cancelable: true });
    dialog.el.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
    expect(onDismiss).toHaveBeenCalledOnce();
  });
});

describe('createCheckbox', () => {
  it('label bisa disentuh, status awal dan onChange mengikuti input', () => {
    const onChange = vi.fn();
    const field = createCheckbox({ label: 'Ingat saya', checked: true, onChange });
    document.body.append(field.el);
    expect(field.el.textContent).toBe('Ingat saya');
    expect(field.input.checked).toBe(true);

    field.input.checked = false;
    field.input.dispatchEvent(new Event('change'));
    expect(onChange).toHaveBeenCalledWith(false);
  });
});
