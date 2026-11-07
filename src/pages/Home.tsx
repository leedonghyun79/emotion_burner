import { useState, useEffect, useRef } from 'react';
import { GoogleAdMob, grantPromotionRewardForGame, TossAds } from '@apps-in-toss/web-framework';
import './Home.css';

/** 광고 로드 에러를 화면에 보여줄 문구로 변환 (코드·메시지 함께) */
function errText(err: any): string {
  const code = err?.code ?? err?.errorCode ?? '';
  const msg = err?.message ?? '';
  return [code, msg].filter(Boolean).join(' · ') || '광고를 불러오지 못했어요';
}

/** 광고 타이밍 로그 - 콘솔에서 [AD_TIMING]으로 검색 */
function logAdTiming(label: string, ms: number) {
  console.log(`[AD_TIMING] ${label}: ${ms.toFixed(0)}ms`);
}

/** 광고 SDK 지원 여부 확인 - 브라우저(토스 앱 밖)에선 브리지 상수가 없어 throw하므로 안전하게 false 처리 */
function isAdSupported(ad: { isSupported?: () => boolean } | undefined): boolean {
  try {
    return !!ad?.isSupported?.();
  } catch {
    return false;
  }
}

const COMBO_TARGET = 5;
/** 광고 게이지: 버리기 광고를 5번 보면 한 번 지급 */
const GAUGE_TARGET = 5;
/** 게이지가 차면 지급 (광고 5회 = 5원, 광고 1회당 1원) */
const REWARD_PER_GAUGE = 5;
/** 한 사람이 하루에 토스 포인트로 받을 수 있는 최대 금액 (원, 날짜가 바뀌면 리셋) */
const DAILY_REWARD_CAP = 1000;
const MAX_CHANCES = 30;
const CHANCE_RECHARGE_MS = 5 * 60 * 1000;
const STORAGE_KEY = 'incinerator-state-v3';

/** 기회 충전 계산 (순수 함수) - 경과 시간만큼 기회를 채우고 새 기준 시각을 돌려줌 */
function rechargeChances(chances: number, anchor: number, now: number) {
  if (chances >= MAX_CHANCES) return { chances, anchor };
  const gained = Math.max(0, Math.floor((now - anchor) / CHANCE_RECHARGE_MS));
  if (gained === 0) return { chances, anchor };
  const next = Math.min(MAX_CHANCES, chances + gained);
  return { chances: next, anchor: next >= MAX_CHANCES ? now : anchor + gained * CHANCE_RECHARGE_MS };
}

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

/** 응원글 풀 (20개) */
const TEASER_POOL = [
  "오늘 하루도 정말 수고 많았어요. 잠시 쉬어가도 괜찮아요",
  "마음에 담아둔 스트레스, 여기에 전부 태워버려요",
  "당신의 내일을 응원합니다. 훌훌 털고 가벼워지길",
  "힘들었던 감정들은 모두 재가 되어 사라질 거예요",
  "괜찮아요, 내일은 오늘보다 더 좋은 하루가 될 테니까요",
  "지금 느끼는 마음, 있는 그대로 괜찮아요",
  "잘하고 있어요. 조금 느려도 괜찮아요",
  "버리고 싶은 생각은 여기에 두고 가볍게 가요",
  "오늘의 걱정은 오늘로 충분해요",
  "혼자 짊어지지 않아도 돼요",
  "숨 한 번 크게 쉬고, 천천히 내려놓아요",
  "당신은 생각보다 훨씬 잘 견디고 있어요",
  "불안한 마음도 지나가는 바람이에요",
  "작은 일에도 지친 날, 충분히 그럴 수 있어요",
  "나를 아껴주는 하루가 되길 바라요",
  "무거웠던 하루, 이제 재로 날려 보내요",
  "완벽하지 않아도 괜찮아요, 그게 나예요",
  "오늘도 버텨낸 나에게 박수를 보내요",
  "마음이 편해지는 순간까지 천천히 가요",
  "내일의 나는 조금 더 가벼울 거예요",
];
/** 롤링에 보여줄 응원글 개수 */
const TEASER_COUNT = 3;

/** 풀에서 중복 없이 TEASER_COUNT개를 무작위로 뽑음 */
function pickTeaser(): string[] {
  const pool = [...TEASER_POOL];
  const picked: string[] = [];
  while (picked.length < TEASER_COUNT && pool.length > 0) {
    const i = Math.floor(Math.random() * pool.length);
    picked.push(pool.splice(i, 1)[0]);
  }
  return picked;
}

type ModeType = 'input' | 'dropping' | 'burning' | 'idle-after-combo';

const ConfettiPiece = ({ color, dx, dy, rot }: { color: string, dx: number, dy: number, rot: number }) => {
  const [active, setActive] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setActive(true), 30);
    return () => clearTimeout(t);
  }, []);

  return (
    <div style={{
      position: 'absolute',
      width: '7px', height: '10px', borderRadius: '2px',
      backgroundColor: color,
      transform: active ? `translate(${dx}px, ${dy}px) rotate(${rot}deg) scale(0.8)` : `translate(0px, 0px) rotate(0deg) scale(0)`,
      opacity: active ? 0 : 1,
      transition: 'transform 1.2s cubic-bezier(0.25, 1, 0.5, 1), opacity 1.2s ease-in',
      pointerEvents: 'none'
    }} />
  );
};

export default function Home() {
  const [state, setState] = useState({
    points: 0,
    totalRecovery: 0,
    /** 버리기 광고 누적 횟수 (0~4). 5가 되면 지급하고 0으로 */
    adStack: 0,
    todayAdClaims: 0,
    /** 오늘 지급받은 금액 (원) */
    todayEarned: 0,
    todayDate: todayStr(),
    chances: MAX_CHANCES,
    chanceAt: Date.now(),
  });
  const [now, setNow] = useState(() => Date.now());
  const [mode, setMode] = useState<ModeType>('input');
  /** 소각이 끝나서 "광고 보고 게이지 채우기" 버튼을 보여줄지 */
  const [fillReady, setFillReady] = useState(false);
  /** 리워드 광고가 로드 완료됐는지 (로드 전에는 광고 버튼을 막음) */
  const [rewardedReady, setRewardedReady] = useState(false);
  /** 리워드 광고 로드 실패 메시지 (있으면 버튼에서 다시 시도) */
  const [rewardedError, setRewardedError] = useState<string | null>(null);
  const [interstitialReady, setInterstitialReady] = useState(false);
  const [interstitialError, setInterstitialError] = useState<string | null>(null);
  const adSupported = isAdSupported(GoogleAdMob.loadAppsInTossAdMob);
  const [worryText, setWorryText] = useState('');
  const [comboCount, setComboCount] = useState(0);
  const [statusMsg, setStatusMsg] = useState(' ');
  // 응원글 풀에서 3개를 뽑아 롤링. 한 바퀴 돌 때마다 다시 뽑음
  const [teaserSet, setTeaserSet] = useState<string[]>(() => pickTeaser());
  // 0~2: 실제 문구, 3: 첫 문구 복제본(끝에서 처음으로 자연스럽게 이어지도록)
  const [teaserPos, setTeaserPos] = useState(0);
  const [teaserAnimate, setTeaserAnimate] = useState(true);

  const [flames, setFlames] = useState<{ id: number, width: number, height: number }[]>([]);
  const [showConfetti, setShowConfetti] = useState(false);
  const [toast, setToast] = useState<{ message: string, visible: boolean, icon?: string }>({ message: '', visible: false, icon: 'p' });

  const showToast = (message: string, icon: string = 'p') => {
    setToast({ message, visible: true, icon });
    setTimeout(() => setToast(prev => ({ ...prev, visible: false })), 3000);
  };

  const flameIdRef = useRef(0);
  const adInFlight = useRef(false);
  const REWARDED_AD_GROUP_ID = import.meta.env.VITE_AD_GROUP_ID || 'ait-ad-test-rewarded-id';
  const INTERSTITIAL_AD_GROUP_ID = import.meta.env.VITE_INTERSTITIAL_AD_GROUP_ID || 'ait-ad-test-interstitial-id';
  const BANNER_AD_GROUP_ID = import.meta.env.VITE_BANNER_AD_GROUP_ID || 'ait-ad-test-native-image-id';
  const bannerRef = useRef<HTMLDivElement>(null);
  const sheetBannerRef = useRef<HTMLDivElement>(null);
  const PROMOTION_CODE = import.meta.env.VITE_PROMOTION_CODE || 'TEST_01M6VYR4ZVWMR73EZRXE266ARX';

  /** 광고 로드 큐: 한 번에 하나만 로드 (동시에 로드하면 Android 5.266.0에서 로드 이벤트가 사라질 수 있음) */
  const loadQueue = useRef<{ adGroupId: string; purpose: 'reward' | 'interstitial' }[]>([]);
  const loadBusy = useRef(false);
  const runNextLoad = () => {
    if (loadBusy.current) return;
    const job = loadQueue.current.shift();
    if (!job) return;
    loadBusy.current = true;
    const t0 = performance.now();
    let finished = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const finish = () => {
      if (finished) return;
      finished = true;
      if (timer) clearTimeout(timer);
      loadBusy.current = false;
      runNextLoad();
    };
    if (!isAdSupported(GoogleAdMob.loadAppsInTossAdMob)) {
      finish();
      return;
    }
    // 10초 안에 로드가 안 끝나면 실패로 보고 다음 로드로 넘어감
    timer = setTimeout(() => {
      if (job.purpose === 'reward') setRewardedError('광고 불러오기 시간 초과');
      else setInterstitialError('광고 불러오기 시간 초과');
      finish();
    }, 10000);
    GoogleAdMob.loadAppsInTossAdMob({
      options: { adGroupId: job.adGroupId },
      onEvent: (event) => {
        if (event.type !== 'loaded') return;
        if (job.purpose === 'reward') {
          setRewardedReady(true);
          setRewardedError(null);
        } else {
          setInterstitialReady(true);
          setInterstitialError(null);
        }
        logAdTiming(`${job.purpose} 로드 완료`, performance.now() - t0);
        finish();
      },
      onError: (err) => {
        console.error('광고 로드 실패:', err);
        if (job.purpose === 'reward') setRewardedError(errText(err));
        else setInterstitialError(errText(err));
        finish();
      },
    });
  };
  const requestLoad = (purpose: 'reward' | 'interstitial') => {
    loadQueue.current.push({
      adGroupId: purpose === 'reward' ? REWARDED_AD_GROUP_ID : INTERSTITIAL_AD_GROUP_ID,
      purpose,
    });
    runNextLoad();
  };

  useEffect(() => {
    // 마운트 시 리워드 → 전면 순서로 하나씩 로드
    if (isAdSupported(GoogleAdMob.loadAppsInTossAdMob)) {
      requestLoad('interstitial');
      requestLoad('reward');
    }

    // 브라우저 개발 환경은 광고가 없으니 버튼만 열어둠 (흐름 확인용)
    if (!isAdSupported(GoogleAdMob.loadAppsInTossAdMob) && import.meta.env.DEV) {
      setRewardedReady(true);
      setInterstitialReady(true);
    }
  }, [REWARDED_AD_GROUP_ID, INTERSTITIAL_AD_GROUP_ID]);

  // 회복 게이지 위 배너 광고 (토스 앱에서만 노출, 브라우저에선 자리만 비어 있음)
  useEffect(() => {
    if (!isAdSupported(TossAds.attachBanner)) return;
    let destroyed = false;
    let handle: { destroy: () => void } | undefined;
    const attach = () => {
      if (destroyed || !bannerRef.current) return;
      handle = TossAds.attachBanner(BANNER_AD_GROUP_ID, bannerRef.current, { theme: 'auto', tone: 'grey', variant: 'card' });
    };
    try {
      if (isAdSupported(TossAds.initialize)) {
        TossAds.initialize({
          callbacks: {
            onInitialized: attach,
            onInitializationFailed: (err) => console.error('배너 광고 초기화 실패:', err),
          },
        });
      } else {
        attach();
      }
    } catch (err) {
      console.error('배너 광고 연결 실패:', err);
    }
    return () => {
      destroyed = true;
      handle?.destroy();
    };
  }, [BANNER_AD_GROUP_ID]);

  // 바텀시트 안 배너 광고 (시트가 열릴 때마다 붙임)
  const sheetOpen = mode === 'idle-after-combo' && fillReady;
  useEffect(() => {
    if (!sheetOpen || !isAdSupported(TossAds.attachBanner)) return;
    let destroyed = false;
    let handle: { destroy: () => void } | undefined;
    const attach = () => {
      if (destroyed || !sheetBannerRef.current) return;
      handle = TossAds.attachBanner(BANNER_AD_GROUP_ID, sheetBannerRef.current, { theme: 'auto', tone: 'grey', variant: 'card' });
    };
    try {
      if (isAdSupported(TossAds.initialize)) {
        TossAds.initialize({
          callbacks: {
            onInitialized: attach,
            onInitializationFailed: (err) => console.error('배너 광고 초기화 실패:', err),
          },
        });
      } else {
        attach();
      }
    } catch (err) {
      console.error('시트 배너 광고 연결 실패:', err);
    }
    return () => {
      destroyed = true;
      handle?.destroy();
    };
  }, [sheetOpen, BANNER_AD_GROUP_ID]);

  useEffect(() => {
    const timer = setInterval(() => {
      // 끝(복제본, index 5)을 넘기면 0으로 되돌림. 응원글 편집 중에도 위치가 벗어나지 않게
      setTeaserPos(prev => (prev >= TEASER_COUNT ? 0 : prev + 1));
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  // 끝(복제본)까지 굴러간 뒤 애니메이션 없이 0번으로 되돌린 다음 다시 켠다
  useEffect(() => {
    if (teaserAnimate) return;
    const id = requestAnimationFrame(() => requestAnimationFrame(() => setTeaserAnimate(true)));
    return () => cancelAnimationFrame(id);
  }, [teaserAnimate]);

  // 1초마다 현재 시각 갱신 → 기회 충전 타이머 표시 및 충전 반영, 날짜가 바뀌면 일일 값 리셋
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    setState(prev => {
      if (prev.todayDate !== todayStr()) {
        return { ...prev, todayDate: todayStr(), todayAdClaims: 0, todayEarned: 0 };
      }
      const r = rechargeChances(prev.chances, prev.chanceAt, now);
      if (r.chances === prev.chances && r.anchor === prev.chanceAt) return prev;
      return { ...prev, chances: r.chances, chanceAt: r.anchor };
    });
  }, [now]);

  useEffect(() => {
    try {
      const res = localStorage.getItem(STORAGE_KEY);
      const parsed = res ? JSON.parse(res) : {
        points: 0, totalRecovery: 0, adStack: 0, todayAdClaims: 0, todayEarned: 0,
        todayDate: todayStr()
      };

      let needsStateUpdate = false;
      if (parsed.todayDate !== todayStr()) {
        parsed.todayDate = todayStr();
        parsed.todayAdClaims = 0;
        parsed.todayEarned = 0;
        needsStateUpdate = true;
      }
      // 이전 버전에서 저장된 데이터에는 todayEarned가 없을 수 있음
      parsed.todayEarned = parsed.todayEarned ?? 0;

      if (res || needsStateUpdate) {
        setState(prev => ({ ...prev, ...parsed }));
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // ignore
    }
  }, [state]);

  /** 회복 획득 (소각 콤보·복권·초대·출석). 지급과는 무관 */
  const addRecovery = (n: number) => {
    setState(prev => ({ ...prev, totalRecovery: prev.totalRecovery + n }));
  };

  /** 메인 입력 화면으로 복귀 */
  const returnToInput = () => {
    setFillReady(false);
    setMode('input');
    setComboCount(0);
    setStatusMsg(' ');
  };

  /** 소각 시작 (기회 1개 소모) */
  const beginBurn = () => {
    const rech = rechargeChances(state.chances, state.chanceAt, Date.now());
    const base = rech.chances >= MAX_CHANCES ? Date.now() : rech.anchor;
    setState(prev => ({ ...prev, chances: Math.max(0, rech.chances - 1), chanceAt: base }));
    setMode('dropping');
    setTimeout(() => {
      setMode('burning');
      setComboCount(0);
      setStatusMsg('꾹 누르면 빨리 소각됩니다~');
    }, 850);
  };

  const handleDrop = () => {
    if (mode !== 'input' || !worryText.trim()) return;
    // 게이지가 가득 찼으면 먼저 포인트를 받아야 소각할 수 있음
    if (state.adStack >= GAUGE_TARGET && state.todayEarned < DAILY_REWARD_CAP) return;
    const rech = rechargeChances(state.chances, state.chanceAt, Date.now());
    if (rech.chances <= 0) {
      showToast('기회를 모두 썼어요. 잠시 후 충전돼요');
      return;
    }
    setFillReady(false);
    beginBurn();
  };

  const spawnFlame = () => {
    const id = flameIdRef.current++;
    const width = 36 + Math.random() * 18;
    const height = 48 + Math.random() * 22;
    setFlames(prev => [...prev, { id, width, height }]);
    setTimeout(() => {
      setFlames(prev => prev.filter(f => f.id !== id));
    }, 720);
  };

  const burnIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const triggerBurn = () => {
    spawnFlame();
    setComboCount(prev => prev + 1);
  };

  const onBurnDown = () => {
    if (mode !== 'burning') return;
    triggerBurn();
    burnIntervalRef.current = setInterval(() => {
      triggerBurn();
    }, 150);
  };

  const onBurnUp = () => {
    if (burnIntervalRef.current) {
      clearInterval(burnIntervalRef.current);
      burnIntervalRef.current = null;
    }
  };

  useEffect(() => {
    if (mode === 'burning' && comboCount > 0) {
      setStatusMsg('소각중...');
      if (comboCount >= COMBO_TARGET) {
        setStatusMsg('+1 회복 획득');
        setMode('idle-after-combo');
        addRecovery(1);
        setShowConfetti(true);
        onBurnUp(); // Stop interval

        setTimeout(() => {
          setShowConfetti(false);
          // 소각이 끝났으니 게이지 채우기 버튼 노출
          setFillReady(true);
        }, 1000);
      }
    }
  }, [comboCount, mode]);

  const loadNextAd = (purpose: 'fill' | 'claim' | 'interstitial') => {
    if (isAdSupported(GoogleAdMob.loadAppsInTossAdMob)) requestLoad(purpose === 'claim' ? 'reward' : 'interstitial');
  };

  /** 게이지 채우기 광고 1회 완료: 게이지 +1 (지급은 아직 안 함) */
  const onFillAdEarned = () => {
    const next = Math.min(state.adStack + 1, GAUGE_TARGET);
    setState(prev => ({ ...prev, adStack: next, todayAdClaims: prev.todayAdClaims + 1 }));
    showToast(next >= GAUGE_TARGET
      ? '게이지가 가득 찼어요! 토스 포인트로 받아보세요'
      : `회복 게이지 ${next}/${GAUGE_TARGET} 채웠어요`);
  };

  /** 가득 찬 게이지 받기: 광고를 끝까지 본 뒤 포인트 지급. 실패하면 게이지가 그대로 남아 다시 받을 수 있음 */
  const onClaimAdEarned = async () => {
    try {
      const result = await grantPromotionRewardForGame({
        params: {
          promotionCode: PROMOTION_CODE,
          amount: REWARD_PER_GAUGE,
        },
      });
      if (!result) {
        showToast('지원하지 않는 앱 버전입니다.');
      } else if (result === 'ERROR') {
        showToast('포인트 지급 중 오류가 발생했습니다.');
      } else if ('key' in result) {
        showToast(`토스 포인트 ${REWARD_PER_GAUGE}원을 받았어요!`);
        setState(prev => ({
          ...prev,
          adStack: 0,
          points: prev.points + REWARD_PER_GAUGE,
          todayEarned: prev.todayEarned + REWARD_PER_GAUGE,
        }));
      } else if ('errorCode' in result) {
        showToast(`포인트 지급 실패: ${result.message}`);
      }
    } catch (e) {
      console.error(e);
      showToast('포인트 지급 오류가 발생했습니다.');
    }
  };

  /** onDone: 전면 광고가 닫히거나 실패하면 호출 (소각 시작 등 후속 동작) */
  const startAd = (purpose: 'fill' | 'claim' | 'interstitial', onDone?: () => void) => {
    if (adInFlight.current) { onDone?.(); return; }
    // 오늘 한도(1,000원)에 도달하면 리워드·전면 광고 모두 띄우지 않음
    if (state.todayEarned >= DAILY_REWARD_CAP) {
      if (purpose !== 'interstitial') showToast(`오늘 토스 포인트 ${DAILY_REWARD_CAP}원 한도를 모두 받았어요. 내일 다시 받을 수 있어요`);
      onDone?.();
      return;
    }
    adInFlight.current = true;
    const finish = () => { adInFlight.current = false; };
    const isInterstitial = purpose === 'interstitial';
    const adGroupId = purpose === 'claim' ? REWARDED_AD_GROUP_ID : INTERSTITIAL_AD_GROUP_ID;
    // 리워드 광고는 한 번 보면 다음 광고가 로드될 때까지 버튼을 막음
    if (purpose === 'claim') setRewardedReady(false);
    else setInterstitialReady(false);

    if (isAdSupported(GoogleAdMob.showAppsInTossAdMob)) {
      let earned = false;
      let tAdShown: number | undefined;
      const tShow = performance.now();
      GoogleAdMob.showAppsInTossAdMob({
        options: { adGroupId },
        onEvent: async (event) => {
          // 호출 시점부터 각 이벤트까지 경과 시간 (requested→show 가 광고 표시 지연)
          logAdTiming(`${purpose} ${event.type}`, performance.now() - tShow);
          if (event.type === 'show') tAdShown = performance.now();
          switch (event.type) {
            case 'dismissed':
              // show → dismissed = 실제 시청 시간
              if (tAdShown !== undefined) logAdTiming(`${purpose} 시청시간`, performance.now() - tAdShown);
              finish();
              loadNextAd(purpose);
              if (purpose === 'fill') {
                // 전면 광고는 보상이 없어서, 닫히면 게이지 +1
                returnToInput();
                onFillAdEarned();
                break;
              }
              if (purpose === 'interstitial') {
                // 전면 광고는 보상 없음. 닫히면 소각 시작
                onDone?.();
                break;
              }
              if (!earned) {
                showToast(
                  purpose === 'claim' ? '광고를 끝까지 봐야 포인트를 받을 수 있어요' : '광고를 끝까지 봐야 게이지가 차요'
                );
              }
              break;
            case 'failedToShow':
              finish();
              loadNextAd(purpose);
              if (isInterstitial) onDone?.();
              showToast('광고 표시에 실패했습니다.');
              break;
            case 'userEarnedReward':
              if (purpose === 'claim') {
                earned = true;
                await onClaimAdEarned();
              }
              break;
          }
        },
        onError: (err) => {
          finish();
          console.error(err);
          loadNextAd(purpose);
          if (isInterstitial) onDone?.();
          showToast('광고를 표시할 수 없습니다.');
        },
      });
    } else {
      // SDK 미지원 환경. 운영에선 광고 없이 보상이 나가면 안 되므로 막고, 개발 환경에서만 흐름 확인용으로 통과
      finish();
      if (purpose === 'interstitial') {
        // 전면을 띄울 수 없는 환경이면 광고 없이 바로 소각 시작
        onDone?.();
        return;
      }
      if (!import.meta.env.DEV) {
        showToast('광고를 불러올 수 없어요. 토스 앱에서 다시 시도해 주세요');
        return;
      }
      if (purpose === 'fill') {
        // 브라우저 테스트용: 광고 없이 게이지만 올리고 메인으로 복귀 (포인트 지급은 토스 앱에서만)
        const next = Math.min(state.adStack + 1, GAUGE_TARGET);
        setState(prev => ({ ...prev, adStack: next }));
        showToast(`[개발] 게이지 ${next}/${GAUGE_TARGET}`);
        returnToInput();
      } else {
        showToast(`[개발] 포인트 지급은 토스 앱에서만 됩니다`);
      }
    }
  };

  const capped = state.todayEarned >= DAILY_REWARD_CAP;
  /** 게이지가 가득 차면 쓰레기통 버튼이 포인트 받기 버튼으로 바뀜 */
  const gaugeFull = state.adStack >= GAUGE_TARGET && !capped;
  const rech = rechargeChances(state.chances, state.chanceAt, now);
  const chancesNow = rech.chances;
  const remainSec = chancesNow < MAX_CHANCES
    ? Math.max(0, Math.ceil((CHANCE_RECHARGE_MS - ((now - rech.anchor) % CHANCE_RECHARGE_MS)) / 1000))
    : 0;
  const remainText = `${String(Math.floor(remainSec / 60)).padStart(2, '0')}:${String(remainSec % 60).padStart(2, '0')}`;

  return (
    <div className="stage">
      <div className="eyebrow">EMOTION BURNER</div>
      <h1 className="title-text">감정소각장</h1>

      <div className="teaser">
        <div className="teaser-viewport">
          <div
            className="teaser-strip"
            style={{ transform: `translateY(-${teaserPos * 44}px)`, transition: teaserAnimate ? undefined : 'none' }}
            onTransitionEnd={e => {
              if (e.target !== e.currentTarget || teaserPos !== TEASER_COUNT) return;
              setTeaserAnimate(false);
              setTeaserPos(0);
              setTeaserSet(pickTeaser());
            }}
          >
            {[...teaserSet, teaserSet[0]].map((msg, idx) => (
              <div key={idx} className="teaser-line">{msg}</div>
            ))}
          </div>
        </div>
      </div>

        <div className="sub-panel" style={{ marginTop: 30 }}>
          {mode === 'input' && (
            <>
              <div className="panel-label">지금 마음에 걸리는 고민이나<br />스트레스를 적어보세요</div>
              <textarea
                className="worry-textarea"
                maxLength={80}
                placeholder="예: 내일 발표가 너무 떨려"
                value={worryText}
                onChange={e => setWorryText(e.target.value)}
              />
              <div className="char-count">{worryText.length}/80</div>
              <div className="chance-info">
                <span>기회 {chancesNow}/{MAX_CHANCES} 남음</span>
                {chancesNow < MAX_CHANCES && <span>충전까지 {remainText}</span>}
              </div>
              <button
                className="action-btn soft-ember"
                disabled={worryText.trim().length === 0 || chancesNow <= 0 || gaugeFull}
                onClick={handleDrop}
              >
                쓰레기통에 버리기
              </button>
              {gaugeFull && (
                <div className="gauge-sub cap-note">
                  게이지가 가득 찼어요. 아래에서 토스 포인트를 받아주세요
                </div>
              )}
            </>
          )}


          {mode !== 'input' && (
            <>
              <div className="furnace-wrap">
                <div
                  className={`worry-paper ${mode === 'dropping' ? 'falling' : ''}`}
                  style={{ opacity: mode === 'dropping' ? 1 : 0 }}
                >
                  고민
                </div>
                <div className="flame-layer">
                  {flames.map(f => (
                    <div
                      key={f.id}
                      className="flame"
                      style={{ width: f.width, height: f.height, animation: 'flameBurn 0.7s ease-out forwards' }}
                    />
                  ))}
                </div>
                <div className="ash-pile" style={{ width: `${170 * Math.min(1 + state.totalRecovery * 0.01, 1.6)}px` }}></div>
                <div
                  className={`bin ${mode === 'burning' ? '' : 'disabled'}`}
                  role="button"
                  tabIndex={0}
                  onPointerDown={onBurnDown}
                  onPointerUp={onBurnUp}
                  onPointerLeave={onBurnUp}
                  onPointerCancel={onBurnUp}
                  onKeyDown={e => { if (mode === 'burning' && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); triggerBurn(); } }}
                >
                  <svg viewBox="0 0 150 170" xmlns="http://www.w3.org/2000/svg">
                    <ellipse cx="75" cy="150" rx="52" ry="10" fill="#0000001a"></ellipse>
                    <path d="M35 55 L45 155 Q75 165 105 155 L115 55 Z" fill="#FFF6EC" stroke="#FFC074" strokeWidth="4" strokeLinejoin="round"></path>
                    <circle cx="60" cy="95" r="4" fill="#FF9B71"></circle>
                    <circle cx="90" cy="95" r="4" fill="#FF9B71"></circle>
                    <path d="M65 110 Q75 120 85 110" fill="none" stroke="#FF9B71" strokeWidth="4" strokeLinecap="round"></path>
                    <ellipse cx="50" cy="100" rx="6" ry="4" fill="#FFD2C0"></ellipse>
                    <ellipse cx="100" cy="100" rx="6" ry="4" fill="#FFD2C0"></ellipse>
                    <rect x="28" y="40" width="94" height="18" rx="8" fill="#FFD2C0" stroke="#FFC074" strokeWidth="4"></rect>
                    <rect x="50" y="28" width="50" height="14" rx="6" fill="#FFD2C0" stroke="#FFC074" strokeWidth="4"></rect>
                  </svg>
                </div>
                {showConfetti && (
                  <div className="confetti-container">
                    {Array.from({ length: 20 }).map((_, i) => {
                      const angle = (Math.random() * Math.PI) - (Math.PI / 2);
                      const distance = 50 + Math.random() * 90;
                      const dx = Math.sin(angle) * distance;
                      const dy = -Math.cos(angle) * distance - 50;
                      const rot = Math.random() * 360 + 360;
                      const colors = ['#FF6B35', '#E0A94A', '#F2E9DD', '#8A8177', '#C4432B'];
                      const color = colors[Math.floor(Math.random() * colors.length)];
                      return (
                        <ConfettiPiece key={i} color={color} dx={dx} dy={dy} rot={rot} />
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="status-msg">{statusMsg}</div>
              <div className="combo-row">
                {[0, 1, 2, 3, 4].map(i => (
                  <div key={i} className={`combo-dot ${i < comboCount ? 'filled' : ''}`}></div>
                ))}
              </div>
            </>
          )}

        </div>

      <div ref={bannerRef} className="ad-banner" />

      <div className="gauge-panel">
        <div className="gauge-top">
          <span>회복 게이지 {state.adStack} / {GAUGE_TARGET}</span>
        </div>
        <div className="gauge-hint">게이지를 다 채우면 토스 포인트를 받아요</div>
        <div className="gauge-track">
          <div className="gauge-fill" style={{ width: `${(state.adStack / GAUGE_TARGET) * 100}%` }}></div>
        </div>
        {state.adStack >= GAUGE_TARGET && !capped && (
          <button
            className="gauge-claim"
            disabled={!rewardedReady && (!rewardedError || !adSupported)}
            onClick={() => (rewardedReady ? startAd('claim') : loadNextAd('claim'))}
          >
            {rewardedReady ? (<><span className="ad-badge">AD</span>토스 포인트로 받기</>)
              : !adSupported ? '이 환경에서는 광고를 볼 수 없어요'
              : rewardedError ? '광고 다시 불러오기'
              : '광고를 불러오는 중...'}
          </button>
        )}
        {capped && (
          <div className="gauge-sub cap-note">
            오늘 토스 포인트 {DAILY_REWARD_CAP}원 한도를 모두 받았어요. 내일 다시 받을 수 있어요
          </div>
        )}
      </div>

      {/* 소각 완료 시 바텀시트: 광고 보고 게이지 채우기 */}
      {mode === 'idle-after-combo' && fillReady && (
        <div className="fill-sheet-backdrop" onClick={returnToInput}>
          <div className="fill-sheet" onClick={e => e.stopPropagation()}>
            <div className="fill-sheet-handle" />
            <div className="fill-sheet-title">회복 게이지 채우기</div>
            <div className="fill-sheet-sub">
              광고를 보면 게이지가 1칸 차요 ({state.adStack}/{GAUGE_TARGET})
              <br />5칸이 차면 {REWARD_PER_GAUGE}원을 받아요
            </div>
            <div ref={sheetBannerRef} className="fill-sheet-banner" />
            {capped ? (
              <div className="fill-sheet-sub">오늘 토스 포인트 {DAILY_REWARD_CAP}원 한도를 모두 받았어요. 내일 다시 받을 수 있어요</div>
            ) : state.adStack >= GAUGE_TARGET ? (
              <div className="fill-sheet-sub">게이지가 가득 찼어요. 위에서 토스 포인트로 받아주세요</div>
            ) : (
              <button
                className="fill-sheet-cta"
                disabled={!interstitialReady && (!interstitialError || !adSupported)}
                onClick={() => (interstitialReady ? startAd('fill') : loadNextAd('fill'))}
              >
                {interstitialReady ? (<><span className="ad-badge">AD</span>광고 보고 게이지 채우기</>)
                  : !adSupported ? '이 환경에서는 광고를 볼 수 없어요'
                  : interstitialError ? '광고 다시 불러오기'
                  : '광고를 불러오는 중...'}
              </button>
            )}
            {interstitialError && <div className="fill-sheet-sub">{interstitialError}</div>}
          </div>
        </div>
      )}

      {/* Bottom Spacer */}
      <div style={{ height: 40 }} />

      {toast.visible && (
        <div className="toast">
          <div className="toast-icon" style={toast.icon !== 'p' ? { background: 'none', color: 'inherit', fontSize: '20px' } : {}}>{toast.icon}</div>
          <div className="toast-message">{toast.message}</div>
        </div>
      )}
    </div>
  );
}
