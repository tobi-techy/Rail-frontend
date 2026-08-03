import React, { useEffect, useState } from 'react';
import { View, Image } from 'react-native';
import { Building04Icon, IconComponent as HugeiconsIcon } from '@/lib/icons';
import { resolveBankLogoOrDefault } from '@/lib/bankLogos';

interface BankLogoProps {
  bankName?: string;
  bankCode?: string;
  /** Diameter in px. Icon fallback scales from this. Default 48. */
  size?: number;
}

/**
 * Circular bank avatar backed by the ng-bank-logos dataset (see lib/bankLogos).
 * Always resolves to *some* image — a matched logo or the shared placeholder —
 * and only falls back to a local building icon if the image itself fails to
 * load (offline / CDN hiccup), so a bank row never renders empty.
 */
export const BankLogo = React.memo(function BankLogo({
  bankName,
  bankCode,
  size = 48,
}: BankLogoProps) {
  const [errored, setErrored] = useState(false);
  const uri = resolveBankLogoOrDefault(bankName, bankCode);

  // FlatList keeps instances alive across data changes — reset the error state
  // when the target bank changes so a prior failure doesn't stick.
  useEffect(() => setErrored(false), [uri]);

  // Decorative in every usage — the bank name always sits adjacent as text, so
  // hide the logo from VoiceOver rather than announcing a bare "image".
  if (errored) {
    return (
      <View
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        className="items-center justify-center rounded-full bg-stone-surface"
        style={{ width: size, height: size }}>
        <HugeiconsIcon icon={Building04Icon} size={size * 0.42} color="#848281" />
      </View>
    );
  }

  return (
    <Image
      source={{ uri }}
      onError={() => setErrored(true)}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      className="rounded-full bg-stone-surface"
      style={{ width: size, height: size }}
    />
  );
});
