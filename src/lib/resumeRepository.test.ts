import 'fake-indexeddb/auto';
import { createDefaultState } from './defaults';
import { IndexedDbResumeRepository } from './resumeRepository';

describe('IndexedDbResumeRepository', () => {
  it('saves, lists, duplicates and deletes documents', async () => {
    const repository = new IndexedDbResumeRepository();
    await repository.clear();
    const timestamp = new Date().toISOString();
    const saved = await repository.save({
      id: 'resume-1',
      name: '応募用',
      createdAt: timestamp,
      updatedAt: timestamp,
      state: createDefaultState(),
    });
    expect(saved.ok).toBe(true);
    const listed = await repository.list();
    expect(listed.ok && listed.value).toHaveLength(1);
    const duplicated = await repository.duplicate('resume-1');
    expect(duplicated.ok && duplicated.value.name).toBe('応募用のコピー');
    await repository.delete('resume-1');
    const remaining = await repository.list();
    expect(remaining.ok && remaining.value).toHaveLength(1);
  });
});
