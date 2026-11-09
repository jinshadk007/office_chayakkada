import './style.css';
import {mountWorkspace} from './workspace.js';
import {safeReturnPath} from './auth/paths.js';
// Old email/login URLs return to the tea corner; there is no login page.
if(location.pathname!=='/')history.replaceState(null,'',safeReturnPath(new URLSearchParams(location.search).get('next'),location.origin));
mountWorkspace();
