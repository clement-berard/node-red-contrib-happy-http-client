<script lang="ts">
  import { TypedField } from '@keload/node-red-dxp/ui';
  import { CONSTANTS } from '../constants';
  import { COMMON_FIELDS, type CommonFieldKey } from './commonFields';

  // One shared setting (see `COMMON_FIELDS`): `isConfig` is the client, otherwise the request node that can inherit it
  let { node, field, isConfig = false }: { node: any; field: CommonFieldKey; isConfig?: boolean } = $props();

  // svelte-ignore state_referenced_locally
  const spec: (typeof COMMON_FIELDS)[CommonFieldKey] = COMMON_FIELDS[field];
  // svelte-ignore state_referenced_locally
  const inheritLabel = `Inherit from client${spec.inheritLabel ? ` or ${spec.inheritLabel}` : ''}`;
  // svelte-ignore state_referenced_locally
  const hint = typeof spec.hint === 'string' ? spec.hint : spec.hint?.[isConfig ? 'config' : 'node'];
</script>

<TypedField
  {node}
  {field}
  {hint}
  label={spec.label}
  icon={spec.icon}
  valueType={spec.valueType}
  placeholder={spec.placeholder}
  inherit={spec.inherit && !isConfig ? { value: CONSTANTS.INHERIT_CLIENT_TERM, label: inheritLabel } : undefined}
/>
