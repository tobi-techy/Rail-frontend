declare module '@sumsub/react-native-mobilesdk-module' {
  type SumsubStatusEvent = { prevStatus: string; newStatus: string };
  type SumsubResult = {
    success?: boolean;
    status?: string;
    errorMsg?: string;
  };

  type SumsubBuilder = {
    withHandlers(handlers: { onStatusChanged?: (event: SumsubStatusEvent) => void }): SumsubBuilder;
    withLocale(locale: string): SumsubBuilder;
    withAutoCloseOnApprove(seconds: number): SumsubBuilder;
    build(): { launch(): Promise<SumsubResult> };
  };

  const SNSMobileSDK: {
    init(token: string, refreshToken: () => Promise<string>): SumsubBuilder;
  };

  export default SNSMobileSDK;
}
