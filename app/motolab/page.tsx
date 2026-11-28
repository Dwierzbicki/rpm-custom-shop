import type {Metadata} from 'next';
import StandaloneStorefrontHeader from '../components/storefront/StandaloneStorefrontHeader';
import StorefrontFooter from '../components/storefront/StorefrontFooter';
import MotoLabHub from './MotoLabHub';
export const metadata:Metadata={title:'MotoLab | RPM Custom',description:'RPM Custom — Power Builder, CR Calculator 3D, ITB Designer, Engine Hardware.'};
export default function MotoLabPage(){return <><StandaloneStorefrontHeader/><MotoLabHub hardwareActive={process.env.ENGINE_HARDWARE_PREVIEW==='1'} itbActive={Boolean(process.env.ITB_DESIGNER_ORIGIN?.trim())}/><StorefrontFooter/></>}
