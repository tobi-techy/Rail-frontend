import { useWalletStore } from '../../stores/walletStore';

describe('walletStore', () => {
  beforeEach(() => {
    useWalletStore.getState().reset?.() || useWalletStore.setState({
      balance: 0,
      transactions: [],
      isLoading: false,
      error: null,
    });
  });

  it('should have initial state', () => {
    const state = useWalletStore.getState();
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();
  });

  it('should update balance', () => {
    useWalletStore.setState({ balance: 1000 });
    expect(useWalletStore.getState().balance).toBe(1000);
  });

  it('should handle loading state', () => {
    useWalletStore.setState({ isLoading: true });
    expect(useWalletStore.getState().isLoading).toBe(true);
  });

  it('should handle error state', () => {
    useWalletStore.setState({ error: 'Failed to fetch' });
    expect(useWalletStore.getState().error).toBe('Failed to fetch');
  });
});
