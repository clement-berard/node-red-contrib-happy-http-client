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
