/** Messaging platforms Miriam can be linked on. */
export type PlatformType = 'imessage' | 'whatsapp' | 'telegram';

export interface InitiateLinkResponse {
  /** Opens Messages pre-filled to text the token to the bridge. May be empty. */
  deep_link?: string;
  /** The address the user texts the token to (shown when no deep link). */
  bridge_address?: string;
  token: string;
  expires_in_seconds: number;
}

export interface LinkedIdentity {
  platform: PlatformType | string;
  handle?: string;
  display_name?: string;
  linked_at?: string;
  verified?: boolean;
}
