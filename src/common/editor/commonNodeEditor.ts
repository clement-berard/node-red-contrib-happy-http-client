import { jqSelector, resolveSelector } from '@keload/node-red-dxp/editor/dom-helper';
import { isEmpty } from 'radash';
import { CONSTANTS } from '../constants';
import { DEFAULT_VALUES } from '../defaultValues';
import type { CommonNodeFields } from '../nodeTypes';

type GetCommonDefaultFields = {
  nameRequired?: boolean;
  forConfig?: boolean;
};

export function getCommonDefaultFields(params: GetCommonDefaultFields = {}): Record<keyof CommonNodeFields, any> {
  const { forConfig = false, nameRequired = false } = params;
  const fromClientOr = (inType = '') => ({ value: forConfig ? inType : CONSTANTS.INHERIT_CLIENT_TERM });
  return {
    name: { value: '', required: nameRequired },
    defaultArgsHeaders: { value: '', required: false },
    defaultArgsHeadersType: { value: '', required: false },
    defaultArgsQueryParams: { value: '', required: false },
    defaultArgsQueryParamsType: { value: '', required: false },
    connectionKeepAlive: { value: DEFAULT_VALUES.CONNECTION_KEEP_ALIVE, type: 'num' },
    connectionKeepAliveType: { ...fromClientOr('num') },
    connectionTimeout: { value: DEFAULT_VALUES.CONNECTION_TIMEOUT, type: 'num' },
    connectionTimeoutType: { ...fromClientOr('num') },
    caRejectUnauthorized: { value: DEFAULT_VALUES.CONNECTION_TIMEOUT, type: 'bool' },
    caRejectUnauthorizedType: { ...fromClientOr('bool') },
    requestAuthBearerToken: { value: '', type: 'str' },
    requestAuthBearerTokenType: { ...fromClientOr('str') },
  };
}

export const COMMON_INPUT_TYPED_TYPES = ['jsonata', 'msg', 'flow', 'global'];

type ApplyTypedField = {
  selector: string;
  withInherit?: boolean;
  withInheritLabel?: string;
  withExtraTypes?: boolean;
  additionalTypesReadonly?: string[];
  defaultValue?: boolean | string | number;
  valueType: 'number' | 'str' | 'bool' | string;
  opt?: {
    typedFieldSuffix?: string;
  };
};

export function applyTypedField(params: ApplyTypedField) {
  const {
    selector,
    withInherit = true,
    withInheritLabel,
    defaultValue,
    valueType,
    withExtraTypes = true,
    additionalTypesReadonly = [],
    opt = {},
  } = params;
  const { typedFieldSuffix = 'Type' } = opt;
  const innerTypes = [];
  if (!isEmpty(additionalTypesReadonly)) {
    innerTypes.push(
      ...additionalTypesReadonly.map((method) => ({
        value: method,
        label: method,
        hasValue: false,
      })),
    );
  }
  if (withInherit) {
    const _label = `Inherit from client ${withInheritLabel ? ` or ${withInheritLabel}` : ''}`;
    // @ts-ignore
    innerTypes.push({
      value: CONSTANTS.INHERIT_CLIENT_TERM,
      label: _label,
      hasValue: false,
    });
  }
  innerTypes.push(valueType);
  if (withExtraTypes) {
    innerTypes.push(...COMMON_INPUT_TYPED_TYPES);
  }
  const wd = jqSelector(selector).typedInput({
    // @ts-ignore
    types: innerTypes.filter(Boolean),
    typeField: resolveSelector(`${selector}${typedFieldSuffix}`),
  });

  if (defaultValue !== undefined) {
    // @ts-ignore
    wd.typedInput('value', defaultValue);
  }
}
