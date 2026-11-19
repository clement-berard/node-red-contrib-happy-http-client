import { beforeEach, describe, expect, it, vi } from 'vitest';
import { COMMON_FIELD_KEYS } from '../../../common/editor/commonFields';
import controller from '../controller';

const createNode = vi.fn();

function build(config: Record<string, unknown>) {
  const node: Record<string, unknown> = {};
  (globalThis as unknown as { RED: unknown }).RED = { nodes: { createNode } };
  (controller as unknown as (this: unknown, config: unknown) => void).call(node, config);
  return node;
}

describe('happy-config controller', () => {
  beforeEach(() => vi.clearAllMocks());

  it('should register the node and the password credential', () => {
    const config = { id: 'c1' };
    const node = build(config);

    expect(createNode).toHaveBeenCalledWith(node, config);
  });

  it('should copy the base url and every shared setting to the node', () => {
    const config = {
      baseUrl: 'https://api.test',
      ...Object.fromEntries(COMMON_FIELD_KEYS.map((key) => [key, `value of ${key}`])),
    };
    const node = build(config);

    expect(node.baseUrl).toBe('https://api.test');
    for (const key of COMMON_FIELD_KEYS) {
      expect(node[key]).toBe(`value of ${key}`);
    }
  });

  it('should not copy what the node does not use', () => {
    const node = build({ baseUrl: 'https://api.test', z: 'flow', x: 10 });

    expect(node).not.toHaveProperty('z');
    expect(node).not.toHaveProperty('x');
  });
});
