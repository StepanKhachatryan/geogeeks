/**
 * Project seed data, ported from the per-sector pages of the previous site.
 * Sectors and projects are ordered as they should appear; adding a record here
 * is all that is needed for it to show up on the sector grid, the sector page
 * and (when it is the newest of its sector) the "latest projects" row on Home.
 */

const P = '/assets/img/ind_project_img/';
const T = '/assets/img/projects_img/';

export type Project = {
  /** URL segment under /projects/<sector>/ — stable, latin, unique per sector. */
  slug: string;
  title: string;
  client: string;
  /** Displayed verbatim; may be a range such as "2021 - 2024". */
  year: string;
  duration: string;
  tech: string[];
  desc: string;
  /** Card image used in grids. */
  card: string;
  /** Larger image used on the project page. */
  img: string;
};

export type Sector = {
  /** URL segment under /projects/ */
  key: string;
  title: string;
  titleEn: string;
  /** Tile image on the projects grid. */
  tile: string;
  items: Project[];
};

export const sectors: Sector[] = [
  {
    key: 'hydro',
    title: 'Հիդրոլոգիական հետազոտություններ',
    titleEn: 'Hydrological studies',
    tile: T + 'hydro_projects.jpg',
    items: [
      {
        slug: 'sarnaghbyur-reservoir',
        card: P + 'hydro_proj_02.jpg',
        img: P + 'hydro_proj_02_1.jpg',
        title: 'Սառնաղբյուրի ջրամբարի ջրհավաք ավազանի ջրաբանական ուսումնասիրություն',
        client: 'Մոդուլ ՍՊԸ',
        year: '2025',
        duration: '3 ամիս',
        tech: ['HEC-HMS', 'QGIS', 'RMC-BestFit', 'GEE'],
        desc: 'Նախագծի շրջանակներում իրականացվել է ջրամբարի ջրհավաք ավազանի հիդրոլոգիական տարրերի վերլուծություն: Հաշվարկվել է հոսքի նորմայի ապահովվածություն, առավելագույն ելքերի ապահովվածություն թե ՍՆիՊ-ի, թե ICOLD ստանդարտին համապատասխան։ Կատավել է անձրև-հոսք մոդելավորում։ Գնահատվել է նվազագույն ելքը և կլիմայական հնարավոր ազդեցությունները ըստ սցենարների։',
      },
      {
        slug: 'sevaberd-reservoir',
        card: P + 'hydro_proj_01.jpg',
        img: P + 'hydro_proj_01_1.jpg',
        title: 'Սևաբերդի ջրամբարի ջրհավաք ավազանի ջրաբանական ուսումնասիրություն',
        client: 'Մոդուլ ՍՊԸ',
        year: '2025',
        duration: '2 ամիս',
        tech: ['HEC-HMS', 'QGIS', 'RMC-BestFit', 'GEE'],
        desc: 'Նախագծի շրջանակներում իրականացվել է ջրամբարի ջրհավաք ավազանի հիդրոլոգիական տարրերի վերլուծություն: Հաշվարկվել է հոսքի նորմայի ապահովվածություն, առավելագույն ելքերի ապահովվածություն թե ՍՆիՊ-ի, թե ICOLD ստանդարտին համապատասխան։ Կատավել է անձրև-հոսք մոդելավորում։ Գնահատվել է նվազագույն ելքը և կլիմայական հնարավոր ազդեցությունները ըստ սցենարների։',
      },
    ],
  },
  {
    key: 'flood',
    title: 'Ջրհեղեղների մոդելավորում և ռիսկի գնահատում',
    titleEn: 'Flood modelling',
    tile: T + 'flood_projects.jpg',
    items: [
      {
        slug: 'urut-wwtp-flood-risk',
        card: P + 'frm_proj_03.jpg',
        img: P + 'frm_proj_03_1.jpg',
        title: 'Ուռուտ բնակավայրի կոյուղաջրերի մաքրման կայանի ջրհեղեղի ռիսկի գնահատում',
        client: 'Ջրտուք ՍՊԸ',
        year: '2025',
        duration: '2 ամիս',
        tech: ['HEC-RAS', 'HEC-HMS', 'QGIS', 'ArcGIS Pro'],
        desc: 'Ուռուտ բնակավայրի համար Ուռուտ գետի ափին կառուցվելիք կեղտաջրերի մաքրման կայանի համար կատարվել է մոդելավորում գետի առավելագույն ելքերի անցման պարագայում կայանի հնարավոր ջրածածկման ռիսկերը գնահատելու համար։ Բարձրությունների թվային մոդելի և առավելագույն ելքերի մուտքային տվյալներով օգտագործվել է HEC-RAS ծրագիրը, որպեսզի մոդելավորվի ջրի հնարավոր մակարդակները տարբեր ապահովվածության դեպքում։',
      },
      {
        slug: 'kamertoon-flood-risk',
        card: P + 'frm_proj_02.jpg',
        img: P + 'frm_proj_02_1.png',
        title: 'Կամերտուն բազմաֆունկցիոնալ համալիրի ջրհեղեղի ռիսկի գնահատում',
        client: 'Կամերտուն ՓԲԸ',
        year: '2025',
        duration: '2 ամիս',
        tech: ['HEC-RAS', 'QGIS'],
        desc: 'Կամերտուն բազմաֆունկցիոնալ համալիրը BREEAM սերտեֆիկացում ստանալու նպատակով, պատվիրակել է իրականացնել համալիրի ջրհեղեղի ռիսկի գնահատում։ Մեր կողմից իրականացվել է տարածքի ուսումնասիրություն, ջրհեղեղի հնարավոր աղբյուրների բացահայտում և մոդելավորում:',
      },
      {
        slug: 'anpp-debris-flow',
        card: P + 'frm_proj_01.jpg',
        img: P + 'frm_proj_01_1.jpg',
        title: 'ՀԱԷԿ անվտանգության վրա սելավային հնարավոր հոսքի ազդեցության վերլուծություն',
        client: '«Միջուկային և ռադիացիոն անվտանգության գիտատեխնիկական կենտրոն» ՓԲԸ',
        year: '2023',
        duration: '3 ամիս',
        tech: ['HEC-HMS', 'HEC-RAS', 'QGIS', 'Google Earth Engine'],
        desc: 'Իրականացվել է առկա տոպոգրաֆիական նյութերի ուսումնասիրում և թվայնացում։ Անձրև-հոսք մոդելի միջոցով տարանջատված ջրհավաք ավազանում հնարավոր առավելագույն ելքերի գնահատում։',
      },
    ],
  },
  {
    key: 'water',
    title: 'Ջրային ռեսուրսների կառավարում',
    titleEn: 'Water resources',
    tile: T + 'wr_projects.jpg',
    items: [
      {
        slug: 'yerevan-climate-risk',
        card: P + 'wr_proj_02.jpg',
        img: P + 'wr_proj_02_1.jpg',
        title: 'Երևան քաղաքի համար կլիմայի ռիսկերի և խոցելիության գնահատում',
        client: '«ԸԴՎԱՅԶ բիզնես և իրավաբանական խորհրատվություն» ՍՊԸ',
        year: '2022',
        duration: '4 ամիս',
        tech: ['խոցելիություն', 'հարմարվողականություն', 'QGIS'],
        desc: 'Նախագծի շրջանակում իրականացվել է Երևան քաղաքի ջրային ռեսուրսների ներկա իրավիճակի գնահատում և կլիմայական ռիսկերի վերլուծություն:',
      },
      {
        slug: 'sevan-vision-roadmap',
        card: P + 'wr_proj_01.jpg',
        img: P + 'wr_proj_01_1.JPG',
        title: 'Սևանի տեսլականի ճանապարհային քարտեզի մշակում',
        client: '«ԸԴՎԱՅԶ բիզնես և իրավաբանական խորհրատվություն» ՍՊԸ',
        year: '2022',
        duration: '10 ամիս',
        tech: ['Սևանա լիճ', 'ջրային հաշվեկշիռ', 'մոնիթորինգ'],
        desc: 'Նախագծի շրջանակներում իրականացվել է հիդրոլոգիական և ջրային ռեսուրսներին առնչվող հարցերի ուսումնասիրություն և տեսլականի մշակում:',
      },
      {
        slug: 'irrigation-demand-automation',
        card: P + 'irrig_proj_01.jpg',
        img: P + 'irrig_proj_01_1.jpg',
        title: 'Պիլոտային տարածքում ոռոգման ջրապահանջի հաշվարկի ավտոմատացում',
        client: '«Ինովացիոն Լուծումների և Տեխնոլոգիաների Կենտրոն» հիմնադրամ',
        year: '2022',
        duration: '1 ամիս',
        tech: ['QGIS', 'QField', 'Database Management'],
        desc: 'Նախագծի շրջանակում իրականացվել է պիլոտային տարածքի ոռոգման ջրապահանջի ավտոմատացում GIS միջավայրում: Հաշվարկվել է ոռոգման ընդհանուր ջրապահանջը՝ ելնելով հողամասի մակերեսից, մշակաբույսի տեսակից և ցանցի կորուստներից:',
      },
    ],
  },
  {
    key: 'urban',
    title: 'Քաղաքաշինություն',
    titleEn: 'Urban planning',
    tile: T + 'urban_projects.png',
    items: [
      {
        slug: 'stepanavan-landfill-siting',
        card: P + 'urban_proj_01.jpg',
        img: P + 'urban_proj_01_1.png',
        title: 'Ստեփանավան, Լոռի Բերդ և Գյուլագարակ համայնքների համար նոր աղբավայրի տեղանքի ընտրության հետազոտություն',
        client: '«Ստեփանավանի երիտասարդական կենտրոն» ՀԿ',
        year: '2025',
        duration: '3 ամիս',
        tech: ['GIS', 'GEE', 'Spatial analysis', 'waste management'],
        desc: 'Նախագծի շրջանակում իրականացվել է Ստեփանավան համայնքի առկա աղբավայրի ծավալի գնահատում։ Կիրառվել է ՀՀ քաղաքաշինական և բնապահպանական ոլորտի օրենսդրությունը աղբավայրի նոր տարածքի ընտրության համար։ Օրենսդրության չափանիշները կիրառվել են GIS միջավայրում և կատարվել է տարածական վերլուծություն։',
      },
    ],
  },
  {
    key: 'agri',
    title: 'Գյուղատնտեսություն',
    titleEn: 'Agriculture',
    tile: T + 'agri_projects.jpg',
    items: [
      {
        slug: 'arable-land-web-map',
        card: P + 'agri_proj_01.jpg',
        img: P + 'agri_proj_01_1.jpg',
        title: 'Գյուղատնտեսական ծրագրի վարելահողերի առցանց քարտեզի ստեղծում',
        client: '«ՀՀ ՇՄՆ Բնապահպանական ծրագրերի իրականացման գրասենյակ» ՊՀ',
        year: '2024',
        duration: '3 ամիս',
        tech: ['ArcGIS Online', 'Experience Builder', 'QGIS'],
        desc: 'Նախագծի շրջանակներում իրականացվել է թիրախային համայնքների վարելահողերի առցանց քարտեզի ստեղծում, որը ցույց է տալիս յուրաքանչյուր վարելահողի վերաբերյալ իրականացված միջոցառումների ծավալը:',
      },
    ],
  },
  {
    key: 'forest',
    title: 'Անտառային ոլորտ',
    titleEn: 'Forestry',
    tile: T + 'forest_projects.JPG',
    items: [
      {
        slug: 'beech-distribution-ecocrop',
        card: P + 'forest_proj_01.jpg',
        img: P + 'forest_proj_01_1.jpg',
        title: 'ՀՀ-ում հաճարենու տարածման սահմանների և կլիմայական ցուցանիշների կապի մոդելավորում GIS և EcoCrop մոդելներով',
        client: '«ՀՀ ԳԱԱ Ա․ Թախտանջյանի անվան բուսաբանության ինստիտուտ» ՊՈԱԿ',
        year: '2025',
        duration: '7 ամիս',
        tech: ['QGIS', 'R statistics', 'EcoCrop', 'Regression'],
        desc: 'Նախագծի շրջանակում վերլուծվել է ՀՀ հյուսիսարևելյան շրջանների կլիմայական պայմանները, տրվել տեղումների և ջերմաստիճանի տարածական բաշխում։ EcoCrop մոդելի միջոցով իրականացվել է հաճարենու աճի պայմանների մոդելավորում 2100 կլիմայական սցենարի պայմաններում։',
      },
    ],
  },
  {
    key: 'edu',
    title: 'GIS կրթություն',
    titleEn: 'GIS education',
    tile: T + 'edu_projects.jpg',
    items: [
      {
        slug: 'eia-center-training',
        card: P + 'edu_proj_03.png',
        img: P + 'edu_proj_03_1.jpg',
        title: '«ՀՀ ՇՄՆ Շրջակա միջավայրի վրա ազդեցության փորձաքննական կենտրոն» ՊՈԱԿ աշխատակիցների GIS վերապատրաստում',
        client: '«ՀՀ ՇՄՆ Շրջակա միջավայրի վրա ազդեցության փորձաքննական կենտրոն» ՊՈԱԿ',
        year: '2025',
        duration: '3 ամիս',
        tech: ['QGIS', 'ESIA', 'Spatial Analysis'],
        desc: 'Դասընթացը նախատեսված է մասնագետների համար, ովքեր ցանկանում են տիրապետել QGIS ծրագրային փաթեթին՝ շրջակա միջավայրի վրա ազդեցության գնահատման նպատակով:',
      },
      {
        slug: 'volios-training',
        card: P + 'edu_proj_02.jpg',
        img: P + 'edu_proj_02_1.jpg',
        title: '«Վոլիոս նախագծային ինստիտուտ» ՓԲԸ աշխատակիցների GIS վերապատրաստում',
        client: '«Վոլիոս նախագծային ինստիտուտ» ՓԲԸ',
        year: '2022',
        duration: '2 ամիս',
        tech: ['QGIS', 'Digital Infrastructure', 'Mapping'],
        desc: 'Անձնակազմի վերապատրաստում ՀԷՑ-ի ենթակառուցվածքների թվայնացման և տարածական տվյալների կառավարման նպատակով:',
      },
      {
        slug: 'hetq-media-factory',
        card: P + 'edu_proj_01.jpg',
        img: P + 'edu_proj_01_1.jpg',
        title: 'Հետք մեդիա գործարան — Տվյալահեն լրագրություն',
        client: 'Հետաքննող լրագրողներ ՀԿ',
        year: '2021 - 2024',
        duration: '22 ամիս',
        tech: ['QGIS', 'Data Journalism', 'Spatial Media'],
        desc: 'Հայաստանում առաջին փորձն է արվել GIS կիրառել լրագրությունում։ Ուսանողների կողմից իրականացվել են բազմաթիվ հետաքննական աշխատանքներ՝ հիմնված տարածական վերլուծությունների վրա:',
      },
    ],
  },
  {
    key: 'our',
    title: 'Մեր նախագծերը',
    titleEn: 'All our projects',
    tile: T + 'our_projects.jpg',
    items: [
      {
        slug: 'flood-information-platform',
        card: P + 'our_proj_01.jpg',
        img: P + 'our_proj_01_1.jpg',
        title: 'ՀՀ-ում ջրհեղեղների տեղեկատվական հարթակ',
        client: 'Սեփական նախաձեռնություն · fiparmenia.netlify.app',
        year: '2026',
        duration: 'Շարունակական',
        tech: ['HTML', 'CSS', 'JavaScript', 'GitHub'],
        desc: 'Հարթակը մեր մտահաղացումն ու նախաձեռնությունն է, որը նպատակ ունի հավաքագրելու տարբեր սոցիալական հարթակներում օգտատերերի կողմից ջրհեղեղների վերաբերյալ տեսանյութերի հրապարակումները։',
      },
    ],
  },
];

export function getSector(key: string): Sector | undefined {
  return sectors.find((s) => s.key === key);
}

export function getProject(sectorKey: string, slug: string): Project | undefined {
  return getSector(sectorKey)?.items.find((p) => p.slug === slug);
}

/** Last four digits of the year field, so ranges such as "2021 - 2024" sort by their end. */
function yearNum(year: string): number {
  return parseInt(year.slice(-4), 10) || 0;
}

/**
 * The three newest projects across sectors: the most recent project of each
 * sector, own-initiative work excluded (it already carries the home hero),
 * sorted by year and cut to three. Computed so the row follows new data.
 */
export function latestProjects(limit = 3) {
  return sectors
    .filter((sector) => sector.key !== 'our' && sector.items.length > 0)
    .map((sector) => {
      const newest = sector.items.reduce((a, b) => (yearNum(b.year) > yearNum(a.year) ? b : a));
      return { sector, project: newest };
    })
    .sort((a, b) => yearNum(b.project.year) - yearNum(a.project.year))
    .slice(0, limit);
}
