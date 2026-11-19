<script lang="ts">
  import { Input, Row, Select, Separator } from '@keload/node-red-dxp/ui';
  import { CONSTANTS } from '../constants';
  import { AUTH_KINDS } from './commonFields';
  import CommonField from './CommonField.svelte';

  let { node, isConfig = false }: { node: any; isConfig?: boolean } = $props();

  // svelte-ignore state_referenced_locally
  const kinds = [...(isConfig ? [] : [`${CONSTANTS.INHERIT_CLIENT_TERM}_or_none`]), ...AUTH_KINDS].map((value) => ({
    value,
    text: value.charAt(0).toUpperCase() + value.slice(1).replaceAll('_', ' '),
  }));
  const withCredentials = $derived(['basic', 'digest'].includes(node.requestAuthKind));
</script>

<Row label="Type"><Select bind:value={node.requestAuthKind} options={kinds} /></Row>
{#if withCredentials}
  <CommonField {node} {isConfig} field="requestAuthUsername" />
  <Row label="Password" icon="lock">
    <Input type="password" bind:value={node.credentials.requestAuthPasswordSecret} />
  </Row>
{/if}
<Separator label="Bearer Token" />
<CommonField {node} {isConfig} field="requestAuthBearerToken" />
