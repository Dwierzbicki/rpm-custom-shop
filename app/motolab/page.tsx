import type {Metadata} from 'next';
import StandaloneStorefrontHeader from '../components/storefront/StandaloneStorefrontHeader';
import StorefrontFooter from '../components/storefront/StorefrontFooter';
import MotoLabHub from './MotoLabHub';
export const metadata:Metadata={title:'MotoLab | RPM Custom',description:'RPM Custom — Power Builder, CR Calculator 3D, ITB Designer.'};
export default function MotoLabPage(){return <><StandaloneStorefrontHeader/><MotoLabHub itbActive={Boolean(process.env.ITB_DESIGNER_ORIGIN?.trim())}/><StorefrontFooter/></>}
