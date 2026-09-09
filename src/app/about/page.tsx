import type { Metadata } from 'next';
import { AboutView } from '@/components/AboutView';

export const metadata: Metadata = {
  title: 'Մեր մասին',
  description:
    'GeoGeeks-ը հիմնադրվել է 2021 թվականին։ Թիմը մատուցում է տեխնոլոգիական և գիտահեն հետազոտական ծառայություններ քաղաքաշինության, գյուղատնտեսության, աղետների ռիսկի, շրջակա միջավայրի և կրթության ոլորտներում:',
};

export default function AboutPage() {
  return <AboutView />;
}
