import type {
  RepositoryResult,
  ResumeDocumentMetadata,
  ResumeRepository,
  StoredResumeDocument,
} from './types';

const DATABASE_NAME = 'rirekisho-studio';
const DATABASE_VERSION = 1;
const DOCUMENT_STORE = 'resume-documents';

const success = <T>(value: T): RepositoryResult<T> => ({ ok: true, value });
const failure = <T>(error: unknown): RepositoryResult<T> => ({
  ok: false,
  error: error instanceof Error ? error.message : 'この端末の保存領域を利用できません。',
});

const requestResult = <T>(request: IDBRequest<T>): Promise<T> => new Promise((resolve, reject) => {
  request.onsuccess = () => resolve(request.result);
  request.onerror = () => reject(request.error ?? new Error('端末内保存に失敗しました。'));
});

const openDatabase = (): Promise<IDBDatabase> => new Promise((resolve, reject) => {
  if (!('indexedDB' in globalThis)) {
    reject(new Error('このブラウザでは端末内保存を利用できません。JSONファイルへ保存してください。'));
    return;
  }
  const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
  request.onupgradeneeded = () => {
    const database = request.result;
    if (!database.objectStoreNames.contains(DOCUMENT_STORE)) {
      database.createObjectStore(DOCUMENT_STORE, { keyPath: 'id' });
    }
  };
  request.onsuccess = () => resolve(request.result);
  request.onerror = () => reject(request.error ?? new Error('端末内保存を開始できません。'));
});

const cloneDocument = <T>(value: T): T => structuredClone(value);

export class IndexedDbResumeRepository implements ResumeRepository {
  private async run<T>(
    mode: IDBTransactionMode,
    action: (store: IDBObjectStore) => IDBRequest<T>,
  ): Promise<RepositoryResult<T>> {
    try {
      const database = await openDatabase();
      try {
        const transaction = database.transaction(DOCUMENT_STORE, mode);
        const value = await requestResult(action(transaction.objectStore(DOCUMENT_STORE)));
        return success(value);
      } finally {
        database.close();
      }
    } catch (error) {
      return failure(error);
    }
  }

  async list(): Promise<RepositoryResult<ResumeDocumentMetadata[]>> {
    const result = await this.run<StoredResumeDocument[]>('readonly', (store) => store.getAll());
    if (!result.ok) return result;
    return success(result.value
      .map(({ id, name, createdAt, updatedAt }) => ({ id, name, createdAt, updatedAt }))
      .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt)));
  }

  async get(id: string): Promise<RepositoryResult<StoredResumeDocument | null>> {
    const result = await this.run<StoredResumeDocument | undefined>('readonly', (store) => store.get(id));
    return result.ok ? success(result.value ? cloneDocument(result.value) : null) : result;
  }

  async save(document: StoredResumeDocument): Promise<RepositoryResult<StoredResumeDocument>> {
    const saved = cloneDocument(document);
    const result = await this.run<IDBValidKey>('readwrite', (store) => store.put(saved));
    return result.ok ? success(saved) : result;
  }

  async duplicate(id: string): Promise<RepositoryResult<StoredResumeDocument>> {
    const source = await this.get(id);
    if (!source.ok) return source;
    if (!source.value) return failure(new Error('複製する履歴書が見つかりません。'));
    const timestamp = new Date().toISOString();
    return this.save({
      ...source.value,
      id: crypto.randomUUID(),
      name: `${source.value.name}のコピー`,
      createdAt: timestamp,
      updatedAt: timestamp,
    });
  }

  async delete(id: string): Promise<RepositoryResult<void>> {
    const result = await this.run<undefined>('readwrite', (store) => store.delete(id) as IDBRequest<undefined>);
    return result.ok ? success(undefined) : result;
  }

  async clear(): Promise<RepositoryResult<void>> {
    const result = await this.run<undefined>('readwrite', (store) => store.clear() as IDBRequest<undefined>);
    return result.ok ? success(undefined) : result;
  }
}

export const resumeRepository: ResumeRepository = new IndexedDbResumeRepository();
