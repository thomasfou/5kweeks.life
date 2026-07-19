// @vitest-environment jsdom
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import Hero from '../Hero';

describe('Hero rAF lifecycle', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    document.body.innerHTML = '';
  });

  it('starts one rAF loop and cancels it on unmount (no leak)', () => {
    let nextId = 1;
    const rafSpy = vi.fn(() => nextId++);
    const cancelSpy = vi.fn();
    vi.stubGlobal('requestAnimationFrame', rafSpy);
    vi.stubGlobal('cancelAnimationFrame', cancelSpy);

    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);

    act(() => {
      root.render(<Hero />);
    });

    // The loop must have been started (follow mode under the test stubs).
    expect(rafSpy).toHaveBeenCalled();
    const lastId = nextId - 1;

    act(() => {
      root.unmount();
    });

    // Non-negotiable: the loop is cancelled on unmount.
    expect(cancelSpy).toHaveBeenCalledWith(lastId);
  });

  it('renders no rAF loop at all in static (reduced-motion) mode', () => {
    const rafSpy = vi.fn(() => 1);
    vi.stubGlobal('requestAnimationFrame', rafSpy);
    vi.stubGlobal('cancelAnimationFrame', vi.fn());
    // Force prefers-reduced-motion: reduce
    vi.stubGlobal(
      'matchMedia',
      vi.fn().mockImplementation((query: string) => ({
        matches: query.includes('prefers-reduced-motion'),
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    );

    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);

    act(() => {
      root.render(<Hero />);
    });

    const section = container.querySelector('section#hero');
    expect(section?.getAttribute('data-mode')).toBe('static');
    expect(rafSpy).not.toHaveBeenCalled();

    act(() => {
      root.unmount();
    });
  });
});
