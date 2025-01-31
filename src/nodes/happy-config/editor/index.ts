import { type NodeEditorProps, createEditorNode } from '@keload/node-red-dxp/editor';
import { initTabs } from '@keload/node-red-dxp/editor/dom-helper';

import { applyTypedField, getCommonDefaultFields } from '../../../common/editor/commonNodeEditor';
import type { NodeHappyConfigProps } from '../../../common/nodeTypes';

interface NodeCredentials {
  noop: boolean;
}

const HappyConfig = createEditorNode<NodeEditorProps<NodeHappyConfigProps>, NodeCredentials>({
  category: 'config',
  color: '#a6bbcf',
  defaults: {
    baseUrl: { value: '' },
    ...getCommonDefaultFields({ nameRequired: true, forConfig: true }),
  },
  credentials: {
    noop: { type: 'text' },
    // user: { type: 'text' },
    // password: { type: 'password' },
  },
  inputs: 1,
  outputs: 1,
  icon: 'font-awesome/fa-tower-broadcast',
  label: function () {
    return this.name || 'HappyConfig';
  },
  oneditprepare: () => {
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
      valueType: 'num',
      selector: '$$connectionTimeout',
      withInherit: false,
    });

    applyTypedField({
      valueType: 'bool',
      selector: '$$caRejectUnauthorized',
      withInherit: false,
    });

    initTabs({
      targetId: 'tabs',
      initialTab: 'Endpoint',
      tabsLabel: ['Endpoint', 'Auth', 'Advanced'],
    });
  },
});

export default HappyConfig;
