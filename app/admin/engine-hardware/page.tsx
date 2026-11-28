import EngineHardwareAdmin from './EngineHardwareAdmin';
import {getHardwareRelease} from '../../engine-hardware/release-loader';
export const dynamic='force-dynamic';
export default function Page(){const check=getHardwareRelease();return <EngineHardwareAdmin releaseStatus={check.ok?{ready:true,revision:check.release.revision,errors:[]}:{ready:false,revision:null,errors:check.errors}}/>}
