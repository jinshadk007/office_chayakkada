import './style.css';
import './orattice.css';
import './cinematic.css';
import {mountWorkspace} from './workspace.js';
// One office, one address. Keep old bookmarks working without tenant routes.
if(location.pathname!=='/'||location.search||location.hash)history.replaceState(null,'','/');
mountWorkspace();
