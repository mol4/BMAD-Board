import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { updateSprintStatus } from './sprint-status-sync';
import { setConfig } from './config';

const fileReadMock = vi.fn();
const fileWriteMock = vi.fn();

function setupWindowMock() {
  (window as unknown as { electronAPI: { fileRead: typeof fileReadMock; fileWrite: typeof fileWriteMock } }).electronAPI = {
    fileRead: fileReadMock,
    fileWrite: fileWriteMock,
  };
}

function cleanupWindowMock() {
  delete (window as unknown as { electronAPI?: unknown }).electronAPI;
}

const sampleSprintYaml = `# generated: 2026-05-27
# last_updated: 2026-06-09

generated: 2026-05-27
last_updated: 2026-06-09
project: BMAD board
project_key: NOKEY

development_status:
  # Epic 4: Content Reading, Status Updates & Safeguards
  epic-4: in-progress
  4-1-implement-file-lock-status-update-and-read-only-document-view: done
  4-2-implement-manual-edit-warning-and-markdown-editor: backlog
  4-3-sync-story-status-to-sprint-status-yaml: done
`;

describe('sprint-status-sync', () => {
  beforeEach(() => {
    fileReadMock.mockClear();
    fileWriteMock.mockClear();
    setupWindowMock();
    setConfig({ storiesDir: '/test/stories' });
  });

  afterEach(() => {
    cleanupWindowMock();
  });

  it('updates story status line and last_updated', async () => {
    fileReadMock.mockResolvedValue({ content: sampleSprintYaml, exists: true });
    fileWriteMock.mockResolvedValue({ mtimeMs: 1234567890 });

    const ok = await updateSprintStatus('4-2-implement-manual-edit-warning-and-markdown-editor', 'done');

    expect(ok).toBe(true);
    expect(fileWriteMock).toHaveBeenCalledTimes(1);
    const writeCall = fileWriteMock.mock.calls[0][0];
    expect(writeCall.path).toBe('/test/stories/sprint-status.yaml');
    expect(writeCall.content).toContain('4-2-implement-manual-edit-warning-and-markdown-editor: done');
    expect(writeCall.content).toMatch(/last_updated:\s*\d{4}-\d{2}-\d{2}/);
  });

  it('maps UI status to sprint status', async () => {
    fileReadMock.mockResolvedValue({ content: sampleSprintYaml, exists: true });
    fileWriteMock.mockResolvedValue({ mtimeMs: 1234567890 });

    const ok = await updateSprintStatus('4-2-implement-manual-edit-warning-and-markdown-editor', 'todo');

    expect(ok).toBe(true);
    const writeCall = fileWriteMock.mock.calls[0][0];
    expect(writeCall.content).toContain('4-2-implement-manual-edit-warning-and-markdown-editor: ready-for-dev');
  });

  it('preserves comments on status line', async () => {
    const yamlWithComment = sampleSprintYaml.replace(
      '4-2-implement-manual-edit-warning-and-markdown-editor: backlog',
      '4-2-implement-manual-edit-warning-and-markdown-editor: backlog # note',
    );
    fileReadMock.mockResolvedValue({ content: yamlWithComment, exists: true });
    fileWriteMock.mockResolvedValue({ mtimeMs: 1234567890 });

    const ok = await updateSprintStatus('4-2-implement-manual-edit-warning-and-markdown-editor', 'in-progress');

    expect(ok).toBe(true);
    const writeCall = fileWriteMock.mock.calls[0][0];
    expect(writeCall.content).toContain('4-2-implement-manual-edit-warning-and-markdown-editor: in-progress # note');
  });

  it('returns false when story key is not found', async () => {
    fileReadMock.mockResolvedValue({ content: sampleSprintYaml, exists: true });

    const ok = await updateSprintStatus('nonexistent-key', 'done');

    expect(ok).toBe(false);
    expect(fileWriteMock).not.toHaveBeenCalled();
  });

  it('returns false when sprint-status.yaml does not exist', async () => {
    fileReadMock.mockResolvedValue({ content: '', exists: false });

    const ok = await updateSprintStatus('4-2-implement-manual-edit-warning-and-markdown-editor', 'done');

    expect(ok).toBe(false);
    expect(fileWriteMock).not.toHaveBeenCalled();
  });

  it('passes lastMtimeMs from cache on subsequent writes', async () => {
    fileReadMock.mockResolvedValue({ content: sampleSprintYaml, exists: true });
    fileWriteMock.mockResolvedValue({ mtimeMs: 1111111111 });

    await updateSprintStatus('4-2-implement-manual-edit-warning-and-markdown-editor', 'done');

    fileWriteMock.mockResolvedValue({ mtimeMs: 2222222222 });
    await updateSprintStatus('4-2-implement-manual-edit-warning-and-markdown-editor', 'in-progress');

    const secondWriteCall = fileWriteMock.mock.calls[1][0];
    expect(secondWriteCall.lastMtimeMs).toBe(1111111111);
  });

  describe('prefix matching (inline stories)', () => {
    it('matches by prefix when exact key not found', async () => {
      fileReadMock.mockResolvedValue({ content: sampleSprintYaml, exists: true });
      fileWriteMock.mockResolvedValue({ mtimeMs: 1234567890 });

      const ok = await updateSprintStatus('4-2-', 'done');

      expect(ok).toBe(true);
      expect(fileWriteMock).toHaveBeenCalledTimes(1);
      const writeCall = fileWriteMock.mock.calls[0][0];
      expect(writeCall.content).toContain('4-2-implement-manual-edit-warning-and-markdown-editor: done');
    });

    it('does not match wrong prefix (4-2- should not match 4-20-)', async () => {
      const yaml = `# test
last_updated: 2026-01-01

development_status:
  epic-4: in-progress
  4-20-some-other-story: backlog
  4-2-implement-manual-edit-warning-and-markdown-editor: backlog
`;
      fileReadMock.mockResolvedValue({ content: yaml, exists: true });
      fileWriteMock.mockResolvedValue({ mtimeMs: 1234567890 });

      const ok = await updateSprintStatus('4-2-', 'done');

      expect(ok).toBe(true);
      const writeCall = fileWriteMock.mock.calls[0][0];
      expect(writeCall.content).toContain('4-2-implement-manual-edit-warning-and-markdown-editor: done');
      expect(writeCall.content).toContain('4-20-some-other-story: backlog');
    });

    it('prefix fallback preserves comments on matched line', async () => {
      const yaml = `# test
last_updated: 2026-01-01

development_status:
  4-2-implement-manual-edit-warning-and-markdown-editor: backlog # inline
`;
      fileReadMock.mockResolvedValue({ content: yaml, exists: true });
      fileWriteMock.mockResolvedValue({ mtimeMs: 1234567890 });

      const ok = await updateSprintStatus('4-2-', 'in-progress');

      expect(ok).toBe(true);
      const writeCall = fileWriteMock.mock.calls[0][0];
      expect(writeCall.content).toContain('4-2-implement-manual-edit-warning-and-markdown-editor: in-progress # inline');
    });

    it('returns false when neither exact nor prefix matches', async () => {
      fileReadMock.mockResolvedValue({ content: sampleSprintYaml, exists: true });

      const ok = await updateSprintStatus('99-99-', 'done');

      expect(ok).toBe(false);
      expect(fileWriteMock).not.toHaveBeenCalled();
    });

    it('uses exact match first when both exact and prefix would match', async () => {
      const yaml = `# test
last_updated: 2026-01-01

development_status:
  4-2: backlog
  4-2-implement-manual-edit-warning-and-markdown-editor: done
`;
      fileReadMock.mockResolvedValue({ content: yaml, exists: true });
      fileWriteMock.mockResolvedValue({ mtimeMs: 1234567890 });

      const ok = await updateSprintStatus('4-2', 'in-review');

      expect(ok).toBe(true);
      const writeCall = fileWriteMock.mock.calls[0][0];
      expect(writeCall.content).toContain('4-2: review');
      expect(writeCall.content).toContain('4-2-implement-manual-edit-warning-and-markdown-editor: done');
    });
  });
});
