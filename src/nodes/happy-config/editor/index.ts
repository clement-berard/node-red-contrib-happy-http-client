import { type NodeEditorProps, createEditorNode } from '@keload/node-red-dxp/editor';
import { initTabs } from '@keload/node-red-dxp/editor/dom-helper';

import { applyTypedField, getCommonDefaultFields, initAuthFields } from '../../../common/editor/commonNodeEditor';
import type { NodeHappyConfigCredentials, NodeHappyConfigProps } from '../../../common/nodeTypes';

const HappyConfig = createEditorNode<NodeEditorProps<NodeHappyConfigProps>, NodeHappyConfigCredentials>({
  category: 'config',
  color: '#a6bbcf',
  defaults: {
    baseUrl: { value: '' },
    ...getCommonDefaultFields({ nameRequired: true, forConfig: true }),
  },
  credentials: {
    requestAuthPasswordSecret: { type: 'text' },
  },
  inputs: 1,
  outputs: 1,
  icon: 'font-awesome/fa-tower-broadcast',
  label: function () {
    return this.name || 'HappyConfig';
  },
  oneditprepare: function () {
    // biome-ignore lint/complexity/noForEach: <explanation>
    ['defaultArgsHeaders', 'defaultArgsQueryParams'].forEach((selector) => {
      applyTypedField({
        valueType: 'json',
        selector: `$$${selector}`,
        withInherit: false,
      });
    });

    applyTypedField({
      valueType: 'num',
      selector: '$$connectionKeepAlive',
      withInherit: false,
    });

    applyTypedField({
      valueType: 'str',
      selector: '$$requestAuthBearerToken',
      withInherit: false,
    });

    applyTypedField({
      valueType: 'num',
      selector: '$$connectionTimeout',
      withInherit: false,
    });

    applyTypedField({
      valueType: 'bool',
      selector: '$$caRejectUnauthorized',
      withInherit: false,
    });

    initAuthFields('requestAuthKind', this.requestAuthKind, true);

    initTabs({
      targetId: 'tabs',
      initialTab: 'Endpoint',
      tabsLabel: ['Endpoint', 'Auth', 'Advanced'],
    });
  },
});

export default HappyConfig;
