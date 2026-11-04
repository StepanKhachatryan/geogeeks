import { WaterView } from '@/components/WaterView';
import { pageMetadata } from '@/lib/seo';

const title = 'Ջրային շերտեր';
const description =
  'Գետերի, լճերի և ջրանցքների շերտերը՝ PostGIS-ից վեկտորային սալիկներով, GeoGeeks-ի ջրային ԱՏՀ գործիքի համար:';

export const metadata = pageMetadata({
  path: '/water/',
  title,
  description,
  tabTitle: title,
});

export default function WaterPage() {
  return <WaterView />;
}
