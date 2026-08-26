// config/footballConfig.js

const CASTELLON_LOGO =
  'https://archivos.albinegroscastellon.com/cas.png?v=2';

/**
 * Convierte cualquier texto en una clave comparable.
 *
 * Ejemplos:
 * "C.D. Castellón" -> "cd castellon"
 * "UD Almería"     -> "ud almeria"
 */
const normalizeKey = (value = '') =>
  String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[.'’`´]/g, '')
    .replace(/[-_/]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

/**
 * Configuración centralizada de equipos.
 *
 * aliases:
 * Variaciones que podría devolver API-Football.
 *
 * displayName:
 * Nombre completo que guardaremos en calendario y clasificación.
 *
 * shortName:
 * Nombre reducido para tarjetas con poco espacio.
 *
 * stadium:
 * Estadio que utilizaremos cuando el equipo juegue como local.
 *
 * logo:
 * Solo es necesario cuando queremos sustituir el escudo de la API.
 */
const teams = [
  {
    aliases: [
      'AD Ceuta FC',
      'AD Ceuta',
      'Ceuta',
    ],
    displayName: 'AD CEUTA FC',
    shortName: 'CEUTA',
    stadium: 'Alfonso Murube',
  },

  {
    aliases: [
      'Albacete BP',
      'Albacete Balompié',
      'Albacete Balompie',
      'Albacete',
    ],
    displayName: 'ALBACETE BP',
    shortName: 'ALBACETE',
    stadium: 'Carlos Belmonte',
  },

  {
    aliases: [
      'Burgos CF',
      'Burgos',
    ],
    displayName: 'BURGOS CF',
    shortName: 'BURGOS',
    stadium: 'El Plantío',
  },

  {
    aliases: [
      'Cádiz CF',
      'Cadiz CF',
      'Cádiz',
      'Cadiz',
    ],
    displayName: 'CÁDIZ CF',
    shortName: 'CÁDIZ',
    stadium: 'Nuevo Mirandilla',
  },

  {
    aliases: [
      'CD Castellón',
      'CD Castellon',
      'C.D. Castellón',
      'C.D. Castellon',
      'Castellón',
      'Castellon',
    ],
    displayName: 'C.D. CASTELLÓN',
    shortName: 'CASTELLÓN',
    stadium: 'SkyFi Castalia',
    logo: CASTELLON_LOGO,
  },

  {
    aliases: [
      'CD Eldense',
      'Eldense',
    ],
    displayName: 'CD ELDENSE',
    shortName: 'ELDENSE',
    stadium: 'Nuevo Pepico Amat',
  },

  {
    aliases: [
      'CD Leganés',
      'CD Leganes',
      'Leganés',
      'Leganes',
    ],
    displayName: 'CD LEGANÉS',
    shortName: 'LEGANÉS',
    stadium: 'Butarque',
  },

  {
    aliases: [
      'CD Tenerife',
      'Tenerife',
    ],
    displayName: 'CD TENERIFE',
    shortName: 'TENERIFE',
    stadium: 'Heliodoro Rodríguez López',
  },

  {
    aliases: [
      'CE Sabadell',
      'CE Sabadell FC',
      'Sabadell',
    ],
    displayName: 'CE SABADELL',
    shortName: 'SABADELL',
    stadium: 'Nova Creu Alta',
  },

  {
    aliases: [
      'Celta Fortuna',
      'RC Celta Fortuna',
      'Celta de Vigo II',
      'Celta Vigo II',
      'Celta II',
    ],
    displayName: 'CELTA FORTUNA',
    shortName: 'CELTA FORTUNA',
    stadium: 'ABANCA Balaídos',
  },

  {
    aliases: [
      'Córdoba CF',
      'Cordoba CF',
      'Córdoba',
      'Cordoba',
    ],
    displayName: 'CÓRDOBA CF',
    shortName: 'CÓRDOBA',
    stadium: 'Nuevo Arcángel',
  },

  {
    aliases: [
      'FC Andorra',
      'Andorra',
    ],
    displayName: 'FC ANDORRA',
    shortName: 'ANDORRA',
    stadium: 'Nou Estadi de la FAF',
  },

  {
    aliases: [
      'Girona FC',
      'Girona',
    ],
    displayName: 'GIRONA FC',
    shortName: 'GIRONA',
    stadium: 'Montilivi',
  },

  {
    aliases: [
      'Granada CF',
      'Granada',
    ],
    displayName: 'GRANADA CF',
    shortName: 'GRANADA',
    stadium: 'Nuevo Los Cármenes',
  },

  {
    aliases: [
      'Real Sociedad II',
      'Real Sociedad B',
      'R. Sociedad B',
      'R Sociedad B',
      'Real Sociedad de Fútbol B',
      'Real Sociedad de Futbol B',
    ],
    displayName: 'REAL SOCIEDAD B',
    shortName: 'R. SOCIEDAD B',
    stadium: 'José Luis Orbegozo',
  },

  {
    aliases: [
      'RCD Mallorca',
      'Mallorca',
    ],
    displayName: 'RCD MALLORCA',
    shortName: 'MALLORCA',
    stadium: 'Estadi Mallorca Son Moix',
  },

  {
    aliases: [
      'Real Oviedo',
      'Oviedo',
    ],
    displayName: 'REAL OVIEDO',
    shortName: 'OVIEDO',
    stadium: 'Carlos Tartiere',
  },

  {
    aliases: [
      'Real Sporting',
      'Real Sporting de Gijón',
      'Real Sporting de Gijon',
      'Sporting Gijón',
      'Sporting Gijon',
      'Sporting',
    ],
    displayName: 'REAL SPORTING',
    shortName: 'SPORTING',
    stadium: 'El Molinón - Enrique Castro Quini',
  },

  {
    aliases: [
      'Real Valladolid CF',
      'Real Valladolid',
      'Valladolid',
    ],
    displayName: 'REAL VALLADOLID',
    shortName: 'VALLADOLID',
    stadium: 'José Zorrilla',
  },

  {
    aliases: [
      'SD Eibar',
      'Eibar',
    ],
    displayName: 'SD EIBAR',
    shortName: 'EIBAR',
    stadium: 'Ipurua',
  },

  {
    aliases: [
      'UD Almería',
      'UD Almeria',
      'Almería',
      'Almeria',
    ],
    displayName: 'UD ALMERÍA',
    shortName: 'ALMERÍA',
    stadium: 'UD Almería Stadium',
  },

  {
    aliases: [
      'UD Las Palmas',
      'Las Palmas',
    ],
    displayName: 'UD LAS PALMAS',
    shortName: 'LAS PALMAS',
    stadium: 'Estadio de Gran Canaria',
  },
];

/**
 * Índice rápido:
 *
 * "real sociedad ii" -> configuración de REAL SOCIEDAD B
 * "castellon"        -> configuración del C.D. CASTELLÓN
 */
const teamIndex = new Map();

teams.forEach((team) => {
  team.aliases.forEach((alias) => {
    const normalizedAlias = normalizeKey(alias);

    if (normalizedAlias) {
      teamIndex.set(normalizedAlias, team);
    }
  });
});

/**
 * Devuelve la configuración completa de un equipo.
 *
 * Si el equipo todavía no está configurado, devuelve una configuración
 * segura usando el nombre original de API-Football.
 */
const getTeamInfo = (apiName = '') => {
  const normalizedName = normalizeKey(apiName);

  if (!normalizedName) {
    return {
      aliases: [],
      displayName: '',
      shortName: '',
      stadium: '',
      logo: '',
      configured: false,
    };
  }

  const exactMatch = teamIndex.get(normalizedName);

  if (exactMatch) {
    return {
      ...exactMatch,
      configured: true,
    };
  }

  /**
   * Segunda comprobación para pequeñas variaciones.
   *
   * Ejemplo:
   * API-Football podría devolver:
   * "Real Sociedad II U23"
   *
   * Y seguiríamos detectando:
   * "Real Sociedad II"
   */
  const partialMatch = teams.find((team) =>
    team.aliases.some((alias) => {
      const normalizedAlias = normalizeKey(alias);

      if (!normalizedAlias || normalizedAlias.length < 5) {
        return false;
      }

      return (
        normalizedName.includes(normalizedAlias) ||
        normalizedAlias.includes(normalizedName)
      );
    })
  );

  if (partialMatch) {
    return {
      ...partialMatch,
      configured: true,
    };
  }

  const fallbackName = String(apiName).trim();

  return {
    aliases: [fallbackName],
    displayName: fallbackName.toUpperCase(),
    shortName: fallbackName.toUpperCase(),
    stadium: '',
    logo: '',
    configured: false,
  };
};

/**
 * Nombre completo para clasificación y calendario.
 */
const getDisplayTeamName = (apiName = '') =>
  getTeamInfo(apiName).displayName;

/**
 * Nombre corto para la Home y tarjetas pequeñas.
 */
const getShortTeamName = (apiName = '') =>
  getTeamInfo(apiName).shortName;

/**
 * Utiliza un logo personalizado cuando exista.
 * En los demás equipos conserva el logo de API-Football.
 */
const getTeamLogo = (apiName = '', apiLogo = '') =>
  getTeamInfo(apiName).logo || apiLogo || '';

/**
 * El estadio se obtiene según el equipo local.
 *
 * Si el equipo no está configurado, conserva el estadio
 * que devuelve API-Football.
 */
const getCorrectVenue = (homeTeamName = '', apiVenue = '') =>
  getTeamInfo(homeTeamName).stadium || apiVenue || '';

/**
 * Comprueba si un nombre corresponde al Castellón.
 */
const isCastellon = (teamName = '') => {
  const team = getTeamInfo(teamName);

  return team.displayName === 'C.D. CASTELLÓN';
};

/**
 * Nombres de competiciones.
 */
const competitions = {
  'LaLiga 2': 'LALIGA HYPERMOTION',
  'La Liga 2': 'LALIGA HYPERMOTION',
  'Segunda División': 'LALIGA HYPERMOTION',
  'Segunda Division': 'LALIGA HYPERMOTION',
  'Copa del Rey': 'COPA DEL REY',
  'Club Friendlies': 'AMISTOSO',
  Friendlies: 'AMISTOSO',
};

/**
 * Normaliza el nombre de la competición.
 */
const getCompetitionName = (apiName = '') => {
  const originalName = String(apiName || '').trim();

  if (!originalName) {
    return '';
  }

  return competitions[originalName] || originalName.toUpperCase();
};

module.exports = {
  CASTELLON_LOGO,
  teams,
  normalizeKey,
  getTeamInfo,
  getDisplayTeamName,
  getShortTeamName,
  getTeamLogo,
  getCorrectVenue,
  getCompetitionName,
  isCastellon,
};