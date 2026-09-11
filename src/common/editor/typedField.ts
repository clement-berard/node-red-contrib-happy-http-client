import { jqSelector, resolveSelector } from '@keload/node-red-dxp/editor/dom-helper';
import type { EditorWidgetTypedInputType, EditorWidgetTypedInputTypeDefinition } from 'node-red';
import { isEmpty } from 'radash';
import { CONSTANTS } from '../constants';

export const COMMON_INPUT_TYPED_TYPES: EditorWidgetTypedInputType[] = ['jsonata', 'msg', 'flow', 'global', 'env'];

type ApplyTypedField = {
  selector: string;
  withInherit?: boolean;
  withInheritLabel?: string;
  withExtraTypes?: boolean;
  additionalTypesReadonly?: string[];
  defaultValue?: boolean | string | number;
  valueType: EditorWidgetTypedInputType;
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
  const innerTypes: (EditorWidgetTypedInputType | EditorWidgetTypedInputTypeDefinition)[] = [];
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
