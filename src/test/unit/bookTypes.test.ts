import { describe, it, expect } from 'vitest';
import { BOOK_STATUS_METADATA, BOOK_STATUS_LIST } from '../../types/book';

describe('bookStatusMap', () => {
  it('BOOK_STATUS_METADATA should contain metadata for all statuses', () => {
    expect(BOOK_STATUS_METADATA.in_progress.label).toBe('Lendo');
    expect(BOOK_STATUS_METADATA.completed.label).toBe('Concluído');
    expect(BOOK_STATUS_METADATA.want_to_read.label).toBe('Quero Ler');
    expect(BOOK_STATUS_METADATA.paused.label).toBe('Pausado');
    expect(BOOK_STATUS_METADATA.not_started.label).toBe('Na Fila');
  });

  it('BOOK_STATUS_LIST should be sorted by order', () => {
    // Expected order: in_progress (1), paused (2), not_started (3), want_to_read (4), completed (5)
    expect(BOOK_STATUS_LIST[0].id).toBe('in_progress');
    expect(BOOK_STATUS_LIST[1].id).toBe('paused');
    expect(BOOK_STATUS_LIST[2].id).toBe('not_started');
    expect(BOOK_STATUS_LIST[3].id).toBe('want_to_read');
    expect(BOOK_STATUS_LIST[4].id).toBe('completed');
  });

  it('All metadata entries contain necessary visual mapping properties', () => {
    BOOK_STATUS_LIST.forEach((status) => {
      expect(status).toHaveProperty('id');
      expect(status).toHaveProperty('label');
      expect(status).toHaveProperty('color');
      expect(status).toHaveProperty('bgClass');
      expect(status).toHaveProperty('textClass');
    });
  });
});
