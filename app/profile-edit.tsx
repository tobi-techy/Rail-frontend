import { useMemo, useState } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { CountryPicker } from '@/components';
import { Input, Button } from '@/components/ui';
import { DiceBearAvatar } from '@/components/atoms/DiceBearAvatar';
import { useAuthStore } from '@/stores/authStore';
import { useKycStore } from '@/stores/kycStore';
import { useUpdateProfile } from '@/api/hooks/useUser';
import { useFeedbackPopup } from '@/hooks/useFeedbackPopup';
import { profileEditSchema, fieldError } from '@/utils/schemas';
import { ArrowLeft01Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react-native';

const COUNTRY_NAMES: Record<string, string> = {
  US: 'United States',
  GB: 'United Kingdom',
  CA: 'Canada',
  AU: 'Australia',
  DE: 'Germany',
  FR: 'France',
  IT: 'Italy',
  ES: 'Spain',
  NL: 'Netherlands',
  SE: 'Sweden',
  IN: 'India',
  SG: 'Singapore',
  BR: 'Brazil',
  MX: 'Mexico',
  ZA: 'South Africa',
  NG: 'Nigeria',
  KE: 'Kenya',
  AE: 'United Arab Emirates',
};

const REQUIRED_KYC_FIELDS = [
  'first_name',
  'last_name',
  'date_of_birth',
  'address_street',
  'address_city',
  'address_postal_code',
  'address_country',
] as const;

const toDateOnly = (value?: string | null) => {
  if (!value) return '';
  return value.includes('T') ? value.slice(0, 10) : value;
};

const normalizeOptional = (value: string) => {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

export default function ProfileEdit() {
  const insets = useSafeAreaInsets();
  const { returnTo } = useLocalSearchParams<{ returnTo?: string }>();
  const { showError, showSuccess } = useFeedbackPopup();

  const user = useAuthStore((s) => s.user);
  const updateUser = useAuthStore((s) => s.updateUser);
  const missingProfileFields = useKycStore((s) => s.missingProfileFields);
  const setMissingProfileFields = useKycStore((s) => s.setMissingProfileFields);
  const { mutateAsync: updateProfile, isPending } = useUpdateProfile();

  const initialValues = useMemo(
    () => ({
      firstName: user?.firstName ?? '',
      lastName: user?.lastName ?? '',
      phone: user?.phone ?? user?.phoneNumber ?? '',
      dateOfBirth: toDateOnly(user?.dateOfBirth),
      countryCode: user?.country ?? '',
      countryName: user?.country ? (COUNTRY_NAMES[user.country] ?? user.country) : '',
      street: user?.addressStreet ?? '',
      city: user?.addressCity ?? '',
      state: user?.addressState ?? '',
      postalCode: user?.addressPostalCode ?? '',
      addressCountry: user?.addressCountry ?? user?.country ?? '',
    }),
    [
      user?.addressCity,
      user?.addressCountry,
      user?.addressPostalCode,
      user?.addressState,
      user?.addressStreet,
      user?.country,
      user?.dateOfBirth,
      user?.firstName,
      user?.lastName,
      user?.phone,
      user?.phoneNumber,
    ]
  );

  const [firstName, setFirstName] = useState(initialValues.firstName);
  const [lastName, setLastName] = useState(initialValues.lastName);
  const [phone, setPhone] = useState(initialValues.phone);
  const [dateOfBirth, setDateOfBirth] = useState(initialValues.dateOfBirth);
  const [countryCode, setCountryCode] = useState(initialValues.countryCode);
  const [countryName, setCountryName] = useState(initialValues.countryName);
  const [street, setStreet] = useState(initialValues.street);
  const [city, setCity] = useState(initialValues.city);
  const [state, setState] = useState(initialValues.state);
  const [postalCode, setPostalCode] = useState(initialValues.postalCode);

  const isReturningToKyc = returnTo === '/kyc';
  const requiredFields = useMemo(
    () => new Set(isReturningToKyc ? REQUIRED_KYC_FIELDS : missingProfileFields),
    [isReturningToKyc, missingProfileFields]
  );

  const avatarName = useMemo(
    () => [firstName, lastName].filter(Boolean).join(' ') || user?.email || 'Rail User',
    [firstName, lastName, user?.email]
  );

  const isDirty = useMemo(
    () =>
      firstName !== initialValues.firstName ||
      lastName !== initialValues.lastName ||
      phone !== initialValues.phone ||
      dateOfBirth !== initialValues.dateOfBirth ||
      countryCode !== initialValues.countryCode ||
      street !== initialValues.street ||
      city !== initialValues.city ||
      state !== initialValues.state ||
      postalCode !== initialValues.postalCode,
    [
      city,
      countryCode,
      dateOfBirth,
      firstName,
      initialValues,
      lastName,
      phone,
      postalCode,
      state,
      street,
    ]
  );

  // Fields that cannot be edited once set
  const isEmailLocked = Boolean(user?.email);
  const isNameLocked = Boolean(user?.firstName?.trim() && user?.lastName?.trim());
  const isDobLocked = Boolean(user?.dateOfBirth);

  const validateForm = () => {
    const result = profileEditSchema.safeParse({
      firstName,
      lastName,
      phone,
      dateOfBirth,
      street,
      city,
      state,
      postalCode,
      country: countryCode,
    });

    if (!result.success) {
      const first = result.error.issues[0];
      showError('Validation Error', first?.message ?? 'Please check your input.');
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!isDirty || isPending) return;
    if (!validateForm()) return;

    try {
      const updated = await updateProfile({
        ...(isNameLocked ? {} : {
          firstName: normalizeOptional(firstName),
          lastName: normalizeOptional(lastName),
        }),
        phone: normalizeOptional(phone),
        ...(isDobLocked ? {} : { dateOfBirth: normalizeOptional(dateOfBirth) }),
        country: normalizeOptional(countryCode),
        addressStreet: normalizeOptional(street),
        addressCity: normalizeOptional(city),
        addressState: normalizeOptional(state),
        addressPostalCode: normalizeOptional(postalCode),
        addressCountry: normalizeOptional(countryCode),
      });

      updateUser({
        ...updated,
        fullName:
          [updated.firstName ?? firstName.trim(), updated.lastName ?? lastName.trim()]
            .filter(Boolean)
            .join(' ')
            .trim() || undefined,
        phone: updated.phone ?? normalizeOptional(phone),
        phoneNumber: updated.phone ?? normalizeOptional(phone),
      });

      if (isReturningToKyc) {
        setMissingProfileFields([]);
        showSuccess('Profile updated', 'Your profile is ready for verification.');
        router.replace('/kyc');
        return;
      }

      showSuccess('Profile updated', 'Your details have been saved.');
      router.back();
    } catch (e: any) {
      showError('Update failed', e?.message ?? 'Please try again.');
    }
  };

  return (
    <View className="flex-1 bg-background-main" style={{ paddingTop: insets.top }}>
      <View className="flex-row items-center justify-between px-md py-3">
        <Pressable
          onPress={() => router.back()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          className="h-9 w-9 items-center justify-center rounded-full bg-surface">
          <HugeiconsIcon icon={ArrowLeft01Icon} size={20} color="#121212" strokeWidth={2} />
        </Pressable>
        <Text className="font-subtitle text-body text-text-primary">
          {isReturningToKyc ? 'Complete Profile' : 'Edit Profile'}
        </Text>
        <View className="w-9" />
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
        keyboardShouldPersistTaps="handled">
        <View className="items-center py-8">
          <DiceBearAvatar seed={avatarName} size={88} />
          <Text className="mt-4 font-subtitle text-[20px] text-text-primary">
            {[firstName, lastName].filter(Boolean).join(' ') || 'Rail User'}
          </Text>
          <Text className="mt-1 font-caption text-caption text-text-secondary">{user?.email}</Text>
        </View>

        <View className="mx-md mb-2 h-px bg-surface" />

        {(isNameLocked || isDobLocked) && (
          <Text className="mx-md mb-4 font-body text-[12px] leading-5 text-text-secondary">
            Name, date of birth, and email cannot be changed as they must match your verified ID.
          </Text>
        )}

        <View className="gap-4 px-md">
          <Input
            label="First Name"
            value={firstName}
            onChangeText={setFirstName}
            placeholder="Enter first name"
            autoCapitalize="words"
            returnKeyType="next"
            editable={!isNameLocked}
            style={isNameLocked ? { opacity: 0.5 } : undefined}
          />
          <Input
            label="Last Name"
            value={lastName}
            onChangeText={setLastName}
            placeholder="Enter last name"
            autoCapitalize="words"
            returnKeyType="next"
            editable={!isNameLocked}
            style={isNameLocked ? { opacity: 0.5 } : undefined}
          />
          <Input
            label="Phone Number"
            value={phone}
            onChangeText={setPhone}
            placeholder="+2348012345678"
            keyboardType="phone-pad"
            autoCapitalize="none"
            returnKeyType="next"
          />
          <Input
            label="Date of Birth"
            value={dateOfBirth}
            onChangeText={setDateOfBirth}
            placeholder="YYYY-MM-DD"
            autoCapitalize="none"
            returnKeyType="next"
            editable={!isDobLocked}
            style={isDobLocked ? { opacity: 0.5 } : undefined}
          />

          <CountryPicker
            label="Country"
            value={countryName}
            onSelect={(country) => {
              setCountryCode(country.code);
              setCountryName(country.name);
            }}
          />

          <Input
            label="Street Address"
            value={street}
            onChangeText={setStreet}
            placeholder="123 Main St"
            autoCapitalize="words"
            returnKeyType="next"
          />
          <Input
            label="City"
            value={city}
            onChangeText={setCity}
            placeholder="City"
            autoCapitalize="words"
            returnKeyType="next"
          />
          <Input
            label="State / Province"
            value={state}
            onChangeText={setState}
            placeholder="State or province"
            autoCapitalize="words"
            returnKeyType="next"
          />
          <Input
            label="Postal Code"
            value={postalCode}
            onChangeText={setPostalCode}
            placeholder="Postal code"
            autoCapitalize="characters"
            returnKeyType="done"
            onSubmitEditing={handleSave}
          />

          <View>
            <Text className="mb-1.5 font-caption text-caption text-text-secondary">
              Email {isEmailLocked && '(locked)'}
            </Text>
            <View className="rounded-xl border border-surface bg-surface px-4 py-4">
              <Text className="font-body text-body text-text-secondary">{user?.email}</Text>
            </View>
          </View>
        </View>

        <View className="mt-8 px-md">
          <Button
            title={isPending ? '' : 'Save Changes'}
            variant="black"
            onPress={handleSave}
            disabled={!isDirty || isPending}>
            {isPending && <ActivityIndicator color="#fff" size="small" />}
          </Button>
        </View>
      </ScrollView>
    </View>
  );
}
