import type { LocalStorageConsent, ResumeDocumentMetadata } from '../lib/types';

interface DocumentManagerProps {
  consent: LocalStorageConsent;
  documents: ResumeDocumentMetadata[];
  currentId: string;
  currentName: string;
  onConsentChange: (consent: LocalStorageConsent) => void;
  onNameChange: (name: string) => void;
  onCreate: () => void;
  onOpen: (id: string) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
  onClear: () => void;
}

export function DocumentManager({
  consent,
  documents,
  currentId,
  currentName,
  onConsentChange,
  onNameChange,
  onCreate,
  onOpen,
  onDuplicate,
  onDelete,
  onClear,
}: DocumentManagerProps) {
  const deviceStorageEnabled = consent === 'device-storage';
  return (
    <section className="document-manager" aria-labelledby="document-manager-title">
      <h2 id="document-manager-title">この端末への保存</h2>
      <p>初期状態では、この画面を閉じると入力内容は残りません。</p>
      <label className="check-row consent-row">
        <input
          type="checkbox"
          checked={deviceStorageEnabled}
          onChange={(event) => onConsentChange(event.target.checked ? 'device-storage' : 'memory-only')}
        />
        この端末に保存する
      </label>
      {deviceStorageEnabled ? (
        <>
          <p className="warning-text">氏名・住所などの個人情報をこのブラウザ内に保存します。共有端末では使用しないでください。</p>
          <label className="field document-name-field">
            <span>編集中の書類名</span>
            <input value={currentName} maxLength={120} onChange={(event) => onNameChange(event.target.value)} />
          </label>
          <div className="button-row">
            <button type="button" className="secondary" onClick={onCreate}>新しい履歴書</button>
            <button type="button" className="ghost-danger" onClick={onClear} disabled={documents.length === 0}>端末内の全書類を削除</button>
          </div>
          {documents.length > 0 ? (
            <ul className="document-list">
              {documents.map((document) => (
                <li key={document.id} aria-current={document.id === currentId ? 'true' : undefined}>
                  <div>
                    <strong>{document.name}</strong>
                    <small>更新: {new Date(document.updatedAt).toLocaleString('ja-JP')}</small>
                  </div>
                  <div className="document-actions">
                    <button type="button" className="secondary" onClick={() => onOpen(document.id)}>開く</button>
                    <button type="button" className="secondary" onClick={() => onDuplicate(document.id)}>複製</button>
                    <button type="button" className="ghost-danger" onClick={() => onDelete(document.id)}>削除</button>
                  </div>
                </li>
              ))}
            </ul>
          ) : <p>この端末に保存された履歴書はありません。</p>}
        </>
      ) : <p>必要なときはJSONファイルへ保存できます。</p>}
    </section>
  );
}
