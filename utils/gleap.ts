type GleapModule = {
  initialize: (token: string) => void;
  showFeedbackButton: (visible: boolean) => void;
  identifyContact: (id: string, data?: Record<string, unknown>) => void;
  clearIdentity: () => void;
  open: () => void;
};

const resolveGleapModule = (): GleapModule | null => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const imported = require('react-native-gleapsdk') as GleapModule | { default?: GleapModule };
    if ('default' in imported && imported.default) {
      return imported.default;
    }
    return imported as GleapModule;
  } catch {
    return null;
  }
};

const nativeGleap = resolveGleapModule();
let hasWarnedMissingModule = false;

const warnMissingGleapModule = () => {
  if (!__DEV__ || hasWarnedMissingModule || nativeGleap) return;
  hasWarnedMissingModule = true;
  console.warn(
    '[Gleap] Native module unavailable. Rebuild your Android/iOS dev client after installing react-native-gleapsdk.'
  );
};

const safeInvoke = (fn: () => void) => {
  try {
    fn();
  } catch (error) {
    if (__DEV__) {
      console.warn('[Gleap] Call failed', error);
    }
  }
};

const gleap = {
  get isAvailable() {
    return Boolean(nativeGleap);
  },
  initialize(token: string) {
    if (!nativeGleap) {
      warnMissingGleapModule();
      return;
    }
    safeInvoke(() => nativeGleap.initialize(token));
  },
  showFeedbackButton(visible: boolean) {
    if (!nativeGleap) {
      warnMissingGleapModule();
      return;
    }
    safeInvoke(() => nativeGleap.showFeedbackButton(visible));
  },
  identifyContact(id: string, data?: Record<string, unknown>) {
    if (!nativeGleap) {
      warnMissingGleapModule();
      return;
    }
    safeInvoke(() => nativeGleap.identifyContact(id, data));
  },
  clearIdentity() {
    if (!nativeGleap) {
      warnMissingGleapModule();
      return;
    }
    safeInvoke(() => nativeGleap.clearIdentity());
  },
  open() {
    if (!nativeGleap) {
      warnMissingGleapModule();
      return;
    }
    safeInvoke(() => nativeGleap.open());
  },
};

export default gleap;
