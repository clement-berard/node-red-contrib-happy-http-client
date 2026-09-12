import { createEditorNode, type NodeEditorProps } from '@keload/node-red-dxp/editor';
import { initSelect, initTabs, isCheckboxChecked, jqSelector } from '@keload/node-red-dxp/editor/dom-helper';

import { initAuthFields } from '../../../common/editor/authFields';
import {
  applyCodeEditorField,
  disposeCodeEditorFields,
  resizeCodeEditorFields,
} from '../../../common/editor/codeEditorField';
import { getCommonDefaultFields } from '../../../common/editor/defaultFields';
import { applyTypedField } from '../../../common/editor/typedField';
import { HTTP_METHODS, REQUEST_BODY_CONTENT_TYPES, REQUEST_RESPONSE_FORMAT } from '../../../common/httpClient';
import type { NodeHappyRequestProps, NodeHappyRequestPropsCredentials } from '../../../common/nodeTypes';

const HappyRequest = createEditorNode<NodeEditorProps<NodeHappyRequestProps>, NodeHappyRequestPropsCredentials>({
  category: 'network',
  color: '#0593A2',
  defaults: {
    clientInstance: { value: '', type: 'happy-config', required: false },
    endpoint: { value: '' },
    endpointType: { value: '', required: false },
    method: { value: 'GET' },
    methodType: { value: '', required: false },
    splitBooleanOutputs: { value: false },
    throwErrorOnError: { value: true },
    outputs: { value: 1 },
    body: { value: 'payload', required: false },
    bodyContentType: { value: 'json', required: false },
    bodyType: { value: 'msg', required: false },
    responseFormat: { value: 'json' },
    beforeRequestScript: { value: '' },
    afterResponseScript: { value: '' },
    ...getCommonDefaultFields({ forConfig: false }),
  },
  credentials: {
    requestAuthPasswordSecret: { type: 'text' },
  },
  inputs: 1,
  outputs: 1,
  paletteLabel: 'Happy Request',
  icon: 'font-awesome/fa-globe',
  outputLabels: function (index) {
    if (this.outputs > 1) {
      return index === 0 ? 'Success' : 'Error';
    }
    return undefined;
  },
  oneditsave: function () {
    this.outputs = isCheckboxChecked('$splitBooleanOutputs') ? 2 : 1;
    disposeCodeEditorFields({ persist: true });
  },
  oneditcancel: () => {
    disposeCodeEditorFields({ persist: false });
  },
  label: function () {
    return this.name || 'HappyRequest';
  },
  oneditprepare: function () {
    initTabs({
      targetId: 'tabs-request-node',
      initialTab: 'Request',
      tabsLabel: ['Request', 'Response', 'Auth', 'Advanced'],
    });

    applyTypedField({
      valueType: 'str',
      selector: '$endpoint',
      withInherit: false,
    });

    ['defaultArgsHeaders', 'defaultArgsQueryParams', 'body'].forEach((i) => {
      applyTypedField({
        valueType: 'json',
        selector: `$${i}`,
        withInherit: false,
      });
    });

    applyTypedField({
      valueType: 'str',
      selector: '$method',
      withInherit: false,
      additionalTypesReadonly: HTTP_METHODS,
    });

    initAuthFields('requestAuthKind', this.requestAuthKind);

    applyTypedField({
      valueType: 'bool',
      selector: '$caRejectUnauthorized',
      withInheritLabel: 'true',
      withInherit: true,
    });

    applyTypedField({
      valueType: 'str',
      selector: '$requestAuthBearerToken',
      withInheritLabel: 'none',
      withInherit: true,
    });

    applyTypedField({
      valueType: 'num',
      selector: '$connectionKeepAlive',
      withInheritLabel: '4000ms',
      withInherit: true,
      defaultValue: this.connectionKeepAlive,
    });

    applyTypedField({
      valueType: 'num',
      selector: '$connectionTimeout',
      withInheritLabel: '5000ms',
      withInherit: true,
      defaultValue: this.connectionTimeout,
    });

    initSelect(
      '$responseFormat',
      REQUEST_RESPONSE_FORMAT.map((i) => ({ value: i, text: i })),
      {
        selected: this.responseFormat,
      },
    );

    initSelect(
      '$bodyContentType',
      REQUEST_BODY_CONTENT_TYPES.map((i) => ({ value: i.value, text: i.label })),
      {
        selected: this.bodyContentType,
      },
    );

    applyCodeEditorField({
      selector: '$beforeRequestScript',
      globals: { request: true, msg: true, node: true },
    });

    applyCodeEditorField({
      selector: '$afterResponseScript',
      globals: { msg: true, node: true },
    });

    // The Response tab (and its ACE editor) starts hidden — dxp's initTabs
    // just toggles a `.hidden` class, it doesn't trigger an ACE resize the
    // way node-red core's own tab widget does. An ACE editor created inside
    // a display:none container can render at 0 height until explicitly
    // resized, so re-layout on every tab click as a cheap safeguard.
    jqSelector('#tabs-request-node')
      .find('li')
      .on('click', () => {
        setTimeout(resizeCodeEditorFields, 0);
      });
  },
});

export default HappyRequest;
