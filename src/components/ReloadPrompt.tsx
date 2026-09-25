import { useRegisterSW } from 'virtual:pwa-register/react';

export function ReloadPrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW();

  if (!needRefresh) return null;

  return (
    <div className="pwa-update-banner" role="alert">
      <p>新しいバージョンが利用可能です。</p>
      <div className="pwa-update-actions">
        <button type="button" onClick={() => updateServiceWorker(true)}>
          更新する
        </button>
        <button type="button" className="pwa-update-dismiss" onClick={() => setNeedRefresh(false)}>
          後で
        </button>
      </div>
    </div>
  );
}
