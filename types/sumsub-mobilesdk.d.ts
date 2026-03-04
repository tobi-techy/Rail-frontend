declare module '@sumsub/react-native-mobilesdk-module' {
  interface StatusChangedEvent {
    prevStatus: string;
    newStatus: string;
  }

  interface Builder {
    withAccessToken(token: string, expirationHandler: () => Promise<string>): Builder;
    withLocale(locale: string): Builder;
    withApplicantConf(conf: Record<string, unknown>): Builder;
    withHandlers(handlers: {
      onStatusChanged?: (event: StatusChangedEvent) => void;
      onEvent?: (event: unknown) => void;
    }): Builder;
    withDebug(flag: boolean): Builder;
    withAnalyticsEnabled(flag: boolean): Builder;
    withAutoCloseOnApprove(interval: number): Builder;
    build(): SNSMobileSDKInstance;
  }

  interface SNSMobileSDKInstance {
    launch(): Promise<string>;
    dismiss(): void;
  }

  const SNSMobileSDK: {
    init(accessToken: string, expirationHandler: () => Promise<string>): Builder;
    reset(): void;
  };

  export default SNSMobileSDK;
}
