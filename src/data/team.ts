export type TeamMember = {
  name: string;
  nameEn: string;
  role: string;
  roleEn: string;
  img: string;
  /** The same portrait with its background removed, set on a coloured capsule. */
  cutout: string;
  linkedin: string;
};

export const team: TeamMember[] = [
  {
    name: 'Ստեփան Խաչատրյան',
    nameEn: 'Stepan Khachatryan',
    role: 'Հիմնադիր · Հիդրոլոգ և ԱՏՀ վերլուծաբան',
    roleEn: 'Founder · Hydrologist & GIS analyst',
    img: '/assets/img/team/team_01.jpg',
    cutout: '/assets/img/team/team_01_cut.webp',
    linkedin: 'https://www.linkedin.com/in/stepan-khachatryan-657b506a/',
  },
  {
    name: 'Հայկ Խաչատրյան',
    nameEn: 'Hayk Khachatryan',
    role: 'ԱՏՀ մասնագետ',
    roleEn: 'GIS specialist',
    img: '/assets/img/team/team_02.jpg',
    cutout: '/assets/img/team/team_02_cut.webp',
    linkedin: 'https://www.linkedin.com/in/hayk-khachatryan-83a19429b/',
  },
  {
    name: 'Արամ Զաքարյան',
    nameEn: 'Aram Zakaryan',
    role: 'Գեոդեզիստ · Գործընկեր',
    roleEn: 'Geodesist · Partner',
    img: '/assets/img/team/team_03.jpg',
    cutout: '/assets/img/team/team_03_cut.webp',
    linkedin: '',
  },
  {
    name: 'Մարինե Ոսկանյան',
    nameEn: 'Marine Voskanyan',
    role: 'Բնապահպան (ESG) · Գործընկեր',
    roleEn: 'Environmental specialist (ESG) · Partner',
    img: '/assets/img/team/team_04.jpg',
    cutout: '/assets/img/team/team_04_cut.webp',
    linkedin: 'https://www.linkedin.com/in/marine-voskanyan-esg/',
  },
];
