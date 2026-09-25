import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ReloadPrompt } from './ReloadPrompt';

const serviceWorker = vi.hoisted(() => ({
  needRefresh: false,
  setNeedRefresh: vi.fn(),
  updateServiceWorker: vi.fn(),
}));

vi.mock('virtual:pwa-register/react', () => ({
  useRegisterSW: () => ({
    needRefresh: [serviceWorker.needRefresh, serviceWorker.setNeedRefresh],
    updateServiceWorker: serviceWorker.updateServiceWorker,
  }),
}));

describe('ReloadPrompt', () => {
  beforeEach(() => {
    serviceWorker.needRefresh = false;
    serviceWorker.setNeedRefresh.mockReset();
    serviceWorker.updateServiceWorker.mockReset();
  });

  it('stays hidden when no update is waiting', () => {
    render(<ReloadPrompt />);

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('updates immediately or dismisses the waiting update', () => {
    serviceWorker.needRefresh = true;
    render(<ReloadPrompt />);

    expect(screen.getByRole('alert')).toHaveTextContent('新しいバージョンが利用可能です。');
    fireEvent.click(screen.getByRole('button', { name: '更新する' }));
    fireEvent.click(screen.getByRole('button', { name: '後で' }));

    expect(serviceWorker.updateServiceWorker).toHaveBeenCalledWith(true);
    expect(serviceWorker.setNeedRefresh).toHaveBeenCalledWith(false);
  });
});
