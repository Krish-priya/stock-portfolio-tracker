export function getErrorMessage(err) {
  if (err?.code === 'ERR_NETWORK' || err?.message === 'Network Error') {
    return 'Cannot reach the API server. If you are on the live site, refresh and try Continue as guest again.';
  }
  return err?.response?.data?.error || err?.message || 'Something went wrong';
}
