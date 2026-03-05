import React, { useState, useMemo } from 'react';
import { View, Text, Pressable, Modal, FlatList } from 'react-native';
import { Ionicons } from './SafeIonicons';
import { InputField } from './InputField';

interface Subdivision {
  code: string;
  name: string;
}

interface StatePickerProps {
  label?: string;
  placeholder?: string;
  value?: string;
  onSelect: (subdivision: Subdivision) => void;
  error?: string;
  countryCode?: string;
}

const SUBDIVISIONS: Record<string, Subdivision[]> = {
  US: [
    { code: 'AL', name: 'Alabama' },
    { code: 'AK', name: 'Alaska' },
    { code: 'AZ', name: 'Arizona' },
    { code: 'AR', name: 'Arkansas' },
    { code: 'CA', name: 'California' },
    { code: 'CO', name: 'Colorado' },
    { code: 'CT', name: 'Connecticut' },
    { code: 'DE', name: 'Delaware' },
    { code: 'FL', name: 'Florida' },
    { code: 'GA', name: 'Georgia' },
    { code: 'HI', name: 'Hawaii' },
    { code: 'ID', name: 'Idaho' },
    { code: 'IL', name: 'Illinois' },
    { code: 'IN', name: 'Indiana' },
    { code: 'IA', name: 'Iowa' },
    { code: 'KS', name: 'Kansas' },
    { code: 'KY', name: 'Kentucky' },
    { code: 'LA', name: 'Louisiana' },
    { code: 'ME', name: 'Maine' },
    { code: 'MD', name: 'Maryland' },
    { code: 'MA', name: 'Massachusetts' },
    { code: 'MI', name: 'Michigan' },
    { code: 'MN', name: 'Minnesota' },
    { code: 'MS', name: 'Mississippi' },
    { code: 'MO', name: 'Missouri' },
    { code: 'MT', name: 'Montana' },
    { code: 'NE', name: 'Nebraska' },
    { code: 'NV', name: 'Nevada' },
    { code: 'NH', name: 'New Hampshire' },
    { code: 'NJ', name: 'New Jersey' },
    { code: 'NM', name: 'New Mexico' },
    { code: 'NY', name: 'New York' },
    { code: 'NC', name: 'North Carolina' },
    { code: 'ND', name: 'North Dakota' },
    { code: 'OH', name: 'Ohio' },
    { code: 'OK', name: 'Oklahoma' },
    { code: 'OR', name: 'Oregon' },
    { code: 'PA', name: 'Pennsylvania' },
    { code: 'RI', name: 'Rhode Island' },
    { code: 'SC', name: 'South Carolina' },
    { code: 'SD', name: 'South Dakota' },
    { code: 'TN', name: 'Tennessee' },
    { code: 'TX', name: 'Texas' },
    { code: 'UT', name: 'Utah' },
    { code: 'VT', name: 'Vermont' },
    { code: 'VA', name: 'Virginia' },
    { code: 'WA', name: 'Washington' },
    { code: 'WV', name: 'West Virginia' },
    { code: 'WI', name: 'Wisconsin' },
    { code: 'WY', name: 'Wyoming' },
    { code: 'DC', name: 'District of Columbia' },
  ],
  CA: [
    { code: 'AB', name: 'Alberta' },
    { code: 'BC', name: 'British Columbia' },
    { code: 'MB', name: 'Manitoba' },
    { code: 'NB', name: 'New Brunswick' },
    { code: 'NL', name: 'Newfoundland and Labrador' },
    { code: 'NS', name: 'Nova Scotia' },
    { code: 'NT', name: 'Northwest Territories' },
    { code: 'NU', name: 'Nunavut' },
    { code: 'ON', name: 'Ontario' },
    { code: 'PE', name: 'Prince Edward Island' },
    { code: 'QC', name: 'Quebec' },
    { code: 'SK', name: 'Saskatchewan' },
    { code: 'YT', name: 'Yukon' },
  ],
  AU: [
    { code: 'ACT', name: 'Australian Capital Territory' },
    { code: 'NSW', name: 'New South Wales' },
    { code: 'NT', name: 'Northern Territory' },
    { code: 'QLD', name: 'Queensland' },
    { code: 'SA', name: 'South Australia' },
    { code: 'TAS', name: 'Tasmania' },
    { code: 'VIC', name: 'Victoria' },
    { code: 'WA', name: 'Western Australia' },
  ],
  GB: [
    { code: 'ENG', name: 'England' },
    { code: 'SCT', name: 'Scotland' },
    { code: 'WLS', name: 'Wales' },
    { code: 'NIR', name: 'Northern Ireland' },
  ],
  DE: [
    { code: 'BW', name: 'Baden-Württemberg' },
    { code: 'BY', name: 'Bavaria' },
    { code: 'BE', name: 'Berlin' },
    { code: 'BB', name: 'Brandenburg' },
    { code: 'HB', name: 'Bremen' },
    { code: 'HH', name: 'Hamburg' },
    { code: 'HE', name: 'Hesse' },
    { code: 'MV', name: 'Mecklenburg-Vorpommern' },
    { code: 'NI', name: 'Lower Saxony' },
    { code: 'NW', name: 'North Rhine-Westphalia' },
    { code: 'RP', name: 'Rhineland-Palatinate' },
    { code: 'SL', name: 'Saarland' },
    { code: 'SN', name: 'Saxony' },
    { code: 'ST', name: 'Saxony-Anhalt' },
    { code: 'SH', name: 'Schleswig-Holstein' },
    { code: 'TH', name: 'Thuringia' },
  ],
  MX: [
    { code: 'AGU', name: 'Aguascalientes' },
    { code: 'BCN', name: 'Baja California' },
    { code: 'BCS', name: 'Baja California Sur' },
    { code: 'CAM', name: 'Campeche' },
    { code: 'CHP', name: 'Chiapas' },
    { code: 'CHH', name: 'Chihuahua' },
    { code: 'CMX', name: 'Mexico City' },
    { code: 'COA', name: 'Coahuila' },
    { code: 'COL', name: 'Colima' },
    { code: 'DUR', name: 'Durango' },
    { code: 'GUA', name: 'Guanajuato' },
    { code: 'GRO', name: 'Guerrero' },
    { code: 'HID', name: 'Hidalgo' },
    { code: 'JAL', name: 'Jalisco' },
    { code: 'MEX', name: 'México' },
    { code: 'MIC', name: 'Michoacán' },
    { code: 'MOR', name: 'Morelos' },
    { code: 'NAY', name: 'Nayarit' },
    { code: 'NLE', name: 'Nuevo León' },
    { code: 'OAX', name: 'Oaxaca' },
    { code: 'PUE', name: 'Puebla' },
    { code: 'QUE', name: 'Querétaro' },
    { code: 'ROO', name: 'Quintana Roo' },
    { code: 'SLP', name: 'San Luis Potosí' },
    { code: 'SIN', name: 'Sinaloa' },
    { code: 'SON', name: 'Sonora' },
    { code: 'TAB', name: 'Tabasco' },
    { code: 'TAM', name: 'Tamaulipas' },
    { code: 'TLA', name: 'Tlaxcala' },
    { code: 'VER', name: 'Veracruz' },
    { code: 'YUC', name: 'Yucatán' },
    { code: 'ZAC', name: 'Zacatecas' },
  ],
  BR: [
    { code: 'AC', name: 'Acre' },
    { code: 'AL', name: 'Alagoas' },
    { code: 'AP', name: 'Amapá' },
    { code: 'AM', name: 'Amazonas' },
    { code: 'BA', name: 'Bahia' },
    { code: 'CE', name: 'Ceará' },
    { code: 'DF', name: 'Distrito Federal' },
    { code: 'ES', name: 'Espírito Santo' },
    { code: 'GO', name: 'Goiás' },
    { code: 'MA', name: 'Maranhão' },
    { code: 'MT', name: 'Mato Grosso' },
    { code: 'MS', name: 'Mato Grosso do Sul' },
    { code: 'MG', name: 'Minas Gerais' },
    { code: 'PA', name: 'Pará' },
    { code: 'PB', name: 'Paraíba' },
    { code: 'PR', name: 'Paraná' },
    { code: 'PE', name: 'Pernambuco' },
    { code: 'PI', name: 'Piauí' },
    { code: 'RJ', name: 'Rio de Janeiro' },
    { code: 'RN', name: 'Rio Grande do Norte' },
    { code: 'RS', name: 'Rio Grande do Sul' },
    { code: 'RO', name: 'Rondônia' },
    { code: 'RR', name: 'Roraima' },
    { code: 'SC', name: 'Santa Catarina' },
    { code: 'SP', name: 'São Paulo' },
    { code: 'SE', name: 'Sergipe' },
    { code: 'TO', name: 'Tocantins' },
  ],
  IN: [
    { code: 'AN', name: 'Andaman and Nicobar Islands' },
    { code: 'AP', name: 'Andhra Pradesh' },
    { code: 'AR', name: 'Arunachal Pradesh' },
    { code: 'AS', name: 'Assam' },
    { code: 'BR', name: 'Bihar' },
    { code: 'CH', name: 'Chandigarh' },
    { code: 'CT', name: 'Chhattisgarh' },
    { code: 'DL', name: 'Delhi' },
    { code: 'GA', name: 'Goa' },
    { code: 'GJ', name: 'Gujarat' },
    { code: 'HR', name: 'Haryana' },
    { code: 'HP', name: 'Himachal Pradesh' },
    { code: 'JK', name: 'Jammu and Kashmir' },
    { code: 'JH', name: 'Jharkhand' },
    { code: 'KA', name: 'Karnataka' },
    { code: 'KL', name: 'Kerala' },
    { code: 'MP', name: 'Madhya Pradesh' },
    { code: 'MH', name: 'Maharashtra' },
    { code: 'MN', name: 'Manipur' },
    { code: 'ML', name: 'Meghalaya' },
    { code: 'MZ', name: 'Mizoram' },
    { code: 'NL', name: 'Nagaland' },
    { code: 'OR', name: 'Odisha' },
    { code: 'PB', name: 'Punjab' },
    { code: 'RJ', name: 'Rajasthan' },
    { code: 'SK', name: 'Sikkim' },
    { code: 'TN', name: 'Tamil Nadu' },
    { code: 'TG', name: 'Telangana' },
    { code: 'TR', name: 'Tripura' },
    { code: 'UP', name: 'Uttar Pradesh' },
    { code: 'UT', name: 'Uttarakhand' },
    { code: 'WB', name: 'West Bengal' },
  ],
  NG: [
    { code: 'AB', name: 'Abia' },
    { code: 'AD', name: 'Adamawa' },
    { code: 'AK', name: 'Akwa Ibom' },
    { code: 'AN', name: 'Anambra' },
    { code: 'BA', name: 'Bauchi' },
    { code: 'BY', name: 'Bayelsa' },
    { code: 'BE', name: 'Benue' },
    { code: 'BO', name: 'Borno' },
    { code: 'CR', name: 'Cross River' },
    { code: 'DE', name: 'Delta' },
    { code: 'EB', name: 'Ebonyi' },
    { code: 'ED', name: 'Edo' },
    { code: 'EK', name: 'Ekiti' },
    { code: 'EN', name: 'Enugu' },
    { code: 'FC', name: 'Federal Capital Territory' },
    { code: 'GO', name: 'Gombe' },
    { code: 'IM', name: 'Imo' },
    { code: 'JI', name: 'Jigawa' },
    { code: 'KD', name: 'Kaduna' },
    { code: 'KN', name: 'Kano' },
    { code: 'KT', name: 'Katsina' },
    { code: 'KE', name: 'Kebbi' },
    { code: 'KO', name: 'Kogi' },
    { code: 'KW', name: 'Kwara' },
    { code: 'LA', name: 'Lagos' },
    { code: 'NA', name: 'Nasarawa' },
    { code: 'NI', name: 'Niger' },
    { code: 'OG', name: 'Ogun' },
    { code: 'ON', name: 'Ondo' },
    { code: 'OS', name: 'Osun' },
    { code: 'OY', name: 'Oyo' },
    { code: 'PL', name: 'Plateau' },
    { code: 'RI', name: 'Rivers' },
    { code: 'SO', name: 'Sokoto' },
    { code: 'TA', name: 'Taraba' },
    { code: 'YO', name: 'Yobe' },
    { code: 'ZA', name: 'Zamfara' },
  ],
  ZA: [
    { code: 'EC', name: 'Eastern Cape' },
    { code: 'FS', name: 'Free State' },
    { code: 'GP', name: 'Gauteng' },
    { code: 'KZN', name: 'KwaZulu-Natal' },
    { code: 'LP', name: 'Limpopo' },
    { code: 'MP', name: 'Mpumalanga' },
    { code: 'NC', name: 'Northern Cape' },
    { code: 'NW', name: 'North West' },
    { code: 'WC', name: 'Western Cape' },
  ],
  KE: [
    { code: 'BAR', name: 'Baringo' },
    { code: 'BMT', name: 'Bomet' },
    { code: 'BGM', name: 'Bungoma' },
    { code: 'BSA', name: 'Busia' },
    { code: 'EGM', name: 'Elgeyo-Marakwet' },
    { code: 'EMB', name: 'Embu' },
    { code: 'GSA', name: 'Garissa' },
    { code: 'HOM', name: 'Homa Bay' },
    { code: 'ISL', name: 'Isiolo' },
    { code: 'KAJ', name: 'Kajiado' },
    { code: 'KAK', name: 'Kakamega' },
    { code: 'KCO', name: 'Kericho' },
    { code: 'KBU', name: 'Kiambu' },
    { code: 'KLF', name: 'Kilifi' },
    { code: 'KIR', name: 'Kirinyaga' },
    { code: 'KIS', name: 'Kisii' },
    { code: 'KSM', name: 'Kisumu' },
    { code: 'KTU', name: 'Kitui' },
    { code: 'KLE', name: 'Kwale' },
    { code: 'LKP', name: 'Laikipia' },
    { code: 'LAM', name: 'Lamu' },
    { code: 'MCS', name: 'Machakos' },
    { code: 'MKN', name: 'Makueni' },
    { code: 'MND', name: 'Mandera' },
    { code: 'MAR', name: 'Marsabit' },
    { code: 'MRU', name: 'Meru' },
    { code: 'MIG', name: 'Migori' },
    { code: 'MBA', name: 'Mombasa' },
    { code: 'MRA', name: 'Muranga' },
    { code: 'NBO', name: 'Nairobi' },
    { code: 'NKU', name: 'Nakuru' },
    { code: 'NDI', name: 'Nandi' },
    { code: 'NRK', name: 'Narok' },
    { code: 'NYI', name: 'Nyamira' },
    { code: 'NDR', name: 'Nyandarua' },
    { code: 'NRI', name: 'Nyeri' },
    { code: 'SMB', name: 'Samburu' },
    { code: 'SYA', name: 'Siaya' },
    { code: 'TVT', name: 'Taita-Taveta' },
    { code: 'TAN', name: 'Tana River' },
    { code: 'TNT', name: 'Tharaka-Nithi' },
    { code: 'TRN', name: 'Trans-Nzoia' },
    { code: 'TUR', name: 'Turkana' },
    { code: 'USG', name: 'Uasin Gishu' },
    { code: 'VHG', name: 'Vihiga' },
    { code: 'WJR', name: 'Wajir' },
    { code: 'PKT', name: 'West Pokot' },
  ],
};

// Labels for different countries
const SUBDIVISION_LABELS: Record<string, string> = {
  US: 'State',
  CA: 'Province',
  AU: 'State/Territory',
  GB: 'Region',
  DE: 'State',
  MX: 'State',
  BR: 'State',
  IN: 'State',
  NG: 'State',
  ZA: 'Province',
  KE: 'County',
};

export function StatePicker({
  label,
  placeholder,
  value,
  onSelect,
  error,
  countryCode = 'US',
}: StatePickerProps) {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const hasError = !!error;

  const subdivisions = SUBDIVISIONS[countryCode] || [];
  const hasSubdivisions = subdivisions.length > 0;
  const subdivisionLabel = label || SUBDIVISION_LABELS[countryCode] || 'State/Province';
  const placeholderText = placeholder || `Select ${subdivisionLabel.toLowerCase()}`;

  const selectedSubdivision = useMemo(
    () => subdivisions.find((s) => s.code === value || s.name === value),
    [subdivisions, value]
  );

  const filteredSubdivisions = useMemo(
    () =>
      subdivisions.filter(
        (s) =>
          s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.code.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    [subdivisions, searchQuery]
  );

  const handleSelect = (subdivision: Subdivision) => {
    onSelect(subdivision);
    setIsModalVisible(false);
    setSearchQuery('');
  };

  const renderItem = ({ item }: { item: Subdivision }) => (
    <Pressable
      onPress={() => handleSelect(item)}
      className="flex-row items-center justify-between border-b border-black/5 px-5 py-4">
      <Text className="font-body text-body text-text-primary">{item.name}</Text>
      <Text className="font-body text-body text-text-secondary">{item.code}</Text>
    </Pressable>
  );

  // If country doesn't have predefined subdivisions, don't render (parent should use text input)
  if (!hasSubdivisions) return null;

  return (
    <View>
      {subdivisionLabel && (
        <Text className="mb-1 font-subtitle text-body text-text-primary">{subdivisionLabel}</Text>
      )}
      <Pressable
        onPress={() => setIsModalVisible(true)}
        className={`h-[56px] flex-row items-center justify-between rounded-xl border px-4 ${
          hasError ? 'border-destructive' : isModalVisible ? 'border-black/20' : 'border-[#D4D4D8]'
        } bg-white`}>
        <Text
          className={`font-body text-body ${selectedSubdivision ? 'text-text-primary' : 'text-text-secondary'}`}>
          {selectedSubdivision ? selectedSubdivision.name : placeholderText}
        </Text>
        <Ionicons name="chevron-down" size={20} color="#71717A" />
      </Pressable>
      {hasError && <Text className="mt-1 font-body text-sm text-destructive">{error}</Text>}

      <Modal visible={isModalVisible} animationType="slide" presentationStyle="pageSheet">
        <View className="flex-1 bg-white pt-2">
          <View className="flex-row items-center justify-between border-b border-black/10 px-4 pb-3">
            <Text className="font-headline-3 text-xl text-text-primary">
              Select {subdivisionLabel}
            </Text>
            <Pressable onPress={() => setIsModalVisible(false)} className="p-2">
              <Ionicons name="close" size={24} color="#111827" />
            </Pressable>
          </View>
          <View className="px-4 py-3">
            <InputField
              placeholder={`Search ${subdivisionLabel.toLowerCase()}...`}
              value={searchQuery}
              onChangeText={setSearchQuery}
              icon="search"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
          <FlatList
            data={filteredSubdivisions}
            keyExtractor={(item) => item.code}
            renderItem={renderItem}
            showsVerticalScrollIndicator={false}
          />
        </View>
      </Modal>
    </View>
  );
}

// Export helper to check if a country has predefined subdivisions
export function hasSubdivisions(countryCode: string): boolean {
  return (SUBDIVISIONS[countryCode]?.length || 0) > 0;
}

// Export helper to get subdivision label for a country
export function getSubdivisionLabel(countryCode: string): string {
  return SUBDIVISION_LABELS[countryCode] || 'State/Province';
}
