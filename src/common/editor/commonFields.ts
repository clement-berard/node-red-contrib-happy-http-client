import { typedFieldDefaults } from '@keload/node-red-dxp/editor/svelte';
import { CONSTANTS } from '../constants';
import { DEFAULT_VALUES } from '../defaultValues';
import type { CommonNodeFields } from '../nodeTypes';

type FieldSpec = {
  label: string;
  icon?: string;
  /** Main type of the typedInput. */
  valueType: 'json' | 'num' | 'bool' | 'str';
  /** Default value, for the client and the request node. */
  value: string | number | boolean;
  /** The request node can inherit it from its client ("Inherit from client" type). */
  inherit: boolean;
  /** What the client falls back to, shown in the "Inherit" type of the request node. */
  inheritLabel?: string;
  /** Hint under the field, one for the client and one for the request node. */
  hint?: { config: string; node: string } | string;
  placeholder?: string;
};

/**
 * Settings shared by the client (`happy-config`) and the request node: the single source of the editor fields
 * (`<CommonField>`) and of their `defaults`. Keys are the saved properties, `<key>Type` holds the typedInput type.
 */
export const COMMON_FIELDS = {
  defaultArgsHeaders: {
    label: 'Headers',
    icon: 'table',
    valueType: 'json',
    value: '',
    inherit: false,
    hint: { config: 'Defaults request headers (json)', node: 'Request headers (merge and override client) (json)' },
  },
  defaultArgsQueryParams: {
    label: 'Params',
    icon: 'table',
    valueType: 'json',
    value: '',
    inherit: false,
    hint: {
      config: 'Defaults request query params (json)',
      node: 'Request query params (merge and override client) (json)',
    },
  },
  connectionKeepAlive: {
    label: 'Keep-Alive',
    valueType: 'num',
    value: DEFAULT_VALUES.CONNECTION_KEEP_ALIVE,
    inherit: true,
    inheritLabel: `${DEFAULT_VALUES.CONNECTION_KEEP_ALIVE}ms`,
    hint: 'Must be a number in ms (0 is off)',
  },
  connectionTimeout: {
    label: 'Timeout',
    icon: 'clock-o',
    valueType: 'num',
    value: DEFAULT_VALUES.CONNECTION_TIMEOUT,
    inherit: true,
    inheritLabel: `${DEFAULT_VALUES.CONNECTION_TIMEOUT}ms`,
    hint: 'Must be a number in ms',
  },
  caRejectUnauthorized: {
    label: 'Reject',
    valueType: 'bool',
    value: DEFAULT_VALUES.CA_REJECT_UNAUTHORIZED,
    inherit: true,
    inheritLabel: 'true',
    hint: 'Verify server certificate',
  },
  requestAuthUsername: { label: 'Username', icon: 'user', valueType: 'str', value: '', inherit: true },
  requestAuthBearerToken: {
    label: 'Bearer Token',
    valueType: 'str',
    value: '',
    inherit: true,
    inheritLabel: 'none',
    placeholder: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  },
} as const satisfies Record<string, FieldSpec>;

export type CommonFieldKey = keyof typeof COMMON_FIELDS;

/** Every saved property of the shared settings: the value, its typedInput type, and the auth kind. */
export const COMMON_FIELD_KEYS = [
  'name',
  'requestAuthKind',
  ...Object.keys(COMMON_FIELDS).flatMap((key) => [key, `${key}Type`]),
];

export const AUTH_KINDS = ['none', 'basic', 'digest'];

type GetCommonDefaultFields = {
  nameRequired?: boolean;
  forConfig?: boolean;
};

/** `defaults` of the properties shared by the client and the request node. */
export function getCommonDefaultFields(params: GetCommonDefaultFields = {}): Record<keyof CommonNodeFields, any> {
  const { forConfig = false, nameRequired = false } = params;
  const typedFields = Object.entries(COMMON_FIELDS).map(([key, field]: [string, FieldSpec]) =>
    // a request node inherits what its client can give
    typedFieldDefaults(key, {
      value: field.value,
      valueType: field.valueType,
      type: field.inherit && !forConfig ? CONSTANTS.INHERIT_CLIENT_TERM : undefined,
    }),
  );
  return {
    name: { value: '', required: nameRequired },
    requestAuthKind: { value: forConfig ? 'none' : `${CONSTANTS.INHERIT_CLIENT_TERM}_or_none` },
    ...Object.assign({}, ...typedFields),
  } as Record<keyof CommonNodeFields, any>;
}
