import {redirect} from 'next/navigation';
// /admin/editor is protected by middleware; the actual editor overlays the storefront.
export default function HomepageEditor(){redirect('/?rpmEdit=1')}
