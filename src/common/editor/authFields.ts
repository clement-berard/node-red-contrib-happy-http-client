import { initSelect, jqSelector, watchInput } from '@keload/node-red-dxp/editor/dom-helper';
import { title } from 'radash';
import { applyTypedField } from './typedField';

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
