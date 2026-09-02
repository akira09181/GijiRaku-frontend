import type { Assembly } from '../types/assembly';

interface PlannedMunicipality {
  readonly id: string;
  readonly name: string;
  readonly type: Assembly['type'];
  readonly lat: number;
  readonly lng: number;
}

/** 実データ未接続の東京都内自治体（62市区町村のうち ready 以外） */
const PLANNED_MUNICIPALITIES: readonly PlannedMunicipality[] = [
  // 特別区（19）
  { id: 'chiyoda-ward', name: '千代田区', type: 'ward', lat: 35.694, lng: 139.7536 },
  { id: 'chuo-ward', name: '中央区', type: 'ward', lat: 35.6706, lng: 139.772 },
  { id: 'minato-ward', name: '港区', type: 'ward', lat: 35.6581, lng: 139.7514 },
  { id: 'bunkyo-ward', name: '文京区', type: 'ward', lat: 35.7081, lng: 139.7522 },
  { id: 'taito-ward', name: '台東区', type: 'ward', lat: 35.7126, lng: 139.7802 },
  { id: 'sumida-ward', name: '墨田区', type: 'ward', lat: 35.7107, lng: 139.8015 },
  { id: 'koto-ward', name: '江東区', type: 'ward', lat: 35.6731, lng: 139.817 },
  { id: 'meguro-ward', name: '目黒区', type: 'ward', lat: 35.6414, lng: 139.6982 },
  { id: 'ota-ward', name: '大田区', type: 'ward', lat: 35.5613, lng: 139.7161 },
  { id: 'setagaya-ward', name: '世田谷区', type: 'ward', lat: 35.6464, lng: 139.6532 },
  { id: 'nakano-ward', name: '中野区', type: 'ward', lat: 35.7074, lng: 139.6638 },
  { id: 'suginami-ward', name: '杉並区', type: 'ward', lat: 35.6995, lng: 139.6364 },
  { id: 'toshima-ward', name: '豊島区', type: 'ward', lat: 35.726, lng: 139.7164 },
  { id: 'kita-ward', name: '北区', type: 'ward', lat: 35.7536, lng: 139.7335 },
  { id: 'itabashi-ward', name: '板橋区', type: 'ward', lat: 35.7512, lng: 139.709 },
  { id: 'nerima-ward', name: '練馬区', type: 'ward', lat: 35.7356, lng: 139.6517 },
  { id: 'adachi-ward', name: '足立区', type: 'ward', lat: 35.775, lng: 139.8045 },
  { id: 'katsushika-ward', name: '葛飾区', type: 'ward', lat: 35.7431, lng: 139.8472 },
  { id: 'edogawa-ward', name: '江戸川区', type: 'ward', lat: 35.7064, lng: 139.8687 },
  // 市（24）
  { id: 'tachikawa-city', name: '立川市', type: 'city', lat: 35.7138, lng: 139.4095 },
  { id: 'musashino-city', name: '武蔵野市', type: 'city', lat: 35.7178, lng: 139.5661 },
  { id: 'mitaka-city', name: '三鷹市', type: 'city', lat: 35.6835, lng: 139.5596 },
  { id: 'ome-city', name: '青梅市', type: 'city', lat: 35.7879, lng: 139.2756 },
  { id: 'fuchu-city', name: '府中市', type: 'city', lat: 35.6689, lng: 139.4777 },
  { id: 'akishima-city', name: '昭島市', type: 'city', lat: 35.7058, lng: 139.3539 },
  { id: 'chofu-city', name: '調布市', type: 'city', lat: 35.6517, lng: 139.5405 },
  { id: 'koganei-city', name: '小金井市', type: 'city', lat: 35.6995, lng: 139.5033 },
  { id: 'kodaira-city', name: '小平市', type: 'city', lat: 35.7284, lng: 139.4777 },
  { id: 'hino-city', name: '日野市', type: 'city', lat: 35.6714, lng: 139.3949 },
  { id: 'higashimurayama-city', name: '東村山市', type: 'city', lat: 35.7545, lng: 139.4685 },
  { id: 'kokubunji-city', name: '国分寺市', type: 'city', lat: 35.7103, lng: 139.4622 },
  { id: 'kunitachi-city', name: '国立市', type: 'city', lat: 35.6839, lng: 139.4413 },
  { id: 'fussa-city', name: '福生市', type: 'city', lat: 35.7384, lng: 139.3267 },
  { id: 'komae-city', name: '狛江市', type: 'city', lat: 35.6342, lng: 139.5787 },
  { id: 'higashiyamato-city', name: '東大和市', type: 'city', lat: 35.7454, lng: 139.4266 },
  { id: 'kiyose-city', name: '清瀬市', type: 'city', lat: 35.7854, lng: 139.5268 },
  { id: 'higashikurume-city', name: '東久留米市', type: 'city', lat: 35.758, lng: 139.5299 },
  { id: 'musashimurayama-city', name: '武蔵村山市', type: 'city', lat: 35.754, lng: 139.3874 },
  { id: 'tama-city', name: '多摩市', type: 'city', lat: 35.637, lng: 139.4463 },
  { id: 'inagi-city', name: '稲城市', type: 'city', lat: 35.6379, lng: 139.5046 },
  { id: 'hamura-city', name: '羽村市', type: 'city', lat: 35.7672, lng: 139.311 },
  { id: 'akiruno-city', name: 'あきる野市', type: 'city', lat: 35.7286, lng: 139.2945 },
  { id: 'nishitokyo-city', name: '西東京市', type: 'city', lat: 35.7255, lng: 139.5382 },
  // 西多摩（4）
  { id: 'mizuho-town', name: '瑞穂町', type: 'town', lat: 35.7719, lng: 139.3544 },
  { id: 'hinode-town', name: '日の出町', type: 'town', lat: 35.7424, lng: 139.2589 },
  { id: 'hinohara-village', name: '檜原村', type: 'village', lat: 35.7268, lng: 139.1487 },
  { id: 'okutama-town', name: '奥多摩町', type: 'town', lat: 35.8094, lng: 139.0962 },
  // 島しょ（9）
  { id: 'oshima-town', name: '大島町', type: 'town', lat: 34.7501, lng: 139.3554 },
  { id: 'toshima-village', name: '利島村', type: 'village', lat: 34.5292, lng: 139.2824 },
  { id: 'niijima-village', name: '新島村', type: 'village', lat: 34.3772, lng: 139.2567 },
  { id: 'kozushima-village', name: '神津島村', type: 'village', lat: 34.2055, lng: 139.1348 },
  { id: 'miyake-village', name: '三宅村', type: 'village', lat: 34.0762, lng: 139.5183 },
  { id: 'mikurajima-village', name: '御蔵島村', type: 'village', lat: 33.8751, lng: 139.5936 },
  { id: 'hachijo-town', name: '八丈町', type: 'town', lat: 33.1126, lng: 139.7887 },
  { id: 'aogashima-village', name: '青ヶ島村', type: 'village', lat: 32.4672, lng: 139.7636 },
  { id: 'ogasawara-village', name: '小笠原村', type: 'village', lat: 27.0943, lng: 142.1918 },
];

function assemblyDisplayName(municipality: PlannedMunicipality): string {
  const { name, type } = municipality;
  if (type === 'ward') return name.endsWith('区') ? `${name}議会` : `${name}区議会`;
  if (type === 'city') return name.endsWith('市') ? `${name}議会` : `${name}市議会`;
  if (type === 'town') return name.endsWith('町') ? `${name}議会` : `${name}町議会`;
  if (type === 'village') return name.endsWith('村') ? `${name}議会` : `${name}村議会`;
  return `${name}議会`;
}

function toPlannedAssembly(municipality: PlannedMunicipality): Assembly {
  return {
    id: municipality.id,
    name: assemblyDisplayName(municipality),
    type: municipality.type,
    lat: municipality.lat,
    lng: municipality.lng,
    membersCount: 0,
    mayorName: '—',
    openDataStatus: 'planned',
    totalMinutesCount: 0,
    featuredDiscussionId: `${municipality.id}-planned`,
    hotTopic: '導入リクエスト受付中',
    mainIssues: [],
  };
}

export const TOKYO_PLANNED_ASSEMBLIES: readonly Assembly[] = PLANNED_MUNICIPALITIES.map(toPlannedAssembly);

export function isAssemblyReady(assembly: Assembly): boolean {
  return assembly.openDataStatus === 'ready';
}

export function mergeTokyoAssemblies(readyAssemblies: readonly Assembly[]): readonly Assembly[] {
  const readyIds = new Set(readyAssemblies.map((assembly) => assembly.id));
  const planned = TOKYO_PLANNED_ASSEMBLIES.filter((assembly) => !readyIds.has(assembly.id));
  return [...readyAssemblies, ...planned];
}
