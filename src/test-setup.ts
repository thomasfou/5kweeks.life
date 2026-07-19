import { vi } from 'vitest';

// Let React's act() know it is in a test environment.
(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT =
  true;

if (typeof window !== 'undefined') {
  // matchMedia stub: fine pointer, no reduced motion by default.
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });

  // Minimal 2d context so canvas painting doesn't crash under jsdom.
  const gradient = { addColorStop: () => {} };
  const ctx = {
    setTransform: () => {},
    clearRect: () => {},
    fillRect: () => {},
    fillText: () => {},
    createRadialGradient: () => gradient,
    save: () => {},
    restore: () => {},
    fillStyle: '',
    globalAlpha: 1,
    font: '',
    textAlign: '',
    textBaseline: '',
  };
  (HTMLCanvasElement.prototype as unknown as { getContext: () => unknown }).getContext =
    () => ctx;
}
