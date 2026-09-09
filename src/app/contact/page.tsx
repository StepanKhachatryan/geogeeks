import type { Metadata } from 'next';
import { ContactView } from '@/components/ContactView';

export const metadata: Metadata = {
  title: 'Կապ',
  description:
    'Կապ GeoGeeks-ի հետ՝ Ադոնց 4/3, Երևան, Հայաստան, +374 (98) 09-80-06, geogeeksllc@gmail.com',
};

export default function ContactPage() {
  return <ContactView />;
}
