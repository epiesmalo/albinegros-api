export const nextMatches = {
  firstTeam: {
    teamName: 'CD Castellón',
    opponent: 'Burgos CF',
    date: '18/04/2026',
    time: '18:30',
    stadium: 'SkyFi Castalia',
    competition: 'LaLiga Hypermotion',
  },
  bTeam: {
    teamName: 'Castellón B',
    opponent: 'Rival pendiente',
    date: '20/04/2026',
    time: '12:00',
    stadium: 'Campo del filial',
    competition: 'Liga del Castellón B',
  },
};

export const standings = {
  firstTeam: [
    { position: 1, team: 'Equipo 1', points: 70 },
    { position: 2, team: 'Equipo 2', points: 68 },
    { position: 3, team: 'CD Castellón', points: 66 },
    { position: 4, team: 'Equipo 4', points: 61 },
  ],
  bTeam: [
    { position: 1, team: 'Equipo B1', points: 55 },
    { position: 2, team: 'Castellón B', points: 53 },
    { position: 3, team: 'Equipo B3', points: 49 },
    { position: 4, team: 'Equipo B4', points: 44 },
  ],
};

export const calendar = {
  firstTeam: [
    { id: '1', match: 'CD Castellón vs Burgos CF', date: '18/04/2026 18:30' },
    { id: '2', match: 'Rival X vs CD Castellón', date: '25/04/2026 21:00' },
  ],
  bTeam: [
    { id: '3', match: 'Castellón B vs Rival B1', date: '20/04/2026 12:00' },
    { id: '4', match: 'Rival B2 vs Castellón B', date: '27/04/2026 17:00' },
  ],
};

export const news = [
  {
    id: '1',
    title: 'GERE Motor del Castellón',
    summary: '2 Goles, 1 Asistencia, 12 disparos, 31 partidos jugados',
    link: 'https://www.instagram.com/p/DXMQO4IjMjX/?igsh=MWp5dDdjZGw0dG9lcQ==',
    image: require('../assets/news/news1.png'),
  },
  {
    id: '2',
    title: 'El playoff pasa por Castalia',
    summary: 'Castellón VS Burgos, Sábado - 18:30H',
    link: 'https://www.instagram.com/p/DXLrtkDDEO3/?igsh=ajBoaHM0ZnY1ZjJn',
    image: require('../assets/news/news2.png'),
  },
  {
    id: '3',
    title: 'ALEX CALA',
    summary: 'Hay jugadores.. y hay momentos, yluego esta Álex Calatrava',
    link: 'https://www.instagram.com/p/DXJk-0nDIF7/?igsh=MTNhYXQ5ZzYyaXNuaQ==',
    image: require('../assets/news/news3.png'),
  },
];

export const ads = [
  {
    id: '1',
    title: 'OKIS SEGUROS',
    text: 'OKIS Agencia de Seguros e inversiones',
    link: 'https://www.okisagenciadeseguros.com',
    image: require('../assets/ads/ad1.png'),
  },
  {
    id: '2',
    title: 'REMEMBER PEÑISCOLA',
    text: 'El festival remember más importante de Castellón',
    link: 'https://peniscolaremember.com',
    image: require('../assets/ads/ad2.png'),
  },
  {
    id: '3',
    title: 'Official web CD CASTELLÓN',
    text: 'Accede a la web oficial del C.D.CASTELLÓN',
    link: 'https://www.cdcastellon.com/',
    image: require('../assets/ads/ad3.png'),
  },
];