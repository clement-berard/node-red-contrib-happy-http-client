<script lang="ts">
  import { CodeEditor, Hint, Row } from '@keload/node-red-dxp/ui';

  // A javascript property of the node, with the variables the script receives declared to the editor
  let {
    value = $bindable(),
    label,
    globals,
    hint,
  }: { value?: string; label: string; globals: string[]; hint: string } = $props();
</script>

<Row {label} icon="code">
  <CodeEditor
    bind:value
    mode="javascript"
    height="220px"
    options={{ globals: Object.fromEntries(globals.map((name) => [name, true])) }}
    expand
  />
  <Hint fullWidth>{hint}</Hint>
</Row>
