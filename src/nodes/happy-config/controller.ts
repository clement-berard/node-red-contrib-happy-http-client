import type { NodeControllerConfig, NodeControllerInst } from '@keload/node-red-dxp/editor';
import { pick } from 'radash';
import { COMMON_FIELD_KEYS } from '../../common/editor/commonFields';
import type { NodeHappyConfigProps } from '../../common/nodeTypes';

export const credentials = {
  requestAuthPasswordSecret: { type: 'text' },
};

export default function (
  this: NodeControllerInst<NodeHappyConfigProps>,
  config: NodeControllerConfig<NodeHappyConfigProps>,
) {
  RED.nodes.createNode(this, config);

  Object.assign(this, pick(config, [...COMMON_FIELD_KEYS, 'baseUrl'] as (keyof NodeHappyConfigProps)[]));
}
