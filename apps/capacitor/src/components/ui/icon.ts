/**
 * Ikon dari @tabler/icons (SVG statis milik paket, bukan data pengguna).
 * Pakai: createIcon(arrowLeftSvg) dengan `import arrowLeftSvg from '@tabler/icons/outline/arrow-left.svg?raw'`.
 */
export function createIcon(svg: string, size = 24): SVGElement {
  const template = document.createElement('template');
  template.innerHTML = svg.trim();
  const icon = template.content.firstElementChild;
  if (!(icon instanceof SVGElement)) throw new Error('Berkas ikon bukan SVG');
  icon.setAttribute('width', String(size));
  icon.setAttribute('height', String(size));
  icon.setAttribute('aria-hidden', 'true');
  return icon;
}
