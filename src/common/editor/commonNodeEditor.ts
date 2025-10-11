import { initSelect, jqSelector, resolveSelector, watchInput } from '@keload/node-red-dxp/editor/dom-helper';
import { isEmpty, title } from 'radash';
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
    requestAuthKind: { value: '', type: 'str' },
    requestAuthUsername: { value: '', type: 'str' },
    requestAuthUsernameType: { ...fromClientOr('str') },
  };
}

export const COMMON_INPUT_TYPED_TYPES = ['jsonata', 'msg', 'flow', 'global', 'env'];

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
    types: innerTypes.filter(Boolean),
    typeField: resolveSelector(`${selector}${typedFieldSuffix}`),
  });

  if (defaultValue !== undefined) {
    // @ts-expect-error
    wd.typedInput('value', defaultValue);
  }
}

export function initAuthFields(innerSelectorVal: string, initialValue: string, isConfig = false) {
  const prefix = isConfig ? '$$' : '$';
  const selectValues = ['none', 'basic', 'digest'];

  if (!isConfig) {
    selectValues.unshift('from_client_or_none');
  }

  initSelect(
    `${prefix}${innerSelectorVal}`,
    selectValues.map((i) => ({ text: title(i), value: i })),
    {
      selected: initialValue,
    },
  );

  applyTypedField({
    valueType: 'str',
    selector: `${prefix}requestAuthUsername`,
    withInherit: !isConfig,
  });

  applyTypedField({
    valueType: 'str',
    selector: `${prefix}requestAuthPassword`,
    withInherit: !isConfig,
  });

  watchInput(
    [`${prefix}${innerSelectorVal}`],
    (val) => {
      const [valField, valType] = val;
      const authorizedValues = ['basic', 'digest'];
      if (authorizedValues.includes(valField) || authorizedValues.includes(valType)) {
        jqSelector('.auth-cred-container').removeClass('hidden');
      } else {
        jqSelector('.auth-cred-container').addClass('hidden');
      }
    },
    {
      additionalEvents: ['change', 'keyup'],
    },
  );
}
