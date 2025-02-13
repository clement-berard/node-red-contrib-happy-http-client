import { type NodeEditorProps, createEditorNode } from '@keload/node-red-dxp/editor';
import {
  initSelect,
  initTabs,
  isCheckboxChecked,
  jqSelector,
  watchInput,
} from '@keload/node-red-dxp/editor/dom-helper';

import { applyTypedField, getCommonDefaultFields, initAuthFields } from '../../../common/editor/commonNodeEditor';
import { HTTP_METHODS, REQUEST_BODY_CONTENT_TYPES, REQUEST_RESPONSE_FORMAT } from '../../../common/httpClient';
import type { NodeHappyRequestProps } from '../../../common/nodeTypes';

const HappyRequest = createEditorNode<NodeEditorProps<NodeHappyRequestProps>>({
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
    ...getCommonDefaultFields({ forConfig: false }),
  },
  inputs: 1,
  outputs: 1,
  paletteLabel: 'Happy Request',
  icon: 'font-awesome/fa-globe',
  outputLabels: function (index) {
    if (this.outputs > 1) {
      return index === 0 ? 'Success' : 'Error';
    }
    return null;
  },
  oneditsave: function () {
    this.outputs = isCheckboxChecked('$splitBooleanOutputs') ? 2 : 1;
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

    // biome-ignore lint/complexity/noForEach: <explanation>
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

    // applyTypedField({
    //   valueType: 'str',
    //   selector: '$requestAuthKind',
    //   withInherit: false,
    //   additionalTypesReadonly: ['none', 'basic', 'digest'],
    // });

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
  },
});

export default HappyRequest;
