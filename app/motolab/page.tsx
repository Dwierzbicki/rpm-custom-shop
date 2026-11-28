import type {Metadata} from 'next';
import StandaloneStorefrontHeader from '../components/storefront/StandaloneStorefrontHeader';
import StorefrontFooter from '../components/storefront/StorefrontFooter';
import MotoLabHub from './MotoLabHub';
import {getHardwareRelease} from '../engine-hardware/release-loader';
export const metadata:Metadata={title:'MotoLab | RPM Custom',description:'RPM Custom — Power Builder, CR Calculator 3D, ITB Designer, Engine Hardware.'};
export default function MotoLabPage(){const released=getHardwareRelease().ok;return <><StandaloneStorefrontHeader/><MotoLabHub hardwareActive={released||process.env.ENGINE_HARDWARE_PREVIEW==='1'} hardwareReleased={released} itbActive={Boolean(process.env.ITB_DESIGNER_ORIGIN?.trim())}/><StorefrontFooter/></>}
