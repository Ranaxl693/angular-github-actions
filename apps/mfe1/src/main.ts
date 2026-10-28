import { shellHomeUrl } from '../../../tools/shell-home-url';

// The host loads ./Component directly; this entry runs only for standalone visits.
window.location.replace(shellHomeUrl(document.baseURI));
