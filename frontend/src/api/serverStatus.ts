// Bepul Render rejasida servis 15 daqiqa harakatsizlikdan keyin uxlaydi va
// keyingi so'rov ~30-60 soniya kutadi. Bunday paytda sayt "qotib qolgandek"
// ko'rinmasligi uchun uzoq davom etayotgan so'rovlar shu yerda belgilanadi va
// `ServerWakeBanner` foydalanuvchiga nima bo'layotganini aytadi.

export type ServerState = 'idle' | 'waking';

const SLOW_MS = 4000;

let state: ServerState = 'idle';
let pending = 0;
let slowTimer: ReturnType<typeof setTimeout> | null = null;
const listeners = new Set<(s: ServerState) => void>();

function setState(next: ServerState): void {
  if (state === next) return;
  state = next;
  for (const listener of listeners) listener(state);
}

export function getServerState(): ServerState {
  return state;
}

export function subscribeServerState(listener: (s: ServerState) => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** apiFetch har so'rov boshida chaqiradi; qaytgan funksiya so'rov tugaganda chaqiriladi. */
export function trackRequest(): () => void {
  pending += 1;
  if (pending === 1 && !slowTimer) {
    slowTimer = setTimeout(() => {
      slowTimer = null;
      if (pending > 0) setState('waking');
    }, SLOW_MS);
  }

  let done = false;
  return () => {
    if (done) return;
    done = true;
    pending = Math.max(0, pending - 1);
    if (pending === 0) {
      if (slowTimer) {
        clearTimeout(slowTimer);
        slowTimer = null;
      }
      setState('idle');
    }
  };
}
