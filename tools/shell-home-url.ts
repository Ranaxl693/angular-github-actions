/** Matches this workspace's local ports and packaged /remotes/<name>/ layout. */
export function shellHomeUrl(remoteBaseUri: string): string {
  const base = new URL(remoteBaseUri);
  if (['localhost', '127.0.0.1', '[::1]'].includes(base.hostname)) {
    base.port = '4200';
    base.pathname = '/';
    base.search = '';
    base.hash = '';
    return base.href;
  }
  if (!/\/remotes\/mfe[12]\/$/.test(base.pathname)) {
    throw new Error('Configure the shell home URL for this remote deployment layout.');
  }
  return new URL('../../', base).href;
}
