const express = require('express');
const router = express.Router();

const supabase = require('../config/supabase');

const {
  getDisplayTeamName,
  getTeamLogo,
} = require('../config/footballConfig');

const SPORTMONKS_BASE_URL =
  process.env.SPORTMONKS_BASE_URL ||
  'https://api.sportmonks.com/v3/football';

const SPORTMONKS_TOKEN =
  process.env.SPORTMONKS_TOKEN;

const SPORTMONKS_LALIGA2_ID =
  Number(process.env.SPORTMONKS_LALIGA2_ID || 567);

const sportmonksFetch = async (endpoint) => {
  if (!SPORTMONKS_TOKEN) {
    throw new Error(
      'SPORTMONKS_TOKEN no está configurado'
    );
  }

  const separator =
    endpoint.includes('?') ? '&' : '?';

  const response = await fetch(
    `${SPORTMONKS_BASE_URL}${endpoint}${separator}` +
      `api_token=${encodeURIComponent(
        SPORTMONKS_TOKEN
      )}`
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(JSON.stringify(data));
  }

  return data;
};

const getSportmonksFixturesRange = async (
  from,
  to
) => {
  const fixtures = [];

  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const data = await sportmonksFetch(
      `/fixtures/between/${from}/${to}` +
        `?include=participants;scores;state;league;round;venue` +
        `&filters=fixtureLeagues:${SPORTMONKS_LALIGA2_ID}` +
        `&per_page=50&page=${page}`
    );

    const pageFixtures =
      Array.isArray(data.data)
        ? data.data
        : [];

    fixtures.push(...pageFixtures);

    hasMore =
      data.pagination?.has_more === true;

    page += 1;
  }

  return fixtures;
};

const normalizeStatus = (fixture) => {
  const shortName =
    fixture.state?.short_name || '';

  const statusMap = {
    '1st': '1H',
    HT: 'HT',
    '2nd': '2H',
    ET: 'ET',
    FT: 'FT',
    NS: 'NS',
  };

  return (
    statusMap[shortName] ||
    shortName ||
    null
  );
};

const normalizeFixture = (fixture) => {
  const participants =
    fixture.participants || [];

  const scores =
    fixture.scores || [];

  const homeTeam = participants.find(
    (team) =>
      team.meta?.location === 'home'
  );

  const awayTeam = participants.find(
    (team) =>
      team.meta?.location === 'away'
  );

  const getCurrentScore = (
    participantId
  ) => {
    const score = scores.find(
      (item) =>
        item.participant_id ===
          participantId &&
        item.description === 'CURRENT'
    );

    return score?.score?.goals ?? null;
  };

  const statusShort =
    normalizeStatus(fixture);

  const hasStarted =
    statusShort !== 'NS';

  return {
    id: fixture.id,

    fixtureId: fixture.id,

    homeTeamId:
      homeTeam?.id ?? null,

    awayTeamId:
      awayTeam?.id ?? null,

    date: fixture.starting_at
      ? `${fixture.starting_at.replace(
          ' ',
          'T'
        )}Z`
      : null,

    round: fixture.round?.name
      ? `Regular Season - ${fixture.round.name}`
      : '',

    homeTeam: getDisplayTeamName(
      homeTeam?.name || ''
    ),

    awayTeam: getDisplayTeamName(
      awayTeam?.name || ''
    ),

    homeLogo: getTeamLogo(
      homeTeam?.name || '',
      homeTeam?.image_path || ''
    ),

    awayLogo: getTeamLogo(
      awayTeam?.name || '',
      awayTeam?.image_path || ''
    ),

    homeGoals:
      hasStarted && homeTeam
        ? getCurrentScore(homeTeam.id)
        : null,

    awayGoals:
      hasStarted && awayTeam
        ? getCurrentScore(awayTeam.id)
        : null,

    venue:
      fixture.venue?.name || '',

    statusShort,

    statusLong:
      fixture.state?.name || null,

    elapsed: null,

    extra: null,
  };
};

router.get(
  '/calendar/first-team',
  async (req, res) => {
    try {
      const dateRanges = [
        ['2026-08-01', '2026-10-31'],
        ['2026-11-01', '2027-01-31'],
        ['2027-02-01', '2027-04-30'],
        ['2027-05-01', '2027-06-30'],
      ];

      const rangeResults =
        await Promise.all(
          dateRanges.map(([from, to]) =>
            getSportmonksFixturesRange(
              from,
              to
            )
          )
        );

      const allFixtures =
        rangeResults.flat();

      const uniqueFixtures =
        Array.from(
          new Map(
            allFixtures.map(
              (fixture) => [
                String(fixture.id),
                fixture,
              ]
            )
          ).values()
        );

      const calendar =
        uniqueFixtures
          .map(normalizeFixture)
          .sort(
            (a, b) =>
              new Date(a.date) -
              new Date(b.date)
          );

      return res.json(calendar);
    } catch (sportmonksError) {
      console.error(
        'Error calendario Sportmonks:',
        sportmonksError
      );

      try {
        const {
          data,
          error,
        } = await supabase
          .from('calendar')
          .select('*')
          .order('date', {
            ascending: true,
          });

        if (error) {
          throw error;
        }

        return res.json(data || []);
      } catch (supabaseError) {
        console.error(
          'Error calendario Supabase:',
          supabaseError
        );

        return res.status(500).json({
          error:
            'No se pudo cargar el calendario',
        });
      }
    }
  }
);

module.exports = router;