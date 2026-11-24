export type Partner = {
  name: string;
  img: string;
  url: string;
};

/** `client_16.svg` is a monogram placeholder for a sole proprietor with no logo. */
export const partners: Partner[] = (
  [
    ['«Հետաքննող լրագրողներ» ՀԿ', 'client_01.jpg', 'https://mediafactory.am/'],
    ['«ԸԴՎԱՅԶ բիզնես և իրավաբանական խորհրդատվություն» ՍՊԸ', 'client_02.png', 'https://adwise.am/'],
    ['«Ինովացիոն լուծումների և տեխնոլոգիաների կենտրոն» հիմնադրամ', 'client_03.jpg', 'https://www.istc.am/'],
    ['«Վոլիոս նախագծային ինստիտուտ» ՓԲԸ', 'client_04.jpg', 'https://www.volios.am/'],
    ['«Միջուկային և ռադիացիոն անվտանգության գիտատեխնիկական կենտրոն» ՓԲԸ', 'client_05.jpg', 'https://nrsc-am.com/hy/'],
    ['ՀՀ ՇՄՆ «Բնապահպանական ծրագրերի իրականացման գրասենյակ» ՊՀ', 'client_06.jpg', 'https://www.facebook.com/epiu.am'],
    ['«Կամերտուն» ՓԲԸ', 'client_07.jpg', 'https://kamertoon.am/hy/'],
    ['«ՀՀ ԳԱԱ Ա․ Թախտանջյանի անվան բուսաբանության ինստիտուտ» ՊՈԱԿ', 'client_08.jpg', 'https://botany.am/hy/'],
    ['«Մոդուլ» ՍՊԸ', 'client_09.png', 'https://modul.am/'],
    [
      'ՀՀ ՇՄՆ «Շրջակա միջավայրի վրա ազդեցության փորձաքննական կենտրոն» ՊՈԱԿ',
      'Client_10.png',
      'https://environment.gov.am/%D5%B7%D6%80%D5%BB%D5%A1%D5%AF%D5%A1-%D5%B4%D5%AB%D5%BB%D5%A1%D5%BE%D5%A1%D5%B5%D6%80%D5%AB-%D5%BE%D6%80%D5%A1-%D5%A1%D5%A6%D5%A4%D5%A5%D6%81%D5%B8%D6%82%D5%A9%D5%B5%D5%A1%D5%B6-%D6%83%D5%B8%D6%80%D5%B1%D5%A1%D6%84%D5%B6%D5%B6%D5%A1%D5%AF%D5%A1%D5%B6-%D5%AF%D5%A5%D5%B6%D5%BF%D6%80%D5%B8%D5%B6-%D5%BA%D5%B8%D5%A1%D5%AF',
    ],
    ['«Ջրտուք» ՍՊԸ', 'client_11.jpg', 'https://www.jrtuk.am/'],
    ['«Ստեփանավանի երիտասարդական կենտրոն» ՀԿ', 'client_12.jpg', 'https://www.facebook.com/Stepyouthcenter/?locale=hy_AM'],
    ['«Սիմոնյան կրթական հիմնադրամ»', 'client_13.jpg', 'https://tumo.org/hy/'],
    ['Երևանի քաղաքապետարան', 'client_14.jpg', 'https://www.yerevan.am/hy/'],
    ['«ԱՐԱՄ ՊԵՏՐՈՍՅԱՆ ԼԵՈՆԻԴԻ» ԱՁ', 'client_16.svg', 'https://www.spyur.am/am/companies/aram-petrosyan/34292/'],
    ['«Սոլյուտոն» ՍՊԸ', 'client_15.png', 'https://www.soluton.am/hy'],
  ] as const
).map(([name, file, url]) => ({ name, url, img: '/assets/img/partners/' + file }));
