import { act, renderHook, waitFor } from '@testing-library/react-native';
import { useVoiceSession } from '@/hooks/useVoiceSession';
import { aiService } from '@/api/services/ai.service';
import { toggleRecording, tearDown } from '@speechmatics/expo-two-way-audio';

jest.mock('@/api/config', () => ({
  API_CONFIG: { baseURL: 'https://api.userail.money/api' },
}));

jest.mock('@/api/services/ai.service', () => ({
  aiService: {
    createVoiceSessionToken: jest.fn(),
  },
}));

jest.mock('expo-modules-core', () => ({
  requireNativeModule: () => ({ stopPlayback: jest.fn() }),
}));

jest.mock('@speechmatics/expo-two-way-audio', () => ({
  initialize: jest.fn(() => Promise.resolve()),
  playPCMData: jest.fn(),
  toggleRecording: jest.fn(),
  tearDown: jest.fn(),
  requestMicrophonePermissionsAsync: jest.fn(() => Promise.resolve({ granted: true })),
  useExpoTwoWayAudioEventListener: jest.fn(),
}));

class MockWebSocket {
  static OPEN = 1;
  static instances: MockWebSocket[] = [];

  url: string;
  readyState = MockWebSocket.OPEN;
  onmessage: ((event: { data: string }) => void) | null = null;
  onerror: (() => void) | null = null;
  onclose: (() => void) | null = null;
  close = jest.fn(() => {
    this.onclose?.();
  });
  send = jest.fn();

  constructor(url: string) {
    this.url = url;
    MockWebSocket.instances.push(this);
  }
}

describe('useVoiceSession', () => {
  const createVoiceSessionToken = aiService.createVoiceSessionToken as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    MockWebSocket.instances = [];
    (global as any).WebSocket = MockWebSocket;
  });

  it('connects with a short-lived voice session token instead of the access JWT', async () => {
    createVoiceSessionToken.mockResolvedValue({
      token: 'voice.ticket/with+symbols',
      expires_at: '2026-05-23T12:00:00Z',
    });

    const { result } = renderHook(() => useVoiceSession());

    await act(async () => {
      await result.current.connect();
    });

    expect(createVoiceSessionToken).toHaveBeenCalledTimes(1);
    expect(MockWebSocket.instances).toHaveLength(1);
    expect(MockWebSocket.instances[0].url).toBe(
      'wss://api.userail.money/api/v1/ai/voice/session?voice_session_token=voice.ticket%2Fwith%2Bsymbols'
    );
    expect(MockWebSocket.instances[0].url).not.toContain('?token=');
  });

  it('stops recording and surfaces an error when ticket creation fails', async () => {
    createVoiceSessionToken.mockRejectedValue(new Error('denied'));

    const { result } = renderHook(() => useVoiceSession());

    await act(async () => {
      await result.current.connect();
    });

    await waitFor(() => expect(result.current.state).toBe('error'));
    expect(result.current.error).toBe('Failed to start secure voice session');
    expect(toggleRecording).toHaveBeenCalledWith(false);
    expect(MockWebSocket.instances).toHaveLength(0);
  });

  it('cleans up the native recorder and WebSocket on disconnect', async () => {
    createVoiceSessionToken.mockResolvedValue({
      token: 'voice-ticket',
      expires_at: '2026-05-23T12:00:00Z',
    });

    const { result } = renderHook(() => useVoiceSession());

    await act(async () => {
      await result.current.connect();
    });

    const ws = MockWebSocket.instances[0];
    act(() => {
      result.current.disconnect();
    });

    expect(toggleRecording).toHaveBeenCalledWith(false);
    expect(tearDown).toHaveBeenCalled();
    expect(ws.close).toHaveBeenCalled();
  });
});
