import type { ResolutionRule } from './requestSchema';

export type EvaluatePipelineParams<TSchema extends Record<string, ResolutionRule<unknown>>> = {
  schema: TSchema;
  evaluator: <T extends Record<string, unknown>, TDefault = unknown>(
    bag: T,
    term: keyof T,
    quickOpts?: { strictDefaultValue?: TDefault },
  ) => Promise<unknown>;
  clientTarget: Record<string, unknown>;
  nodeTarget: Record<string, unknown>;
  inheritFlags: Record<string, boolean>;
};

export async function evaluatePipeline<TSchema extends Record<string, ResolutionRule<unknown>>>(
  params: EvaluatePipelineParams<TSchema>,
) {
  const { schema, evaluator, clientTarget, nodeTarget, inheritFlags } = params;

  const keys = Object.keys(schema) as Array<keyof TSchema>;

  const evaluations = keys.map(async (key) => {
    const rule = schema[key];

    const [clientVal, nodeVal] = await Promise.all([
      evaluator(clientTarget, key as string, { strictDefaultValue: rule.defaultValue }),
      evaluator(nodeTarget, key as string, { strictDefaultValue: rule.defaultValue }),
    ]);

    const shouldInherit = rule.inheritFlagKey ? inheritFlags[rule.inheritFlagKey] : false;
    const finalValue = shouldInherit && clientVal !== undefined ? clientVal : nodeVal;

    return { key, finalValue, clientVal, nodeVal };
  });

  const results = await Promise.all(evaluations);

  return results.reduce(
    (acc, curr) => {
      acc[curr.key] = curr;
      return acc;
    },
    {} as Record<keyof TSchema, { finalValue: unknown; clientVal: unknown; nodeVal: unknown }>,
  );
}
