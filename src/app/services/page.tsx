import type { Metadata } from 'next';
import { ServicesView } from '@/components/ServicesView';

export const metadata: Metadata = {
  title: 'Ծառայություններ',
  description:
    'ԱՏՀ (GIS) վերլուծություն և հեռահար զոնդավորում, ջրային ռեսուրսների և հիդրոլոգիական ծառայություններ, ջրհեղեղների մոդելավորում և GIS դասընթացներ:',
};

export default function ServicesPage() {
  return <ServicesView />;
}
