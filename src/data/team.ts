export type TeamMember = {
  name: string;
  nameEn: string;
  role: string;
  roleEn: string;
  img: string;
  linkedin: string;
};

export const team: TeamMember[] = [
  {
    name: 'Ստեփան Խաչատրյան',
    nameEn: 'Stepan Khachatryan',
    role: 'Հիմնադիր · Հիդրոլոգ և ԱՏՀ վերլուծաբան',
    roleEn: 'Founder · Hydrologist & GIS analyst',
    img: '/assets/img/team/team_01.jpg',
    linkedin: 'https://www.linkedin.com/in/stepan-khachatryan-657b506a/',
  },
  {
    name: 'Հայկ Խաչատրյան',
    nameEn: 'Hayk Khachatryan',
    role: 'ԱՏՀ մասնագետ',
    roleEn: 'GIS specialist',
    img: '/assets/img/team/team_02.jpg',
    linkedin: 'https://www.linkedin.com/in/hayk-khachatryan-83a19429b/',
  },
  {
    name: 'Արամ Զաքարյան',
    nameEn: 'Aram Zakaryan',
    role: 'Գեոդեզիստ',
    roleEn: 'Geodesist',
    img: '/assets/img/team/team_03.jpg',
    linkedin: '',
  },
];
