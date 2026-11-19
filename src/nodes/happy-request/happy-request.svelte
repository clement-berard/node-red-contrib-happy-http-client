<script module lang="ts">
  import { getCommonDefaultFields } from '../../common/editor/commonFields';

  export const definition = {
    category: 'network',
    color: '#0593A2',
    paletteLabel: 'Happy Request',
    icon: 'font-awesome/fa-globe',
    credentials: { requestAuthPasswordSecret: { type: 'text' } },
  };

  export const defaults = {
    clientInstance: { value: '', type: 'happy-config', required: false },
    endpoint: { value: '' },
    endpointType: { value: '', required: false },
    method: { value: 'GET' },
    methodType: { value: '', required: false },
    splitBooleanOutputs: { value: false },
    throwErrorOnError: { value: true },
    outputs: { value: 1 },
    body: { value: 'payload', required: false },
    bodyContentType: { value: 'application/json', required: false },
    bodyType: { value: 'msg', required: false },
    responseFormat: { value: 'json' },
    beforeRequestScript: { value: '' },
    afterResponseScript: { value: '' },
    ...getCommonDefaultFields({ forConfig: false }),
  };

  export function label(this: { name: string }) {
    return this.name || 'HappyRequest';
  }

  export function outputLabels(this: { outputs: number }, index: number) {
    if (this.outputs > 1) {
      return index === 0 ? 'Success' : 'Error';
    }
    return undefined;
  }

  export function onsave(values: { splitBooleanOutputs: boolean; outputs: number }) {
    values.outputs = values.splitBooleanOutputs ? 2 : 1;
  }
</script>

<script lang="ts">
  import { Checkbox, ConfigSelect, Hint, Input, Row, Select, Separator, Tabs, TypedField } from '@keload/node-red-dxp/ui';
  import AuthFields from '../../common/editor/AuthFields.svelte';
  import CommonField from '../../common/editor/CommonField.svelte';
  import ScriptRow from '../../common/editor/ScriptRow.svelte';
    import { HTTP_METHODS, REQUEST_BODY_CONTENT_TYPES, REQUEST_RESPONSE_FORMAT } from '../../common/httpClient';

  let { node } = $props();
  const bodyContentTypes = REQUEST_BODY_CONTENT_TYPES.map(({ value, label }) => ({ value, text: label }));
</script>

<Row label="Name" icon="tag"><Input bind:value={node.name} /></Row>
<Row label="Client" icon="server">
  <ConfigSelect bind:value={node.clientInstance} type="happy-config" property="clientInstance" />
  <Hint>Client is not required</Hint>
</Row>
<TypedField {node} field="endpoint" label="Endpoint" icon="globe" hint="Endpoint or full URL without client" />
<TypedField {node} field="method" label="Method" icon="envelope-o" readonly={HTTP_METHODS} />
<Tabs tabs={['Request', 'Response', 'Auth', 'Advanced']}>
  {#snippet children(tab)}
    {#if tab === 'Request'}
      <CommonField {node} field="defaultArgsHeaders" />
      <CommonField {node} field="defaultArgsQueryParams" />
      <TypedField {node} field="body" label="Body" icon="align-left" valueType="json" hint="Leave empty to send no body" />
      <Row label="Body Type" icon="file-code-o">
        <Select bind:value={node.bodyContentType} options={bodyContentTypes} />
        <Hint>Body content type</Hint>
      </Row>
      <CommonField {node} field="connectionKeepAlive" />
      <CommonField {node} field="connectionTimeout" />
      <Separator label="Scripting" />
      <ScriptRow
        bind:value={node.beforeRequestScript}
        label="Before Request"
        globals={['request', 'msg', 'node']}
        hint={'Optional. Runs just before the call: function(request, msg, node). Mutate or return { url, method, headers, queryParams, body, bodyContentType } to override. May return a Promise. On error, nothing is sent.'}
      />
    {:else if tab === 'Response'}
      <ScriptRow
        bind:value={node.afterResponseScript}
        label="Transform Response"
        globals={['msg', 'node']}
        hint={'Optional. Runs after the response msg is built: function(msg, node). MUST return the msg to send onward (msg.payload / msg.happyRequest). May return a Promise. On error, nothing is sent.'}
      />
      <Separator label="Response" />
      <Row label="Throw Error" icon="exclamation-circle">
        <Checkbox bind:checked={node.throwErrorOnError} text="Throw error if HTTP response status code other than 2xx" />
      </Row>
      <Row label="Format" icon="share-square-o">
        <Select bind:value={node.responseFormat} options={[...REQUEST_RESPONSE_FORMAT]} />
        <Hint>Response format</Hint>
      </Row>
      <Separator label="Node outputs" />
      <Row label="Split out" icon="map-signs">
        <Checkbox bind:checked={node.splitBooleanOutputs} text="Split in two distinct outputs success/error" />
      </Row>
    {:else if tab === 'Auth'}
      <AuthFields {node} />
    {:else}
      <Separator label="TLS" />
      <CommonField {node} field="caRejectUnauthorized" />
    {/if}
  {/snippet}
</Tabs>
