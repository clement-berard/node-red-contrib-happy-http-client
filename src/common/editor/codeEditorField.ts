import { jqSelector, resolveSelector } from '@keload/node-red-dxp/editor/dom-helper';

// The ambient global `RED` (declared by @keload/node-red-dxp) is typed as the
// *runtime* NodeAPI, which has no `.editor` — it's only ever valid client-side
// in oneditprepare/oneditsave. @types/node-red__editor-client isn't installed
// as a dependency, so we shim the tiny subset of RED.editor.createEditor we
// actually use instead of relying on it.
type DxpAceEditorInstance = {
  getValue: () => string;
  setValue: (value: string, cursorPos?: number) => void;
  resize?: () => void;
  focus?: () => void;
  saveView?: () => void;
  restoreView?: () => void;
  destroy: () => void;
};

type DxpAceEditorOptions = {
  id: string;
  mode?: string;
  value?: string;
  globals?: Record<string, boolean>;
  minimap?: { enabled: boolean };
};

type DxpEditJavaScriptOptions = {
  value: string;
  mode?: string;
  stateId?: string;
  focus?: boolean;
  minimap?: { enabled: boolean };
  cancel?: () => void;
  complete?: (value: string, cursorPos: unknown) => void;
};

type RedEditorGlobal = {
  editor: {
    createEditor: (opts: DxpAceEditorOptions) => DxpAceEditorInstance;
    editJavaScript: (opts: DxpEditJavaScriptOptions) => void;
  };
  popover: {
    tooltip: (target: JQuery, text: string) => void;
  };
};

function getRedGlobal(): RedEditorGlobal {
  return RED as unknown as RedEditorGlobal;
}

const activeCodeEditors = new Map<string, DxpAceEditorInstance>();

type ApplyCodeEditorField = {
  selector: string;
  mode?: string;
  globals?: Record<string, boolean>;
};

/**
 * Mounts a Node-RED core ACE editor (RED.editor.createEditor) into the
 * `.node-text-editor` container rendered by the `dxpFormRowCodeEditor` pug
 * mixin, seeded from the hidden input's current value. Also wires the
 * "expand" button to open the same value in Node-RED's full-screen JS
 * editor (RED.editor.editJavaScript), syncing the result back on complete.
 */
export function applyCodeEditorField(params: ApplyCodeEditorField) {
  const { selector, mode = 'ace/mode/javascript', globals = {} } = params;

  const targetSelector = resolveSelector(selector);
  const editorContainerId = `${targetSelector.slice(1)}-editor`;
  const initialValue = (jqSelector(selector).val() as string) || '';
  const red = getRedGlobal();

  const editor = red.editor.createEditor({
    id: editorContainerId,
    mode,
    value: initialValue,
    globals,
    minimap: { enabled: false },
  });

  activeCodeEditors.set(selector, editor);

  const expandButton = jqSelector(`${targetSelector}-expand`);

  expandButton.on({
    click: (e) => {
      e.preventDefault();
      editor.saveView?.();
      red.editor.editJavaScript({
        value: editor.getValue(),
        mode,
        stateId: targetSelector,
        focus: true,
        minimap: { enabled: false },
        cancel: () => {
          editor.restoreView?.();
          editor.focus?.();
        },
        complete: (value) => {
          editor.setValue(value, -1);
          editor.restoreView?.();
          editor.focus?.();
        },
      });
    },
  });

  red.popover.tooltip(expandButton, 'Expand editor');
}

/**
 * Call from `oneditsave` (persist: true, writes the value back into the
 * hidden input) or `oneditcancel` (persist: false, discards edits).
 * Clears the registry either way so a subsequent oneditprepare starts fresh.
 */
export function disposeCodeEditorFields(params: { persist: boolean }) {
  activeCodeEditors.forEach((editor, selector) => {
    const val = editor.getValue();
    editor.destroy();
    if (params.persist) {
      jqSelector(selector).val(val);
    }
  });
  activeCodeEditors.clear();
}

/** Call after a tab switch so previously-hidden ACE containers re-layout. */
export function resizeCodeEditorFields() {
  activeCodeEditors.forEach((editor) => {
    editor.resize?.();
  });
}
