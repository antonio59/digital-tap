// Anonymous browser id from localStorage (`ldt_user_id`). Stored beside the
// token-derived userId so an erasure request can find every copy. It is not
// an authenticator: presenting it does not authorise a write.
const CLIENT_ID = /^[A-Za-z0-9_-]{8,128}$/

export function isClientId(value: string): boolean {
  return CLIENT_ID.test(value)
}
