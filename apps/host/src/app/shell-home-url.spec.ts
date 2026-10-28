import { shellHomeUrl } from '../../../../tools/shell-home-url';

describe('standalone remote redirect', () => {
  it('redirects local remote ports to shell home', () => {
    expect(shellHomeUrl('http://localhost:4201/')).toBe('http://localhost:4200/');
    expect(shellHomeUrl('http://localhost:4202/')).toBe('http://localhost:4200/');
  });

  it('preserves the shell subfolder in a Pages deployment', () => {
    expect(shellHomeUrl('https://example.com/portal/remotes/mfe1/')).toBe(
      'https://example.com/portal/',
    );
    expect(shellHomeUrl('https://example.com/portal/remotes/mfe2/')).toBe(
      'https://example.com/portal/',
    );
  });

  it('requires explicit configuration for an unknown deployment layout', () => {
    expect(() => shellHomeUrl('https://remote.example.com/')).toThrow('Configure the shell');
  });
});
