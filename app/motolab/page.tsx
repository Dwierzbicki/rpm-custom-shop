import {redirect} from 'next/navigation';
import {MOTOLAB_HOME} from '../lib/motolab-tools';
// Preserve saved links and old bookmarks without another landing screen.
export default function MotoLabPage(){redirect(MOTOLAB_HOME)}
