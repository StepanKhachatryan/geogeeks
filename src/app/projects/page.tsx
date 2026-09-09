import type { Metadata } from 'next';
import { ProjectsView } from '@/components/ProjectsView';

export const metadata: Metadata = {
  title: 'Նախագծեր',
  description:
    'GeoGeeks-ի նախագծերն ըստ ոլորտների՝ հիդրոլոգիա, ջրհեղեղների մոդելավորում, ջրային ռեսուրսներ, քաղաքաշինություն, գյուղատնտեսություն, անտառային ոլորտ և GIS կրթություն:',
};

export default function ProjectsPage() {
  return <ProjectsView />;
}
