import { AboutView } from '@/components/AboutView';
import { JsonLd } from '@/components/JsonLd';
import { team } from '@/data/team';
import { breadcrumbs, jsonLd, organizationId, pageMetadata, SITE_URL, url } from '@/lib/seo';

const title = 'Մեր մասին';
const description =
  'GeoGeeks-ը հիմնադրվել է 2021 թվականին։ Թիմը մատուցում է տեխնոլոգիական և գիտահեն հետազոտական ծառայություններ քաղաքաշինության, գյուղատնտեսության, աղետների ռիսկի, շրջակա միջավայրի և կրթության ոլորտներում:';

export const metadata = pageMetadata({
  path: '/about/',
  title,
  description,
  image: '/assets/img/team/team_01.jpg',
});

const schema = jsonLd(
  breadcrumbs([
    { name: 'Գլխավոր', path: '/' },
    { name: 'Մեր մասին', path: '/about/' },
  ]),
  {
    '@type': 'AboutPage',
    '@id': `${SITE_URL}/about/#page`,
    name: title,
    description,
    mainEntity: { '@id': organizationId },
  },
  {
    '@id': organizationId,
    employee: team.map((member) => ({
      '@type': 'Person',
      name: member.name,
      alternateName: member.nameEn,
      jobTitle: member.role,
      image: url(member.img),
      ...(member.linkedin ? { sameAs: [member.linkedin] } : {}),
    })),
  },
);

export default function AboutPage() {
  return (
    <>
      <JsonLd data={schema} />
      <AboutView />
    </>
  );
}
