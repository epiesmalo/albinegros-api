import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAudioPlayer } from 'expo-audio';
import { Stack } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Easing, Image, PanResponder, Platform, Pressable, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Team = 'home' | 'away';
type Mode = 'local' | 'ai' | 'quick' | null;
type Rival = { name: string; level: string; division: number; color: string; border: string; accent?: string; pattern: 'solid' | 'stripes' | 'halves'; accuracy: number; tactics: number };
const RIVALS: Rival[] = [
  { name: 'Hércules', level: 'LOS COMIENZOS', division: 6, color: '#1768C5', border: '#E8F1FF', accent: '#FFFFFF', pattern: 'solid', accuracy: 0.46, tactics: 0.0 },
  { name: 'Nàstic', level: 'LOS COMIENZOS', division: 6, color: '#C92236', border: '#F7F7F7', accent: '#FFFFFF', pattern: 'stripes', accuracy: 0.483, tactics: 0.043 },
  { name: 'Murcia', level: 'LOS COMIENZOS', division: 6, color: '#A71E35', border: '#F4F4F4', accent: '#FFFFFF', pattern: 'solid', accuracy: 0.505, tactics: 0.087 },
  { name: 'Ibiza', level: 'LOS COMIENZOS', division: 6, color: '#70C8E8', border: '#FFFFFF', accent: '#153A72', pattern: 'solid', accuracy: 0.528, tactics: 0.13 },
  { name: 'Zaragoza', level: 'EL DESAFÍO', division: 5, color: '#F7F7F7', border: '#1C4E98', accent: '#1C4E98', pattern: 'solid', accuracy: 0.55, tactics: 0.174 },
  { name: 'Almería', level: 'EL DESAFÍO', division: 5, color: '#E53945', border: '#FFFFFF', accent: '#FFFFFF', pattern: 'stripes', accuracy: 0.573, tactics: 0.217 },
  { name: 'Mallorca', level: 'EL DESAFÍO', division: 5, color: '#AE1C32', border: '#111111', accent: '#111111', pattern: 'solid', accuracy: 0.596, tactics: 0.261 },
  { name: 'Girona', level: 'EL DESAFÍO', division: 5, color: '#F04848', border: '#FFFFFF', accent: '#FFFFFF', pattern: 'stripes', accuracy: 0.618, tactics: 0.304 },
  { name: 'Villarreal', level: 'COMPETITIVOS', division: 4, color: '#F6DA24', border: '#174080', accent: '#174080', pattern: 'solid', accuracy: 0.641, tactics: 0.348 },
  { name: 'Levante', level: 'COMPETITIVOS', division: 4, color: '#173C84', border: '#A21C47', accent: '#A21C47', pattern: 'stripes', accuracy: 0.663, tactics: 0.391 },
  { name: 'Espanyol', level: 'COMPETITIVOS', division: 4, color: '#2678C5', border: '#FFFFFF', accent: '#FFFFFF', pattern: 'stripes', accuracy: 0.686, tactics: 0.435 },
  { name: 'Deportivo', level: 'COMPETITIVOS', division: 4, color: '#1E63B8', border: '#FFFFFF', accent: '#FFFFFF', pattern: 'stripes', accuracy: 0.709, tactics: 0.478 },
  { name: 'Valencia', level: 'PROFESIONALES', division: 3, color: '#F5F5F5', border: '#171717', accent: '#F08A24', pattern: 'halves', accuracy: 0.731, tactics: 0.522 },
  { name: 'Betis', level: 'PROFESIONALES', division: 3, color: '#15935C', border: '#FFFFFF', accent: '#FFFFFF', pattern: 'stripes', accuracy: 0.754, tactics: 0.565 },
  { name: 'Sevilla', level: 'PROFESIONALES', division: 3, color: '#FAFAFA', border: '#C92539', accent: '#C92539', pattern: 'solid', accuracy: 0.777, tactics: 0.609 },
  { name: 'Real Sociedad', level: 'PROFESIONALES', division: 3, color: '#1D67B8', border: '#FFFFFF', accent: '#FFFFFF', pattern: 'stripes', accuracy: 0.799, tactics: 0.652 },
  { name: 'Bilbao', level: 'LA ÉLITE', division: 2, color: '#B91E32', border: '#FFFFFF', accent: '#FFFFFF', pattern: 'stripes', accuracy: 0.822, tactics: 0.696 },
  { name: 'Atlético de Madrid', level: 'LA ÉLITE', division: 2, color: '#E12B3D', border: '#FFFFFF', accent: '#FFFFFF', pattern: 'stripes', accuracy: 0.844, tactics: 0.739 },
  { name: 'Barcelona', level: 'LA ÉLITE', division: 2, color: '#153C88', border: '#971C4A', accent: '#971C4A', pattern: 'stripes', accuracy: 0.867, tactics: 0.783 },
  { name: 'Real Madrid', level: 'LA ÉLITE', division: 2, color: '#F9F9F9', border: '#D7B35E', accent: '#D7B35E', pattern: 'solid', accuracy: 0.89, tactics: 0.826 },
  { name: 'Bayern de Múnich', level: 'LEYENDAS DE EUROPA', division: 1, color: '#D21D39', border: '#FFFFFF', accent: '#FFFFFF', pattern: 'solid', accuracy: 0.912, tactics: 0.87 },
  { name: 'Liverpool', level: 'LEYENDAS DE EUROPA', division: 1, color: '#B91330', border: '#E9D1A0', accent: '#E9D1A0', pattern: 'solid', accuracy: 0.935, tactics: 0.913 },
  { name: 'Manchester City', level: 'LEYENDAS DE EUROPA', division: 1, color: '#77C7E9', border: '#FFFFFF', accent: '#FFFFFF', pattern: 'solid', accuracy: 0.957, tactics: 0.957 },
  { name: 'Arsenal', level: 'LEYENDAS DE EUROPA', division: 1, color: '#D51E32', border: '#F8F8F8', accent: '#FFFFFF', pattern: 'halves', accuracy: 0.98, tactics: 1.0 },
];
// Equipos locales para el modo DOS JUGADORES (sin afectar al Modo Carrera).
const LOCAL_RIVALS: Rival[] = [
  { name: 'Cervantes', level: 'DOS JUGADORES', division: 0, color: '#E6B947', border: '#137044', accent: '#B9362D', pattern: 'stripes', accuracy: 0, tactics: 0 },
  { name: 'Deportivo', level: 'DOS JUGADORES', division: 0, color: '#FFFFFF', border: '#9DA4AB', accent: '#FFFFFF', pattern: 'solid', accuracy: 0, tactics: 0 },
  { name: 'Obelisco', level: 'DOS JUGADORES', division: 0, color: '#B8916B', border: '#E8D2B6', accent: '#B8916B', pattern: 'solid', accuracy: 0, tactics: 0 },
  { name: 'Castalia', level: 'DOS JUGADORES', division: 0, color: '#45494F', border: '#B5B8BD', accent: '#45494F', pattern: 'solid', accuracy: 0, tactics: 0 },
  { name: 'Regional', level: 'DOS JUGADORES', division: 0, color: '#781C39', border: '#D5A5B4', accent: '#781C39', pattern: 'solid', accuracy: 0, tactics: 0 },
  { name: 'Ribalta', level: 'DOS JUGADORES', division: 0, color: '#164B35', border: '#9CB8A6', accent: '#164B35', pattern: 'solid', accuracy: 0, tactics: 0 },
];

const CAREER_KEY = '@albinegros_chapas/career_v2';
const LEGACY_CAREER_KEY = '@albinegros_chapas/career_v1';
const TARGET_GOALS = 3;
type Body = { id: string; team?: Team; x: number; y: number; vx: number; vy: number; r: number; mass: number };
type Aim = { id: string; x: number; y: number } | null;
const GOLD = '#C9A45C';
const HOME_EFFECT = '#101010';
const LINE = 'rgba(255,255,255,0.82)';
const INITIAL = [
  ['h1', 'home', 0.50, 0.80], ['h2', 'home', 0.24, 0.69], ['h3', 'home', 0.76, 0.69],
  ['h4', 'home', 0.35, 0.57], ['h5', 'home', 0.65, 0.57],
  ['a1', 'away', 0.50, 0.20], ['a2', 'away', 0.24, 0.31], ['a3', 'away', 0.76, 0.31],
  ['a4', 'away', 0.35, 0.43], ['a5', 'away', 0.65, 0.43],
] as const;

function createBodies(w: number, h: number): Body[] {
  const r = Math.max(15, Math.min(21, w * 0.055));
  return [
    ...INITIAL.map(([id, team, x, y]) => ({ id, team, x: w * x, y: h * y, vx: 0, vy: 0, r, mass: 3 })),
    { id: 'ball', x: w / 2, y: h / 2, vx: 0, vy: 0, r: 10, mass: 1 },
  ];
}
// Fase 5.3: chapa 3D con canto metálico y reflejos, sin cambiar el radio físico.
// Capas RN View: sombra, cuerpo lateral, aro biselado, cara superior y brillo.
function Disc({ team, size = 44, rival }: { team: Team; size?: number; rival?: Rival }) {
  const home = team === 'home';
  const s = size;
  const face = s * .78;
  const shell = s * .94;
  const inset = (s - shell) / 2;
  const faceColor = home ? '#F5F5F5' : rival?.color ?? '#FFDE24';
  const borderColor = home ? '#171717' : rival?.border ?? '#E9F2FF';
  return (
    <View style={{ width: s, height: s, alignItems: 'center', justifyContent: 'center' }}>
      {/* Sombra de contacto: el disco se separa visualmente del césped. */}
      <View style={{ position: 'absolute', left: s * .075, top: s * .19, width: s * .89, height: s * .79,
        borderRadius: s / 2, backgroundColor: 'rgba(0,0,0,0.60)', elevation: 3 }} />
      {/* Canto lateral de acero oscuro, desplazado hacia abajo para simular altura. */}
      <View style={{ position: 'absolute', left: inset, top: s * .105, width: shell, height: shell * .90,
        borderRadius: shell / 2, backgroundColor: '#58646D', borderWidth: Math.max(1, s * .025),
        borderColor: '#273038', overflow: 'hidden' }}>
        <View style={{ position: 'absolute', left: '7%', right: '7%', bottom: '5%', height: '24%',
          borderRadius: s, backgroundColor: '#263038' }} />
        <View style={{ position: 'absolute', left: '10%', top: '8%', width: '28%', height: '68%',
          borderRadius: s, backgroundColor: 'rgba(255,255,255,0.25)' }} />
      </View>
      {/* Aro superior metálico con doble bisel. */}
      <View style={{ position: 'absolute', left: inset, top: s * .015, width: shell, height: shell,
        borderRadius: shell / 2, backgroundColor: '#B9C2C8', borderWidth: Math.max(1.6, s * .045),
        borderColor: '#F5F7F9', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
        <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '28%',
          backgroundColor: 'rgba(34,45,55,0.48)' }} />
        <View style={{ width: face + s * .045, height: face + s * .045,
          borderRadius: s / 2, backgroundColor: '#63717B', alignItems: 'center', justifyContent: 'center' }}>
          <View style={{ width: face, height: face, borderRadius: face / 2,
            backgroundColor: faceColor, borderWidth: Math.max(1.8, s * .057), borderColor,
            alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
            <View style={{ width: '82%', height: '82%', borderRadius: face * .12,
              overflow: 'hidden', flexDirection: 'row', alignItems: 'stretch' }}>
              {home ? (
                [0, 1, 2, 3, 4].map(i => <View key={i} style={{ flex: 1, backgroundColor: i % 2 ? '#FFFFFF' : '#111111' }} />)
              ) : rival?.name === 'Cervantes' ? (
                <View style={{ flex: 1 }}>
                  <View style={{ height: '28%', backgroundColor: '#137044' }} />
                  <View style={{ flex: 1, flexDirection: 'row' }}>{Array.from({ length: 8 }, (_, i) => <View key={i} style={{ flex: 1, backgroundColor: i % 2 === 0 ? '#D13D32' : '#F5C84E' }} />)}</View>
                </View>
              ) : rival?.pattern === 'stripes' ? (
                [0, 1, 2, 3, 4].map(i => <View key={i} style={{ flex: 1, backgroundColor: i % 2 ? rival.border : rival.color }} />)
              ) : rival?.pattern === 'halves' ? (
                <><View style={{ flex: 1, backgroundColor: rival.color }} /><View style={{ flex: 1, backgroundColor: rival.border }} /></>
              ) : (
                <View style={{ flex: 1, backgroundColor: faceColor }} />
              )}
            </View>
            {/* Detalle central original, sin escudos ni marcas oficiales. */}
            <View style={{ position: 'absolute', width: face * .22, height: face * .22,
              borderRadius: face * .11, backgroundColor: home ? '#FFFFFF' : rival?.accent ?? '#FFFFFF',
              borderWidth: Math.max(1, s * .025), borderColor: home ? '#171717' : rival?.color ?? '#171717' }} />
            {/* Brillo curvo superior y sombreado inferior. */}
            <View style={{ position: 'absolute', top: '5%', left: '9%', right: '9%', height: '25%',
              borderTopLeftRadius: face, borderTopRightRadius: face,
              backgroundColor: 'rgba(255,255,255,0.27)' }} />
            <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '15%',
              backgroundColor: 'rgba(0,0,0,0.12)' }} />
          </View>
        </View>
        <View style={{ position: 'absolute', top: '8%', left: '12%', width: '31%', height: '7%',
          borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.73)',
          transform: [{ rotate: '-22deg' }] }} />
      </View>
    </View>
  );
}

// Fase 2.3: las colisiones usan las mismas líneas que se dibujan.
// Las líneas exteriores están al 5 % de los lados y al 3 % de los fondos.
const RESTITUTION = 0.78;
const DRAG = 0.974;
const STOP_SPEED = 0.09;
const MAX_DRAG = 130;
const SIDE_LINE = 0.05;
const END_LINE = 0.03;
const GOAL_LEFT = 0.345;
const GOAL_RIGHT = 0.655;

function step(bodies: Body[], w: number, h: number, onImpact?: (x: number, y: number, intensity: number) => void): Team | null {
  const left = w * SIDE_LINE;
  const right = w * (1 - SIDE_LINE);
  const top = h * END_LINE;
  const bottom = h * (1 - END_LINE);
  const goalLeft = w * GOAL_LEFT;
  const goalRight = w * GOAL_RIGHT;

  const contain = (b: Body): Team | null => {
    // El balón cruza la línea de gol con su centro y debe caber entre postes.
    // Se valida ANTES de rebotar contra la pared de fondo.
    const ball = b.id === 'ball';
    const insideMouth = ball && b.x - b.r >= goalLeft && b.x + b.r <= goalRight;
    if (insideMouth && b.y <= top) return 'home';
    if (insideMouth && b.y >= bottom) return 'away';

    // Banda: la chapa/pelota no puede sobrepasar la línea blanca.
    if (b.x - b.r < left) {
      b.x = left + b.r;
      b.vx = Math.abs(b.vx) * RESTITUTION;
    } else if (b.x + b.r > right) {
      b.x = right - b.r;
      b.vx = -Math.abs(b.vx) * RESTITUTION;
    }

    // Las chapas también pueden cruzar la línea de gol por dentro de la
    // portería. Los postes y el fondo exterior siguen siendo sólidos.
    // El balón conserva exactamente la detección de gol anterior.
    const discInMouth = !ball && b.x - b.r >= goalLeft && b.x + b.r <= goalRight;
    if (discInMouth) {
      // El fondo de la red coincide con el borde interior del tablero.
      if (b.y - b.r < 0) {
        b.y = b.r;
        b.vy = Math.abs(b.vy) * RESTITUTION;
      } else if (b.y + b.r > h) {
        b.y = h - b.r;
        b.vy = -Math.abs(b.vy) * RESTITUTION;
      }
    } else if (!insideMouth) {
      // Fuera de la boca de gol, la línea de fondo es una pared.
      if (b.y - b.r < top) {
        b.y = top + b.r;
        b.vy = Math.abs(b.vy) * RESTITUTION;
      } else if (b.y + b.r > bottom) {
        b.y = bottom - b.r;
        b.vy = -Math.abs(b.vy) * RESTITUTION;
      }
    }
    // Si una chapa está detrás de la línea de gol, no puede atravesar
    // lateralmente ninguno de los dos postes.
    if (!ball && (b.y - b.r < top || b.y + b.r > bottom)) {
      if (b.x < goalLeft + b.r && b.x + b.r > goalLeft) {
        b.x = goalLeft + b.r;
        b.vx = Math.abs(b.vx) * RESTITUTION;
      } else if (b.x > goalRight - b.r && b.x - b.r < goalRight) {
        b.x = goalRight - b.r;
        b.vx = -Math.abs(b.vx) * RESTITUTION;
      }
    }
    return null;
  };

  for (const b of bodies) {
    b.x += b.vx;
    b.y += b.vy;
    b.vx *= DRAG;
    b.vy *= DRAG;
    if (Math.hypot(b.vx, b.vy) < STOP_SPEED) {
      b.vx = 0;
      b.vy = 0;
    }
    const goal = contain(b);
    if (goal) return goal;
  }

  // Colisiones entre chapas y balón, con separación según su masa.
  for (let i = 0; i < bodies.length; i++) {
    for (let j = i + 1; j < bodies.length; j++) {
      const a = bodies[i], b = bodies[j];
      let dx = b.x - a.x, dy = b.y - a.y;
      let d = Math.hypot(dx, dy);
      const minimum = a.r + b.r;
      if (d >= minimum) continue;
      if (d < 0.0001) { dx = 1; dy = 0; d = 1; }
      const nx = dx / d, ny = dy / d;
      const overlap = minimum - d;
      const wa = b.mass / (a.mass + b.mass);
      const wb = a.mass / (a.mass + b.mass);
      a.x -= nx * overlap * wa; a.y -= ny * overlap * wa;
      b.x += nx * overlap * wb; b.y += ny * overlap * wb;
      const relative = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
      if (relative >= 0) continue;
      if (relative < -1.6) onImpact?.((a.x + b.x) / 2, (a.y + b.y) / 2, -relative);
      const impulse = -(1 + 0.84) * relative / (1 / a.mass + 1 / b.mass);
      a.vx -= impulse * nx / a.mass; a.vy -= impulse * ny / a.mass;
      b.vx += impulse * nx / b.mass; b.vy += impulse * ny / b.mass;
    }
  }

  // La separación tras las colisiones también debe respetar las líneas.
  for (const b of bodies) {
    const goal = contain(b);
    if (goal) return goal;
  }
  return null;
}

function Pitch({ mode, onExit, rival, onCareerWin, onSoundModeChange, initialSoundMode = 0, promotionActive }: { mode: Exclude<Mode, null>; onExit: () => void; rival?: Rival; onCareerWin?: (soundMode: 0 | 1 | 2) => void; onSoundModeChange?: (value: 0 | 1 | 2) => void; initialSoundMode?: 0 | 1 | 2; promotionActive?: boolean }) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const w = Math.min(width - 22, 430);
  const h = Math.min(Math.round(w * 1.60), Math.max(320, height - insets.top - insets.bottom - 188));
  const bodiesRef = useRef<Body[]>(createBodies(w, h));
  const [bodies, setBodies] = useState<Body[]>(() => bodiesRef.current.map(b => ({ ...b })));
  const [aim, setAim] = useState<Aim>(null);
  const aimRef = useRef<Aim>(null);
  // Un único pulso animado para las chapas del equipo al que le toca.
  const turnPulse = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(turnPulse, { toValue: 1, duration: 1050, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      Animated.timing(turnPulse, { toValue: 0, duration: 1050, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [turnPulse]);
  // Sonidos originales, locales y sin conexión a internet.
  const kickSound = useAudioPlayer(require('../../assets/sounds/chapas_golpe.wav'));
  // Fase 7.8: audios propios del Castellón y efecto arcade original del rival.
  const homeGoalSound = useAudioPlayer(require('../../assets/sounds/chapas_gol_castellon.mp3'));
  const homeVictorySound = useAudioPlayer(require('../../assets/sounds/chapas_victoria_castellon.mp3'));
  const awayGoalSound = useAudioPlayer(require('../../assets/sounds/chapas_gol_rival_arcade.wav'));
  const stadiumSound = useAudioPlayer(require('../../assets/sounds/chapas_ambiente.mp3'));
  const turnSound = useAudioPlayer(require('../../assets/sounds/chapas_turno.wav'));
  const whistleSound = useAudioPlayer(require('../../assets/sounds/chapas_silbato_arbitro.wav'));
  // Ciclo: sonido completo -> solo efectos FX -> silencio -> sonido completo.
  const [soundMode, setSoundMode] = useState<0 | 1 | 2>(initialSoundMode);
  useEffect(() => { onSoundModeChange?.(soundMode); }, [soundMode, onSoundModeChange]);
  useEffect(() => { if (promotionActive) { try { homeVictorySound.pause(); homeGoalSound.pause(); stadiumSound.pause(); } catch {} } }, [promotionActive, homeVictorySound, homeGoalSound, stadiumSound]);
  const soundRef = useRef(true);
  soundRef.current = soundMode !== 2;
  // El ambiente solo existe mientras Pitch está montado; no suena en los menús.
  // Solo en modo completo suena el ambiente; en FX se pausa sin perder la posición.
  useEffect(() => {
    stadiumSound.loop = true;
    stadiumSound.volume = 0.27;
    if (soundMode === 0) {
      try { stadiumSound.play(); } catch { /* audio opcional */ }
    } else {
      try { stadiumSound.pause(); } catch { /* audio opcional */ }
    }
    return () => { try { stadiumSound.pause(); } catch { /* audio opcional */ } };
  }, [stadiumSound, soundMode]);
  useEffect(() => {
    const volume = soundMode === 2 ? 0 : 1;
    kickSound.volume = volume;
    turnSound.volume = volume;
    whistleSound.volume = volume;
    homeGoalSound.volume = volume;
    homeVictorySound.volume = volume;
    awayGoalSound.volume = volume;
  }, [soundMode, kickSound, turnSound, homeGoalSound, homeVictorySound, awayGoalSound, whistleSound]);
  const playEffect = useCallback((player: typeof kickSound) => {
    if (!soundRef.current) return;
    try { void player.seekTo(0).then(() => player.play()).catch(() => {}); } catch { /* audio opcional */ }
  }, []);
  const [impact, setImpact] = useState<{ x: number; y: number; id: number } | null>(null);
  const lastImpact = useRef(0);
  const impactCounter = useRef(0);
  const impactTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const turnOpacity = useRef(new Animated.Value(0)).current;
  const goalScale = useRef(new Animated.Value(0)).current;
  const [goalBanner, setGoalBanner] = useState<Team | null>(null);
  const goalTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const turnTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const whistleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const showTurn = useCallback(() => {
    turnOpacity.stopAnimation(); turnOpacity.setValue(0);
    Animated.sequence([
      Animated.timing(turnOpacity, { toValue: 1, duration: 180, useNativeDriver: true }),
      Animated.delay(420),
      Animated.timing(turnOpacity, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start();
    playEffect(turnSound);
  }, [turnOpacity, playEffect, turnSound]);
  const showGoal = useCallback((team: Team, goalNumber: number) => {
    if (goalTimer.current) clearTimeout(goalTimer.current);
    setGoalBanner(team);
    goalScale.setValue(0.6);
    Animated.spring(goalScale, { toValue: 1, speed: 15, bounciness: 12, useNativeDriver: true }).start();
    playEffect(team === 'away' ? awayGoalSound : goalNumber === TARGET_GOALS && mode !== 'local' ? homeVictorySound : homeGoalSound);
    goalTimer.current = setTimeout(() => setGoalBanner(null), 1250);
  }, [goalScale, playEffect, awayGoalSound, homeGoalSound, homeVictorySound, mode]);
  const [turn, setTurn] = useState<Team>('home');
  const turnRef = useRef<Team>('home');
  const [score, setScore] = useState({ home: 0, away: 0 });
  const scoreRef = useRef({ home: 0, away: 0 });
  const [winner, setWinner] = useState<Team | null>(null);
  const winnerRef = useRef<Team | null>(null);
  const onCareerWinRef = useRef(onCareerWin);
  onCareerWinRef.current = onCareerWin;
  const movingRef = useRef(false);
  const [moving, setMoving] = useState(false);
  const lastFrame = useRef<number | null>(null);
  const accumulator = useRef(0);
  const aiTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const alive = useRef(true);
  const modeRef = useRef(mode);
  modeRef.current = mode;

  const reset = useCallback((keepScore = false, kickoffTeam: Team = 'home', whistleDelay = 350) => {
    bodiesRef.current = createBodies(w, h);
    setBodies(bodiesRef.current.map(b => ({ ...b })));
    movingRef.current = false; setMoving(false);
    aimRef.current = null; setAim(null);
    turnRef.current = kickoffTeam; setTurn(kickoffTeam);
    lastFrame.current = null; accumulator.current = 0;
    // Silbato al saque inicial y tras cada gol, con tiempo para la celebración.
    if (whistleTimer.current) clearTimeout(whistleTimer.current);
    whistleTimer.current = setTimeout(() => {
      whistleTimer.current = null;
      if (alive.current && !winnerRef.current) playEffect(whistleSound);
    }, whistleDelay);
    if (!keepScore) { setGoalBanner(null); scoreRef.current = { home: 0, away: 0 }; setScore({ home: 0, away: 0 }); winnerRef.current = null; setWinner(null); }
  }, [w, h, playEffect, whistleSound]);
  useEffect(() => { reset(); }, [reset]);
  useEffect(() => () => {
    alive.current = false;
    if (aiTimer.current) clearTimeout(aiTimer.current);
    if (impactTimer.current) clearTimeout(impactTimer.current);
    if (goalTimer.current) clearTimeout(goalTimer.current);
    if (turnTimer.current) clearTimeout(turnTimer.current);
    if (whistleTimer.current) clearTimeout(whistleTimer.current);
  }, []);
  useEffect(() => {
    if (winner || moving || goalBanner) return;
    if (turnTimer.current) clearTimeout(turnTimer.current);
    turnTimer.current = setTimeout(showTurn, 180);
    return () => { if (turnTimer.current) clearTimeout(turnTimer.current); };
  }, [turn, moving, winner, goalBanner, showTurn]);

  const fire = useCallback((id: string, dragX: number, dragY: number) => {
    if (movingRef.current || winnerRef.current) return;
    const b = bodiesRef.current.find(item => item.id === id);
    if (!b || b.team !== turnRef.current) return;
    const magnitude = Math.hypot(dragX, dragY);
    if (magnitude < 12) return;
    const strength = Math.min(magnitude, MAX_DRAG) * .105;
    b.vx = -dragX / magnitude * strength;
    b.vy = -dragY / magnitude * strength;
    playEffect(kickSound);
    movingRef.current = true; setMoving(true);
    aimRef.current = null; setAim(null);
    lastFrame.current = null; accumulator.current = 0;
  }, [kickSound, playEffect]);

  // Un único PanResponder en el terreno: el dedo no arrastra las chapas, solo apunta.
  const pan = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: event => {
      if (movingRef.current || winnerRef.current || (modeRef.current === 'ai' && turnRef.current === 'away')) return;
      const { locationX: x, locationY: y } = event.nativeEvent;
      const nearest = bodiesRef.current.filter(b => b.team === turnRef.current)
        .sort((a, b) => Math.hypot(a.x - x, a.y - y) - Math.hypot(b.x - x, b.y - y))[0];
      if (!nearest || Math.hypot(nearest.x - x, nearest.y - y) > nearest.r + 18) return;
      aimRef.current = { id: nearest.id, x: 0, y: 0 };
      setAim(aimRef.current);
    },
    onPanResponderMove: (_event, gesture) => {
      if (!aimRef.current || movingRef.current) return;
      const magnitude = Math.hypot(gesture.dx, gesture.dy);
      const scale = magnitude > MAX_DRAG ? MAX_DRAG / magnitude : 1;
      aimRef.current = { id: aimRef.current.id, x: gesture.dx * scale, y: gesture.dy * scale };
      setAim({ ...aimRef.current });
    },
    onPanResponderRelease: (_event, gesture) => {
      const selected = aimRef.current;
      aimRef.current = null; setAim(null);
      if (selected) fireRef.current(selected.id, gesture.dx, gesture.dy);
    },
    onPanResponderTerminate: () => { aimRef.current = null; setAim(null); },
  })).current;
  const fireRef = useRef(fire);
  fireRef.current = fire;

  useEffect(() => {
    if (!moving) return;
    let raf = 0;
    const tick = (timestamp: number) => {
      if (!alive.current || !movingRef.current) return;
      if (lastFrame.current === null) lastFrame.current = timestamp;
      accumulator.current += Math.min(50, timestamp - lastFrame.current);
      lastFrame.current = timestamp;
      let goal: Team | null = null;
      let n = 0;
      while (accumulator.current >= 16.67 && n++ < 4) {
        goal = step(bodiesRef.current, w, h, (ix, iy, intensity) => {
          const now = Date.now();
          if (now - lastImpact.current < 110) return;
          lastImpact.current = now;
          impactCounter.current += 1;
          setImpact({ x: ix, y: iy, id: impactCounter.current });
          if (intensity > 2.8) playEffect(kickSound);
          if (impactTimer.current) clearTimeout(impactTimer.current);
          impactTimer.current = setTimeout(() => setImpact(null), 170);
        });
        accumulator.current -= 16.67;
        if (goal) break;
      }
      setBodies(bodiesRef.current.map(b => ({ ...b })));
      if (goal) {
        const scored = goal;
        const nextScore = { ...scoreRef.current, [scored]: scoreRef.current[scored] + 1 };
        showGoal(scored, nextScore[scored]);
        scoreRef.current = nextScore;
        setScore(nextScore);
        if (mode !== 'local' && nextScore[scored] >= TARGET_GOALS) {
          winnerRef.current = scored; setWinner(scored);
          movingRef.current = false; setMoving(false);
          if (scored === 'home' && mode === 'ai') onCareerWinRef.current?.(soundMode);
          return;
        }
        // Tras un gol, el saque corresponde al equipo que lo ha encajado.
        reset(true, scored === 'home' ? 'away' : 'home', 1500);
        return;
      }
      if (bodiesRef.current.every(b => b.vx === 0 && b.vy === 0)) {
        movingRef.current = false; setMoving(false);
        const next = turnRef.current === 'home' ? 'away' : 'home';
        turnRef.current = next; setTurn(next);
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [moving, w, h, reset, mode, kickSound, playEffect, showGoal, soundMode]);

  // Fase 6: IA por simulación de jugadas. Utiliza la MISMA física que el jugador.
  // Cada nivel aumenta su búsqueda y precisión, no la fuerza ni el tamaño de las chapas.
  useEffect(() => {
    if (mode === 'local' || turn !== 'away' || moving || winner || goalBanner) return;
    aiTimer.current = setTimeout(() => {
      if (movingRef.current || winnerRef.current || turnRef.current !== 'away') return;
      const snapshot = bodiesRef.current;
      const ball = snapshot.find(b => b.id === 'ball');
      if (!ball) return;
      const discs = snapshot.filter(b => b.team === 'away');
      if (!discs.length) return;
      const level = Math.max(0, RIVALS.findIndex(r => r.name === rival?.name));
      const accuracy = rival?.accuracy ?? .46;
      const tactics = rival?.tactics ?? 0;
      const initialY = ball.y;
      const initialGoalDistance = Math.abs(ball.x - w / 2);
      const tier = Math.floor(level / 4);
      const directions = tier < 2 ? [0] : tier < 4 ? [-0.38, 0, 0.38] : [-0.7, -0.35, 0, 0.35, 0.7];
      const powers = tier < 2 ? [0.72, 1] : tier < 4 ? [0.55, 0.82, 1] : [0.45, 0.67, 0.84, 1];
      const ranked = discs.map(d => ({ d, distance: Math.hypot(ball.x - d.x, ball.y - d.y) }))
        .sort((a, b) => a.distance - b.distance);
      const choices = ranked.slice(0, tier < 2 ? 2 : tier < 4 ? 3 : 5);
      let best: { id: string; dx: number; dy: number; score: number } | null = null;
      for (const { d, distance } of choices) {
        // Se busca golpear por la parte superior del balón para enviarlo hacia abajo.
        // El desplazamiento lateral permite buscar ángulos y rebotes.
        for (const offset of directions) {
          const tx = ball.x + offset * (ball.r + d.r) * 0.8;
          const ty = ball.y - (ball.r + d.r) * (0.48 + tactics * 0.30);
          const vx = tx - d.x, vy = ty - d.y;
          const len = Math.hypot(vx, vy);
          if (len < 0.001) continue;
          for (const powerFraction of powers) {
            const power = MAX_DRAG * powerFraction;
            const copy = snapshot.map(body => ({ ...body }));
            const shooter = copy.find(body => body.id === d.id)!;
            shooter.vx = vx / len * power * .105;
            shooter.vy = vy / len * power * .105;
            let goal: Team | null = null;
            let closest = distance;
            let ballTouched = false;
            for (let frame = 0; frame < 110; frame++) {
              goal = step(copy, w, h);
              const simBall = copy[copy.length - 1];
              const proximity = Math.hypot(shooter.x - simBall.x, shooter.y - simBall.y);
              closest = Math.min(closest, proximity);
              if (proximity < shooter.r + simBall.r + 3) ballTouched = true;
              if (goal || copy.every(body => body.vx === 0 && body.vy === 0)) break;
            }
            const finalBall = copy[copy.length - 1];
            // Premia marcar, acercar el balón a la portería rival y crear un tiro centrado.
            // Penaliza autogoles y dejar el balón cerca de nuestra portería superior.
            let score = goal === 'away' ? 100000 : goal === 'home' ? -100000 : 0;
            score += (finalBall.y - initialY) * (1.1 + tactics * 0.7);
            score += (initialGoalDistance - Math.abs(finalBall.x - w / 2)) * tactics * 0.45;
            score += ballTouched ? 50 : -Math.max(0, closest - (d.r + ball.r)) * 0.7;
            score -= Math.max(0, h * 0.30 - finalBall.y) * tactics * 0.35;
            // En niveles iniciales no se elige siempre el tiro óptimo.
            score += (Math.random() - .5) * (1 - accuracy) * 135;
            if (!best || score > best.score) best = { id: d.id, dx: vx / len * power, dy: vy / len * power, score };
          }
        }
      }
      if (!best) return;
      // Error humano graduado: Hércules se desvía más; Madrid casi nada.
      const error = (1 - accuracy) * 0.23;
      const angle = (Math.random() - .5) * 2 * error;
      const cosine = Math.cos(angle), sine = Math.sin(angle);
      const jitter = 1 + (Math.random() - .5) * (1 - accuracy) * 0.20;
      const dx = (best.dx * cosine - best.dy * sine) * jitter;
      const dy = (best.dx * sine + best.dy * cosine) * jitter;
      fire(best.id, -dx, -dy);
    }, 650 + Math.round((1 - (rival?.tactics ?? 0)) * 400));
    return () => { if (aiTimer.current) clearTimeout(aiTimer.current); };
  }, [mode, turn, moving, winner, goalBanner, fire, rival, h, w]);

  const selected = aim && bodies.find(b => b.id === aim.id);
  const aimLength = aim ? Math.hypot(aim.x, aim.y) : 0;
  const power = Math.round(Math.min(100, aimLength / MAX_DRAG * 100));
  return (
    <View style={styles.game}>
      <View style={styles.gameTop}>
        <Pressable onPress={() => setSoundMode(v => ((v + 1) % 3) as 0 | 1 | 2)} accessibilityRole="button" accessibilityLabel={soundMode === 0 ? 'Sonido completo; pulsar para solo efectos' : soundMode === 1 ? 'Solo efectos; pulsar para silencio' : 'Silencio; pulsar para sonido completo'} style={styles.soundButton}>
          <Text style={styles.soundButtonText} numberOfLines={1}>{soundMode === 0 ? '🔊 COMPLETO' : soundMode === 1 ? '🔉 SOLO FX' : '🔇 SILENCIO'}</Text>
        </Pressable>
        <Pressable onPress={() => reset()} style={styles.gameTopAction}><Text style={styles.gameTopActionText}>↻ REINICIAR</Text></Pressable>
        <Pressable onPress={onExit} style={styles.gameTopAction}><Text style={styles.gameTopActionText}>‹ MENÚ</Text></Pressable>
      </View>
      <View style={styles.scoreRow}>
        <Text style={styles.scoreTeam}>CASTELLÓN</Text>
        <Text style={styles.score}>{score.home}  -  {score.away}</Text>
        <Text style={styles.scoreTeam}>{rival?.name.toUpperCase() ?? 'CERVANTES'}</Text>
      </View>
      <Text style={styles.turnText}>{winner ? (winner === 'home' ? '¡VICTORIA DEL CASTELLÓN!' : 'PARTIDO PERDIDO') : moving ? 'BALÓN EN JUEGO…' : `TURNO: ${turn === 'home' ? 'CASTELLÓN' : rival?.name.toUpperCase() ?? 'CERVANTES'}`}</Text>
      <View style={[styles.pitchFrame, { width: w + 8, height: h + 8 }]}><View style={[styles.pitch, { width: w, height: h }]} {...pan.panHandlers}>
        {Array.from({ length: 10 }, (_, i) => <View key={i} pointerEvents="none" style={[styles.grassBand, { top: `${i * 10}%`, height: '10%', backgroundColor: i % 2 ? '#185F3B' : '#1B6B43' }]} />)}
        <View pointerEvents="none" style={styles.pitchShade} />
        <View pointerEvents="none" style={styles.outerLines} /><View pointerEvents="none" style={styles.midLine} /><View pointerEvents="none" style={styles.centerCircle} /><View pointerEvents="none" style={styles.centerDot} />
        <View pointerEvents="none" style={[styles.penaltyBox, styles.topPenalty]} /><View pointerEvents="none" style={[styles.penaltyBox, styles.bottomPenalty]} />
        <View pointerEvents="none" style={[styles.smallBox, styles.topSmall]} /><View pointerEvents="none" style={[styles.smallBox, styles.bottomSmall]} />
        <View pointerEvents="none" style={[styles.goal, styles.topGoal]} /><View pointerEvents="none" style={[styles.goal, styles.bottomGoal]} />
        {bodies.map(b => b.id === 'ball' ? (
          <View key={b.id} pointerEvents="none" style={[styles.ball, { left: b.x - 11, top: b.y - 11 }]}><Text style={styles.ballText}>⚽</Text></View>
        ) : (
          <View key={b.id} pointerEvents="none" style={{ position: 'absolute', left: b.x - b.r, top: b.y - b.r,
            width: b.r * 2, height: b.r * 2, opacity: !moving && b.team === turn ? 1 : .94 }}>
            {!moving && !winner && b.team === turn && (
              <>
                {/* Resplandor exterior de todas las chapas activas. */}
                <Animated.View pointerEvents="none" style={{ position: 'absolute',
                  left: -10, top: -10, width: b.r * 2 + 20, height: b.r * 2 + 20,
                  borderRadius: b.r + 10, borderWidth: 5,
                  borderColor: b.team === 'home' ? 'rgba(255,255,255,0.55)' : (rival?.color ?? '#FFE158'),
                  opacity: turnPulse.interpolate({ inputRange: [0, 1], outputRange: [.18, .56] }),
                  transform: [{ scale: turnPulse.interpolate({ inputRange: [0, 1], outputRange: [1.02, 1.24] }) }],
                }} />
                {/* Aro interior: siempre visible y pulsante durante el turno. */}
                <Animated.View pointerEvents="none" style={{ position: 'absolute',
                  left: -5, top: -5, width: b.r * 2 + 10, height: b.r * 2 + 10,
                  borderRadius: b.r + 5, borderWidth: 2.5,
                  borderColor: b.team === 'home' ? '#FFFFFF' : (rival?.color ?? '#FFE158'),
                  opacity: turnPulse.interpolate({ inputRange: [0, 1], outputRange: [.55, 1] }),
                  transform: [{ scale: turnPulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.08] }) }],
                }} />
              </>
            )}
            <Disc team={b.team!} size={b.r * 2} rival={b.team === 'away' ? rival : undefined} />
          </View>
        ))}
        {impact && !winner && <View pointerEvents="none" style={{ position: 'absolute', left: impact.x - 15, top: impact.y - 15, width: 30, height: 30, borderRadius: 15, borderWidth: 3, borderColor: 'rgba(255,255,255,0.85)', backgroundColor: 'rgba(255,255,255,0.14)' }} />}
        <Animated.View pointerEvents="none" style={[styles.turnOverlay, { opacity: turnOpacity, transform: [{ scale: turnOpacity.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1] }) }] }]}>
          <Text style={styles.turnOverlayText}>TURNO: {turn === 'home' ? 'CASTELLÓN' : rival?.name.toUpperCase() ?? 'CERVANTES'}</Text>
        </Animated.View>
        {goalBanner && <Animated.View pointerEvents="none" style={[styles.goalOverlay, { transform: [{ scale: goalScale }] }]}>
          <Text style={styles.goalOverlayText}>⚽ ¡GOOOL!</Text>
          <Text style={styles.goalOverlayTeam}>{goalBanner === 'home' ? 'CASTELLÓN' : rival?.name.toUpperCase() ?? 'CERVANTES'}</Text>
        </Animated.View>}
        {selected && aim && (
          <View pointerEvents="none" style={{ position: 'absolute', left: selected.x - selected.r - 5, top: selected.y - selected.r - 5, width: selected.r * 2 + 10, height: selected.r * 2 + 10, borderRadius: selected.r + 5, borderWidth: 2, borderColor: '#FFFFFF', backgroundColor: 'transparent' }}>
            <View style={{ position: 'absolute', left: 2, top: 2, right: 2, bottom: 2, borderRadius: selected.r + 2, borderWidth: 2, borderColor: '#111111' }} />
          </View>
        )}
        {selected && aim && aimLength > 4 && (() => {
          const angle = Math.atan2(-aim.y, -aim.x);
          const length = Math.min(95, aimLength * .82);
          const startX = selected.x + Math.cos(angle) * (selected.r + 8);
          const startY = selected.y + Math.sin(angle) * (selected.r + 8);
          const centerX = startX + Math.cos(angle) * length / 2;
          const centerY = startY + Math.sin(angle) * length / 2;
          const tipX = startX + Math.cos(angle) * length;
          const tipY = startY + Math.sin(angle) * length;
          return <View pointerEvents="none" style={StyleSheet.absoluteFill}>
            <View style={{ position: 'absolute', left: centerX - length / 2, top: centerY - 3, width: length, height: 6, borderRadius: 4, backgroundColor: '#FFFFFF', transform: [{ rotate: `${angle}rad` }] }} />
            <View style={{ position: 'absolute', left: centerX - length / 2 + 2, top: centerY - 1, width: Math.max(0, length - 4), height: 2, borderRadius: 2, backgroundColor: '#111111', transform: [{ rotate: `${angle}rad` }] }} />
            <View style={{ position: 'absolute', left: tipX - 6, top: tipY - 6, width: 12, height: 12, borderTopWidth: 3, borderRightWidth: 3, borderColor: '#FFFFFF', transform: [{ rotate: `${angle + Math.PI / 4}rad` }] }} />
          </View>;
        })()}


      </View>
        {winner && <View style={[styles.resultPanel, styles.resultOverlay]}><Text style={styles.resultTitle}>{winner === 'home' ? '🏆 ¡VICTORIA!' : 'FIN DEL PARTIDO'}</Text><Text style={styles.resultText}>{winner === 'home' ? '¡Rival superado! Se ha desbloqueado el siguiente nivel.' : 'Puedes volver a intentarlo.'}</Text><Pressable onPress={() => reset()} style={styles.primaryButton}><Text style={styles.buttonText}>REPETIR PARTIDO</Text></Pressable><Pressable onPress={onExit} style={styles.actionButton}><Text style={styles.actionText}>{mode === 'quick' ? 'VOLVER AL MENÚ' : 'VOLVER A LA CARRERA'}</Text></Pressable></View>}
      </View>
      {mode !== 'local' && <Text style={styles.matchRule}>PRIMERO EN MARCAR {TARGET_GOALS} GOLES</Text>}

      {!winner && <View style={styles.powerRow}>
        <Text style={styles.powerLabel}>{aim ? `POTENCIA ${power}%` : 'ARRASTRA PARA APUNTAR'}</Text>
        <View style={styles.powerTrack}><View style={[styles.powerFill, { width: `${power}%` }]} /></View>
      </View>}



    </View>
  );
}

// Fase 7.13: pantalla de ascenso animada, sin vídeo ni dependencias nuevas.
// Se monta únicamente cuando se supera por primera vez el cuarto rival de una división.
function PromotionScreen({ division, soundMode, onContinue }: { division: number; soundMode: 0 | 1 | 2; onContinue: () => void }) {
  const [ready, setReady] = useState(false);
  const [card, setCard] = useState<1 | 2>(1);
  const intro = useRef(new Animated.Value(0)).current;
  const badge = useRef(new Animated.Value(0.55)).current;
  const confetti = useRef(new Animated.Value(0)).current;
  // Fase 7.17: voz WINNER 2 original, independiente del antiguo sonido de ascenso.
  const promotionSound = useAudioPlayer(require('../../assets/sounds/winner_2_locutor_epico.mp3'));
  // Fase 7.17: música arcade propia, solo en modo COMPLETO.
  const promotionMusic = useAudioPlayer(require('../../assets/sounds/ascenso_arcade_14s.mp3'));
  const name = RIVALS[(6 - division) * 4].level;
  useEffect(() => {
    promotionSound.volume = soundMode === 2 ? 0 : 0.65;
    promotionMusic.volume = soundMode === 0 ? 0.24 : 0;
    if (soundMode !== 2) { try { promotionSound.play(); } catch (error) { console.warn("[chapas] WINNER", error); } }
    if (soundMode === 0) { try { promotionMusic.play(); } catch (error) { console.warn("[chapas] Música ascenso", error); } }
    const loop = Animated.loop(Animated.timing(confetti, { toValue: 1, duration: 2400, easing: Easing.linear, useNativeDriver: true }));
    loop.start();
    Animated.parallel([
      Animated.timing(intro, { toValue: 1, duration: 850, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.spring(badge, { toValue: 1, speed: 8, bounciness: 9, useNativeDriver: true }),
    ]).start();
    const timer = setTimeout(() => { setCard(2); setReady(true); }, 14000);
    return () => { clearTimeout(timer); loop.stop(); try { promotionSound.pause(); } catch {} try { promotionMusic.pause(); } catch {} };
  }, [intro, badge, confetti, promotionSound, promotionMusic, soundMode]);
  return (
    <View style={styles.promotionOverlay}>
      <View style={styles.promotionLightTop} />
      <View style={styles.promotionLightBottom} />
      {Array.from({ length: 22 }, (_, i) => (
        <Animated.View key={i} pointerEvents="none" style={{
          position: 'absolute', left: `${(i * 43 + 7) % 100}%`, top: -22,
          width: i % 3 === 0 ? 5 : 3, height: i % 3 === 0 ? 14 : 9,
          backgroundColor: i % 4 === 0 ? '#FFFFFF' : GOLD,
          opacity: .35 + (i % 4) * .13,
          transform: [{ translateY: confetti.interpolate({ inputRange: [0, 1], outputRange: [-30 - (i % 4) * 40, 850 + (i % 5) * 50] }) }, { rotate: `${i * 29}deg` }],
        }} />
      ))}
      <Animated.View style={{ opacity: intro, alignItems: 'center', width: '100%', paddingHorizontal: 24 }}>
        <Text style={styles.promotionEyebrow}>CAMINO A LA GLORIA</Text>
        <Text style={styles.promotionTitle}>{card === 1 ? "¡ASCENSO\nCONSEGUIDO!" : "¡NUEVA\nDIVISIÓN!"}</Text>
        <Animated.View style={[styles.promotionBadge, { transform: [{ scale: badge }] }]}>
          <View style={styles.promotionBadgeInner}>
            <Text style={styles.promotionBadgeSmall}>DIVISIÓN</Text>
            <Text style={styles.promotionBadgeNumber}>{division}</Text>
            <Text style={styles.promotionBadgeStar}>★ ★ ★</Text>
          </View>
        </Animated.View>
        <Text style={styles.promotionUnlocked}>{card === 1 ? "¡CAMINO A LA GLORIA!" : "NUEVA DIVISIÓN DESBLOQUEADA"}</Text>
        {card === 2 && <Text style={styles.promotionName}>{name}</Text>}
        <Text style={styles.promotionMessage}>EL CAMINO HACIA LA GLORIA CONTINÚA</Text>
        {ready ? (
          <Pressable accessibilityRole="button" onPress={onContinue} style={styles.promotionContinue}>
            <Text style={styles.promotionContinueText}>CONTINUAR CARRERA  ›</Text>
          </Pressable>
        ) : <Pressable onPress={() => { setCard(2); setReady(true); try { promotionMusic.pause(); } catch {} }}><Text style={styles.promotionWaiting}>CELEBRANDO EL ASCENSO…  › SALTAR</Text></Pressable>}
      </Animated.View>
    </View>
  );
}

export default function ChapasScreen() {
  const [mode, setMode] = useState<Mode>(null);
  const [careerOpen, setCareerOpen] = useState(false);
  const [rivalIndex, setRivalIndex] = useState(0);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [quickIndex, setQuickIndex] = useState(0);
  const [localIndex, setLocalIndex] = useState(0);
  const [localSelectOpen, setLocalSelectOpen] = useState(false);
  const [promotion, setPromotion] = useState<{ division: number; soundMode: 0 | 1 | 2 } | null>(null);
  const [menuSoundMode, setMenuSoundMode] = useState<0 | 1 | 2>(0);
  const menuMusic = useAudioPlayer(require('../../assets/sounds/Albinegros_Chapas_Arcade_Original.mp3'));
  const carouselTick = useAudioPlayer(require('../../assets/sounds/chapas_menu_tick.wav'));
  // El reproductor permanece montado durante los partidos. Al volver al menú,
  // reanudamos el audio explícitamente y evitamos una pausa tardía de un efecto anterior.
  useEffect(() => {
    menuMusic.loop = true;
    menuMusic.volume = 0.20;
    if (mode === null && !promotion && menuSoundMode === 0) {
      try { menuMusic.play(); } catch (error) { console.warn('[chapas] Menú música', error); }
    } else {
      try { menuMusic.pause(); } catch (error) { console.warn('[chapas] Menú pausa', error); }
    }
  }, [menuMusic, mode, promotion, menuSoundMode]);
  useEffect(() => () => { try { menuMusic.pause(); } catch {} }, [menuMusic]);
  const tickCounter = useRef(0);
  const tickBusy = useRef(false);
  // Sonido de ruleta solo en el menú principal, con control de frecuencia.
  useEffect(() => {
    if (mode !== null || careerOpen || promotion) return;
    const timer = setInterval(() => {
      setPreviewIndex(previous => (previous + 1 + Math.floor(Math.random() * (RIVALS.length - 1))) % RIVALS.length);
      tickCounter.current += 1;
      if (menuSoundMode !== 2 && tickCounter.current % 3 === 0 && !tickBusy.current) {
        tickBusy.current = true;
        try {
          void carouselTick.seekTo(0).then(() => {
            carouselTick.play();
          }).catch(error => console.warn('[chapas] Tic ruleta', error))
            .finally(() => { tickBusy.current = false; });
        } catch (error) { tickBusy.current = false; console.warn('[chapas] Tic ruleta', error); }
      }
    }, 140);
    return () => clearInterval(timer);
  }, [mode, careerOpen, promotion, menuSoundMode, carouselTick]);
  const startQuickMatch = () => {
    const selected = Math.floor(Math.random() * RIVALS.length);
    setQuickIndex(selected);
    setCareerOpen(false);
    setMode('quick');
  };
  const [unlocked, setUnlocked] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [champion, setChampion] = useState(false);

  const promotionTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (promotionTimer.current) clearTimeout(promotionTimer.current); }, []);
  const unlockRef = useRef(0);
  useEffect(() => {
    let active = true;
    Promise.all([
      AsyncStorage.getItem(CAREER_KEY),
      AsyncStorage.getItem(LEGACY_CAREER_KEY),
      AsyncStorage.getItem(`${CAREER_KEY}_champion`),
    ]).then(([current, legacy, champ]) => {
      // Migración: conserva la cantidad de rivales desbloqueados de la fase 6.
      // No se borra la clave antigua y los progresos nuevos usan career_v2.
      const parsed = Number(current ?? legacy ?? '0');
      const safe = Number.isInteger(parsed) ? Math.max(0, Math.min(RIVALS.length - 1, parsed)) : 0;
      if (active) { unlockRef.current = safe; setUnlocked(safe); setChampion(champ === 'yes'); setLoaded(true); }
      if (current === null) AsyncStorage.setItem(CAREER_KEY, String(safe)).catch(() => {});
    }).catch(() => { if (active) setLoaded(true); });
    return () => { active = false; };
  }, []);
  const winCareer = useCallback((soundMode: 0 | 1 | 2) => {
    if (rivalIndex === RIVALS.length - 1) {
      setChampion(true);
      AsyncStorage.setItem(`${CAREER_KEY}_champion`, "yes").catch(error => console.warn("[chapas] No se pudo guardar el título", error));
    }
    const next = Math.min(RIVALS.length - 1, Math.max(unlockRef.current, rivalIndex + 1));
    if (next > unlockRef.current) {
      // Cada cuatro rivales superados se asciende: 6→5→4→3→2→1.
      // Se dispara solo al desbloquear por primera vez la siguiente división.
      if (next % 4 === 0 && next < RIVALS.length) {
        if (promotionTimer.current) clearTimeout(promotionTimer.current);
        const division = RIVALS[next].division;
        promotionTimer.current = setTimeout(() => {
          setPromotion({ division, soundMode });
          promotionTimer.current = null;
        }, 1900); // deja terminar el banner de gol y arrancar la celebración
      }
      unlockRef.current = next;
      setUnlocked(next);
      AsyncStorage.setItem(CAREER_KEY, String(next)).catch(error => console.warn('[chapas] No se pudo guardar el progreso', error));
    }
  }, [rivalIndex]);
  const goBack = () => { setMode(null); setCareerOpen(mode === 'ai'); };
  return (
    <SafeAreaView style={[styles.screen, { paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight ?? 0 : 0 }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle="light-content" backgroundColor="#101010" />
      {mode ? (
        <ScrollView scrollEnabled={true} contentContainerStyle={{ flexGrow: 1, paddingBottom: 18 }} showsVerticalScrollIndicator={false}>
          <Pitch key={`${mode}-${mode === 'quick' ? quickIndex : rivalIndex}`} mode={mode} rival={mode === 'quick' ? RIVALS[quickIndex] : mode === 'ai' ? RIVALS[rivalIndex] : LOCAL_RIVALS[localIndex]} onCareerWin={mode === 'ai' ? winCareer : undefined} onExit={goBack} onSoundModeChange={setMenuSoundMode} initialSoundMode={menuSoundMode} promotionActive={!!promotion} />
        </ScrollView>
      ) : careerOpen ? (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.careerContent}>
          <Pressable onPress={() => setCareerOpen(false)} style={styles.backButton}><Text style={styles.backText}>‹ MENÚ PRINCIPAL</Text></Pressable>
          <Text style={styles.careerTitle}>CAMINO A LA GLORIA</Text>
          <Text style={styles.careerSubtitle}>24 RIVALES · 6 DIVISIONES · UN SOLO CAMPEÓN</Text>
          <Text style={styles.careerProgress}>{champion ? '🏆 ¡CAMPEÓN ALBINEGRO!' : `RIVALES DESBLOQUEADOS: ${unlocked + 1} / ${RIVALS.length}`}</Text>
          {[6, 5, 4, 3, 2, 1].map(division => {
            const startIndex = (6 - division) * 4;
            const completed = unlocked >= startIndex + 4 || (division === 1 && champion);
            return <View key={division} style={styles.divisionSection}>
              <View style={styles.divisionHeader}>
                <Text style={styles.divisionTitle}>{completed ? '🏆 ' : '◆ '}DIVISIÓN {division}</Text>
                <Text style={styles.divisionSubtitle}>{RIVALS[startIndex].level}{completed ? ' · SUPERADA' : ''}</Text>
              </View>
              {RIVALS.slice(startIndex, startIndex + 4).map((r, offset) => {
                const i = startIndex + offset;
                const available = loaded && i <= unlocked;
                return <Pressable key={r.name} disabled={!available}
                  onPress={() => { setRivalIndex(i); setMode('ai'); }}
                  style={[styles.rivalCard, !available && styles.rivalLocked, i === unlocked && styles.rivalCurrent]}>
                  <Disc team="away" size={49} rival={r} />
                  <View style={styles.rivalInfo}>
                    <Text style={styles.rivalName}>{i + 1}. {r.name.toUpperCase()}</Text>
                    <Text style={styles.rivalLevel}>{r.level}</Text>
                  </View>
                  <Text style={[styles.rivalState, !available && { color: '#888' }]}>{!loaded ? '...' : available ? 'JUGAR ›' : '🔒'}</Text>
                </Pressable>;
              })}
            </View>;
          })}
          <Text style={styles.careerFootnote}>El primero en marcar 3 goles gana. Supera cuatro rivales para ascender de división. Tu progreso se guarda en este dispositivo.</Text>
        </ScrollView>
      ) : (
        <ScrollView style={styles.menuScroll} contentContainerStyle={styles.menuScrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.menu}>
            <Image source={require('../../assets/images/chapas-emblema-dorado.png')} style={styles.brandCrest} resizeMode="contain" />
            <View style={styles.brandPresentsContainer}><Text style={styles.brandPresents} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.85}>Albinegros Castellón presenta</Text></View>
            <Text style={styles.title}>ALBINEGROS CHAPAS</Text>
            <View style={styles.versusRow}>
              <View style={styles.teamBlock}><Disc team="home" size={86} /><Text style={styles.teamLabel} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>CASTELLÓN</Text></View>
              <Text style={styles.vs}>VS</Text>
              <View style={styles.teamBlock}><Disc team="away" size={86} rival={RIVALS[previewIndex]} /><Text style={styles.teamLabel} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>{RIVALS[previewIndex].name.toUpperCase()}</Text></View>
            </View>
            <Pressable accessibilityRole="button" accessibilityLabel="Cambiar sonido del menú" onPress={() => setMenuSoundMode(value => ((value + 1) % 3) as 0 | 1 | 2)} style={styles.menuSoundButton}>
              <Text style={styles.menuSoundText}>{menuSoundMode === 0 ? '🔊 SONIDO COMPLETO' : menuSoundMode === 1 ? '🔉 SOLO EFECTOS' : '🔇 SILENCIO'}  ·  TOCAR PARA CAMBIAR</Text>
            </Pressable>
            <View style={styles.menuActions}>
              <Pressable style={styles.primaryButton} onPress={startQuickMatch}><Text style={styles.buttonText}>PARTIDA RÁPIDA</Text></Pressable>
              <Pressable style={styles.primaryButton} onPress={() => setCareerOpen(true)}><Text style={styles.buttonText}>MODO CARRERA</Text></Pressable>
              <Pressable style={styles.secondaryButton} onPress={() => setLocalSelectOpen(value => !value)}><Text style={styles.buttonText}>DOS JUGADORES</Text></Pressable>
              {localSelectOpen && <View style={styles.localPicker}>
                <Text style={styles.localPickerTitle}>ELIGE EL EQUIPO RIVAL</Text>
                <View style={styles.localTeams}>{LOCAL_RIVALS.map((team, i) => (
                  <Pressable key={team.name} accessibilityRole="button" onPress={() => setLocalIndex(i)} style={[styles.localTeamButton, localIndex === i && styles.localTeamSelected]}>
                    <Disc team="away" size={38} rival={team} />
                    <Text style={styles.localTeamName}>{team.name.toUpperCase()}</Text>
                  </Pressable>
                ))}</View>
                <Pressable style={styles.localStart} onPress={() => { setLocalSelectOpen(false); setMode('local'); }}><Text style={styles.buttonText}>JUGAR CONTRA {LOCAL_RIVALS[localIndex].name.toUpperCase()} ›</Text></Pressable>
              </View>}
            </View>
            <Text style={styles.menuMotto}>«Bajo el sol, se alzarán las banderas...»</Text>
          </View>
        </ScrollView>
      )}
      {promotion && <PromotionScreen division={promotion.division} soundMode={promotion.soundMode} onContinue={() => {
        setPromotion(null);
        setMode(null);
        setCareerOpen(true);
      }} />}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  promotionOverlay: { ...StyleSheet.absoluteFillObject, zIndex: 100, elevation: 30, backgroundColor: '#080909', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  promotionLightTop: { position: 'absolute', top: -130, width: 400, height: 350, borderRadius: 200, backgroundColor: 'rgba(201,164,92,0.12)' },
  promotionLightBottom: { position: 'absolute', bottom: -180, width: 400, height: 340, borderRadius: 200, backgroundColor: 'rgba(201,164,92,0.09)' },
  promotionEyebrow: { color: GOLD, fontSize: 12, letterSpacing: 3, fontWeight: '900', marginBottom: 18 },
  promotionTitle: { color: '#FFFFFF', fontSize: 31, lineHeight: 36, textAlign: 'center', fontWeight: '900', letterSpacing: 1.3, marginBottom: 26 },
  promotionBadge: { width: 170, height: 190, borderWidth: 4, borderColor: GOLD, borderTopLeftRadius: 45, borderTopRightRadius: 45, borderBottomLeftRadius: 75, borderBottomRightRadius: 75, backgroundColor: '#1A1916', padding: 8, shadowColor: GOLD, shadowOpacity: .6, shadowRadius: 25, elevation: 15 },
  promotionBadgeInner: { flex: 1, borderWidth: 1, borderColor: '#E8D29C', borderTopLeftRadius: 35, borderTopRightRadius: 35, borderBottomLeftRadius: 65, borderBottomRightRadius: 65, alignItems: 'center', justifyContent: 'center' },
  promotionBadgeSmall: { color: '#E8D29C', fontWeight: '900', fontSize: 12, letterSpacing: 2 },
  promotionBadgeNumber: { color: '#FFFFFF', fontWeight: '900', fontSize: 79, lineHeight: 90 },
  promotionBadgeStar: { color: GOLD, fontSize: 17, letterSpacing: 3 },
  promotionUnlocked: { color: GOLD, fontWeight: '900', fontSize: 12, letterSpacing: 1.1, textAlign: 'center', marginTop: 29 },
  promotionName: { color: '#FFFFFF', fontWeight: '900', fontSize: 24, letterSpacing: 1, textAlign: 'center', marginTop: 9 },
  promotionMessage: { color: '#A7A7A7', fontWeight: '700', fontSize: 11, textAlign: 'center', letterSpacing: .9, marginTop: 18 },
  promotionContinue: { backgroundColor: GOLD, borderRadius: 12, paddingHorizontal: 28, paddingVertical: 17, marginTop: 34, minWidth: 240, alignItems: 'center' },
  promotionContinueText: { color: '#111111', fontSize: 14, fontWeight: '900', letterSpacing: .7 },
  promotionWaiting: { color: '#888888', fontSize: 11, letterSpacing: 1.2, marginTop: 40 },
  divisionSection: { marginBottom: 17 },
  divisionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, marginTop: 10 },
  divisionTitle: { color: GOLD, fontSize: 15, fontWeight: '900' },
  divisionSubtitle: { color: '#AFAFAF', fontSize: 9, fontWeight: '700', flexShrink: 1, textAlign: 'right' },
  careerContent: { paddingHorizontal: 20, paddingTop: 15, paddingBottom: 36 },
  careerTitle: { color: '#FFFFFF', fontSize: 24, fontWeight: '900', textAlign: 'center', marginTop: 12 },
  careerSubtitle: { color: GOLD, fontSize: 11, letterSpacing: 1.1, textAlign: 'center', marginTop: 8, marginBottom: 17 },
  careerProgress: { color: '#BBBBBB', fontSize: 11, fontWeight: '800', marginBottom: 12 },
  rivalCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1B1B1B', borderWidth: 1, borderColor: '#353535', borderRadius: 15, padding: 13, marginBottom: 10, gap: 12 },
  rivalCurrent: { borderColor: GOLD },
  rivalLocked: { opacity: .47 },
  rivalInfo: { flex: 1 },
  rivalName: { color: '#FFFFFF', fontSize: 15, fontWeight: '900' },
  rivalLevel: { color: '#B6B6B6', fontSize: 10, marginTop: 5, letterSpacing: 1 },
  rivalState: { color: GOLD, fontSize: 11, fontWeight: '900' },
  careerFootnote: { color: '#A6A6A6', fontSize: 12, lineHeight: 19, textAlign: 'center', marginTop: 10 },
  matchRule: { color: GOLD, fontSize: 10, fontWeight: '800', marginTop: 7, letterSpacing: 1 },
  resultPanel: { width: '90%', backgroundColor: '#252525', borderRadius: 14, borderColor: '#FFFFFF', borderWidth: 1, alignItems: 'center', padding: 12, marginTop: 10 },
  resultOverlay: { position: 'absolute', bottom: 24, alignSelf: 'center', zIndex: 20, elevation: 15, backgroundColor: 'rgba(20,20,20,0.97)' },
  resultTitle: { color: '#FFFFFF', fontSize: 17, fontWeight: '900' },
  resultText: { color: '#DDD', fontSize: 12, textAlign: 'center', marginVertical: 9 },
  screen: { flex: 1, backgroundColor: '#101010', paddingTop: 0 },
  menuScroll: { flex: 1 },
  menuScrollContent: { flexGrow: 1, justifyContent: 'flex-start' },
  menu: { width: '100%', alignItems: 'center', paddingHorizontal: 22, paddingTop: 20, paddingBottom: 22 },
  brandCrest: { width: 100, height: 136, marginBottom: 4 },
  brandPresentsContainer: { width: '100%', alignItems: 'center', paddingHorizontal: 4, marginBottom: 8 },
  brandPresents: { color: GOLD, fontSize: 14, fontStyle: 'italic', textAlign: 'center', width: '100%', flexShrink: 1, includeFontPadding: false },
  menuActions: { width: '100%' },
  localPicker: { width: '100%', borderWidth: 1, borderColor: GOLD, borderRadius: 12, padding: 12, marginBottom: 16, gap: 12 },
  localPickerTitle: { color: GOLD, fontWeight: '900', fontSize: 13, textAlign: 'center' },
  localTeams: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 8 },
  localTeamButton: { width: '48%', minHeight: 72, backgroundColor: '#222222', borderWidth: 1, borderColor: '#555555', borderRadius: 10, alignItems: 'center', justifyContent: 'center', padding: 7, gap: 4 },
  localTeamSelected: { borderColor: GOLD, backgroundColor: '#343025' },
  localTeamName: { color: '#FFFFFF', fontSize: 11, fontWeight: '800' },
  localStart: { backgroundColor: '#504125', borderRadius: 10, paddingVertical: 15, alignItems: 'center' },
  menuMotto: { color: '#D5B46B', fontSize: 16, fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }), fontStyle: 'italic', textAlign: 'center', lineHeight: 25, marginTop: 24, paddingHorizontal: 8 },
  title: { fontSize: 25, fontWeight: '900', color: 'white', textAlign: 'center', marginBottom: 35 },
  subtitle: { color: GOLD, fontSize: 12, letterSpacing: 2, marginTop: 10, marginBottom: 65, textAlign: 'center' },
  versusRow: { width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  teamBlock: { width: '40%', alignItems: 'center', gap: 18 },
  teamLabel: { color: '#FFF', fontWeight: '800', fontSize: 12, width: '100%', height: 18, textAlign: 'center', includeFontPadding: false },
  vs: { color: GOLD, fontSize: 28, fontWeight: '900', width: '20%', textAlign: 'center' },
  disc: { borderWidth: 3, justifyContent: 'center', alignItems: 'center', overflow: 'hidden', elevation: 5, shadowColor: '#000', shadowOpacity: .38, shadowRadius: 3, shadowOffset: { width: 0, height: 3 } },
  discInner: { width: '92%', height: '92%', borderWidth: 1.5, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  discGlint: { position: 'absolute', top: '9%', left: '14%', width: '42%', height: '14%', borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.30)', transform: [{ rotate: '-20deg' }] },
  stripeContainer: { width: '75%', height: '80%', flexDirection: 'row', overflow: 'hidden' },
  blackStripe: { flex: 1, backgroundColor: '#101010' },
  whiteStripe: { flex: 1, backgroundColor: '#FFF' },
  yellowCenter: { borderWidth: 2, borderColor: '#173B78', backgroundColor: '#FFDE24' },
  primaryButton: { backgroundColor: '#252525', borderWidth: 1, borderColor: '#FFFFFF', width: '100%', padding: 19, borderRadius: 12, alignItems: 'center', marginBottom: 14 },
  secondaryButton: { backgroundColor: '#333', width: '100%', padding: 19, borderRadius: 12, alignItems: 'center' },
  buttonText: { color: '#FFF', fontSize: 14, fontWeight: '900', textAlign: 'center' },
  footer: { position: 'absolute', bottom: 28, color: '#777', letterSpacing: 2, fontSize: 11 },
  game: { alignItems: 'center', paddingTop: 3, paddingBottom: 12 },
  soundButton: { width: '36%', minHeight: 42, paddingHorizontal: 3, paddingVertical: 10, borderWidth: 1.5, borderColor: GOLD, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  soundButtonText: { color: '#FFFFFF', fontSize: 10, fontWeight: '900', textAlign: 'center' },
  gameTopAction: { width: '30%', minHeight: 42, alignItems: 'center', justifyContent: 'center' },
  gameTopActionText: { color: GOLD, fontSize: 11, fontWeight: '900', textAlign: 'center' },
  menuSoundButton: { alignSelf: 'center', marginVertical: 12, paddingVertical: 12, paddingHorizontal: 14, borderRadius: 9, borderWidth: 1, borderColor: GOLD },
  menuSoundText: { color: '#FFFFFF', fontSize: 11, fontWeight: '800', textAlign: 'center' },
  turnOverlay: { position: 'absolute', top: '44%', alignSelf: 'center', backgroundColor: 'rgba(0,0,0,0.72)', borderWidth: 1, borderColor: '#FFFFFF', borderRadius: 9, paddingHorizontal: 15, paddingVertical: 8, zIndex: 15 },
  turnOverlayText: { color: '#FFFFFF', fontSize: 12, fontWeight: '900', letterSpacing: 1 },
  goalOverlay: { position: 'absolute', top: '35%', alignSelf: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.85)', borderWidth: 2, borderColor: '#FFFFFF', borderRadius: 14, paddingHorizontal: 28, paddingVertical: 15, zIndex: 18 },
  goalOverlayText: { color: '#FFFFFF', fontSize: 26, fontWeight: '900' },
  goalOverlayTeam: { color: '#FFFFFF', fontSize: 13, fontWeight: '800', marginTop: 5 },
  gameTop: { width: '100%', paddingHorizontal: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  backButton: { paddingVertical: 10, paddingHorizontal: 4 },
  backText: { color: GOLD, fontWeight: '900', fontSize: 12 },
  modeText: { color: '#CCC', fontSize: 11, letterSpacing: 1, fontWeight: '700' },
  scoreRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%', paddingHorizontal: 19, marginBottom: 4 },
  scoreTeam: { color: '#FFF', fontWeight: '800', fontSize: 11 },
  score: { color: '#FFFFFF', fontWeight: '900', fontSize: 25 },
  turnText: { color: '#E5E5E5', fontWeight: '800', fontSize: 11, marginBottom: 6, letterSpacing: .6 },
  pitchFrame: { backgroundColor: '#111B17', borderRadius: 13, padding: 4, borderWidth: 1, borderColor: '#3B4E42', elevation: 7, shadowColor: '#000', shadowOpacity: .4, shadowRadius: 7, shadowOffset: { width: 0, height: 4 } },
  pitch: { backgroundColor: '#1B7040', overflow: 'hidden', borderRadius: 8, borderWidth: 2, borderColor: '#0D3F24' },
  pitchShade: { ...StyleSheet.absoluteFillObject, borderWidth: 8, borderColor: 'rgba(0,0,0,0.07)' },
  grassBand: { position: 'absolute', left: 0, right: 0 },
  outerLines: { position: 'absolute', top: '3%', bottom: '3%', left: '5%', right: '5%', borderWidth: 2, borderColor: LINE },
  midLine: { position: 'absolute', top: '50%', left: '5%', right: '5%', borderTopWidth: 2, borderColor: LINE },
  centerCircle: { position: 'absolute', top: '40%', left: '35%', width: '30%', height: '20%', borderRadius: 100, borderWidth: 2, borderColor: LINE },
  centerDot: { position: 'absolute', top: '49.5%', left: '49%', width: 5, height: 5, borderRadius: 3, backgroundColor: LINE },
  penaltyBox: { position: 'absolute', width: '56%', height: '16%', left: '22%', borderWidth: 2, borderColor: LINE },
  topPenalty: { top: '3%' }, bottomPenalty: { bottom: '3%' },
  smallBox: { position: 'absolute', width: '30%', height: '7%', left: '35%', borderWidth: 2, borderColor: LINE },
  topSmall: { top: '3%' }, bottomSmall: { bottom: '3%' },
  goal: { position: 'absolute', width: '31%', height: '2.5%', left: '34.5%', borderWidth: 2, borderColor: '#FFF', backgroundColor: 'rgba(255,255,255,0.20)' },
  topGoal: { top: 0 }, bottomGoal: { bottom: 0 },
  ball: { position: 'absolute', width: 22, height: 22, justifyContent: 'center', alignItems: 'center' },
  ballText: { fontSize: 18 },
  powerRow: { width: '78%', marginTop: 7, gap: 4 },
  powerLabel: { color: GOLD, fontWeight: '800', fontSize: 11, textAlign: 'center' },
  powerTrack: { height: 6, backgroundColor: '#454545', borderRadius: 5, overflow: 'hidden' },
  powerFill: { height: '100%', backgroundColor: '#EDEDED', borderRadius: 5 },
  instructions: { color: '#AAA', fontSize: 12, textAlign: 'center', lineHeight: 18, marginHorizontal: 25, marginTop: 12 },
  actions: { flexDirection: 'row', gap: 16, marginTop: 5, marginBottom: 5 },
  actionButton: { paddingVertical: 10, paddingHorizontal: 8 },
  actionText: { color: '#FFF', fontSize: 11, fontWeight: '800' },
  footerGame: { color: GOLD, fontSize: 10, letterSpacing: 1, marginTop: 8 },
});
