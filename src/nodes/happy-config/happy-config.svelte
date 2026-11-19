<script module lang="ts">
  import { isUrl } from '@keload/node-red-dxp/utils';
  import { getCommonDefaultFields } from '../../common/editor/commonFields';

  export const definition = {
    category: 'config',
    color: '#a6bbcf',
    icon: 'font-awesome/fa-tower-broadcast',
    credentials: { requestAuthPasswordSecret: { type: 'text' } },
  };

  export const defaults = {
    baseUrl: { value: '', validate: (value: string) => !value || isUrl(value) },
    ...getCommonDefaultFields({ nameRequired: true, forConfig: true }),
  };

  export function label(this: { name: string }) {
    return this.name || 'HappyConfig';
  }
</script>

<script lang="ts">
  import { Input, Row, Separator, Tabs } from '@keload/node-red-dxp/ui';
  import AuthFields from '../../common/editor/AuthFields.svelte';
  import CommonField from '../../common/editor/CommonField.svelte';

  let { node } = $props();
</script>

<Row label="Name" icon="tag"><Input bind:value={node.name} /></Row>
<Tabs tabs={['Endpoint', 'Auth', 'Advanced']}>
  {#snippet children(tab)}
    {#if tab === 'Endpoint'}
      <Row label="Base URL" icon="globe" field="baseUrl"><Input bind:value={node.baseUrl} placeholder="Base URL" /></Row>
      <CommonField {node} isConfig field="defaultArgsHeaders" />
      <CommonField {node} isConfig field="defaultArgsQueryParams" />
      <CommonField {node} isConfig field="connectionKeepAlive" />
      <CommonField {node} isConfig field="connectionTimeout" />
    {:else if tab === 'Auth'}
      <AuthFields {node} isConfig />
    {:else}
      <Separator label="TLS" />
      <CommonField {node} isConfig field="caRejectUnauthorized" />
    {/if}
  {/snippet}
</Tabs>
