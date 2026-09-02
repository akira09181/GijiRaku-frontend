export interface IssueStatusDefinition {
  readonly issueId: string;
  readonly problemSummary: string;
  readonly governmentResponseSummary: string;
  readonly currentStatus: string;
  readonly statusSummary: string;
  readonly statusUpdatedAt: string;
  readonly statusCheckedAt: string;
  readonly sourceUrl: string;
}

export const ISSUE_STATUSES: readonly IssueStatusDefinition[] = [
  {
    issueId: 'tokyo-app-2026-06-16',
    problemSummary: '必要な支援情報や行政手続へ素早く到達できるかが論点です。',
    governmentResponseSummary: '東京都はライフステージ別配信、ログイン簡素化、デジタル都民証、生成AI案内を進めると答弁しました。',
    currentStatus: '議会で質問・答弁済み',
    statusSummary: '支援情報の配信やログイン簡素化などを進める方針が答弁されました。',
    statusUpdatedAt: '2026-06-16T00:00:00+09:00',
    statusCheckedAt: '2026-08-24T15:03:35+09:00',
    sourceUrl: 'https://www.gikai.metro.tokyo.lg.jp/record/proceedings/2026-2/02-01.html',
  },
  {
    issueId: 'shinjuku-sick-child-care-2026-06-10',
    problemSummary: '病児保育を利用できない事例と、空き状況・予約方法の分かりにくさが論点です。',
    governmentResponseSummary: '新宿区は受入体制の検討と、空き状況や予約に使えるICTツールを研究すると答弁しました。',
    currentStatus: '議会で質問・答弁済み',
    statusSummary: '受入体制とICTツールを検討・研究する方針が答弁されました。新しい対応状況は未確認です。',
    statusUpdatedAt: '2026-06-10T00:00:00+09:00',
    statusCheckedAt: '2026-08-24T15:03:35+09:00',
    sourceUrl: 'https://ssp.kaigiroku.net/tenant/shinjuku/SpMinuteView.html?council_id=3193&schedule_id=2',
  },
  {
    issueId: 'machida-regional-transport-2026-03-26',
    problemSummary: '既存交通だけでは移動が難しい地域の移動手段が論点です。',
    governmentResponseSummary: '公開中の会議録では、地域特性に合う新しい地域交通モデルの考え方が質問されています。',
    currentStatus: '議会で質問済み',
    statusSummary: '地域の実情に合う移動手段について質問されました。新しい対応状況は未確認です。',
    statusUpdatedAt: '2026-03-26T00:00:00+09:00',
    statusCheckedAt: '2026-08-24T15:03:35+09:00',
    sourceUrl: 'https://www.gikai-machida.jp/g07_Shitsumon.asp?KAIGI=174&Sflg=2',
  },
  {
    issueId: 'shinagawa-inclusive-education-2026-02-19',
    problemSummary: '多様な学びを支えながら教員負担を減らす体制が論点です。',
    governmentResponseSummary: '品川区は支援人材の充実と教育DXの活用を進めると答弁しました。',
    currentStatus: '議会で質問・答弁済み',
    statusSummary: '学校支援人材と教育DXを活用する方針が答弁されました。',
    statusUpdatedAt: '2026-02-19T00:00:00+09:00',
    statusCheckedAt: '2026-08-24T15:03:35+09:00',
    sourceUrl: 'https://kaigiroku.city.shinagawa.tokyo.jp/100000?QueryType=New&Template=document&VoiceExpand1=r08-0219_002',
  },
  {
    issueId: 'shibuya-inflation-support-2026-01-16',
    problemSummary: '物価高への一律給付と子育て世帯への重点支援をどう組み合わせるかが論点です。',
    governmentResponseSummary: '渋谷区は全区民への給付と子ども・ひとり親世帯への上乗せを含む補正予算を提案しました。',
    currentStatus: '補正予算を可決',
    statusSummary: '全区民への1人5,000円給付などを含む補正予算が可決されました。',
    statusUpdatedAt: '2026-01-16T00:00:00+09:00',
    statusCheckedAt: '2026-08-24T15:03:35+09:00',
    sourceUrl: 'https://ssp.kaigiroku.net/tenant/shibuya/SpMinuteView.html?council_id=2494&schedule_id=2',
  },
  {
    issueId: 'arakawa-ward-auto-2026-03-17-685-6-267',
    problemSummary: '当初予算の重点分野と、事業の成果をどう公開するかが論点です。',
    governmentResponseSummary: '公開中の会議録では、防災・子育て・福祉・地域活性化などを含む当初予算案が審議されています。',
    currentStatus: '予算案について審議済み',
    statusSummary: '令和8年度一般会計予算案について質疑・討論が行われました。',
    statusUpdatedAt: '2026-03-17T00:00:00+09:00',
    statusCheckedAt: '2026-08-24T15:03:35+09:00',
    sourceUrl: 'https://ssp.kaigiroku.net/tenant/arakawa/SpMinuteView.html?council_id=685&schedule_id=2',
  },
  {
    issueId: 'hachioji-rag-ai-2026-06-11',
    problemSummary: '行政業務で生成AIを使う際の効率・精度・安全性が論点です。',
    governmentResponseSummary: '八王子市は研修と資料の段階的な取り込みでAI活用を定着させる方針を示しました。',
    currentStatus: '議会で質問・答弁済み',
    statusSummary: '2026年度は利用職員50％を目標に、段階的に導入する方針が答弁されました。',
    statusUpdatedAt: '2026-06-11T00:00:00+09:00',
    statusCheckedAt: '2026-08-24T15:03:35+09:00',
    sourceUrl: 'https://www.city.hachioji.tokyo.dbsr.jp/index.php/611167?Template=document&Id=6213',
  },
  {
    issueId: 'nerima-ward-auto-2024-03-15-5227-9-275',
    problemSummary: '高齢者健康事業の対象や支援体制、生活費負担が論点です。',
    governmentResponseSummary: '公開中の会議録では、高齢者対策強化の陳情について賛成討論が行われました。',
    currentStatus: '議会で討論済み',
    statusSummary: '高齢者いきいき健康事業の対象拡大や支援体制強化が議論されました。',
    statusUpdatedAt: '2024-03-15T00:00:00+09:00',
    statusCheckedAt: '2026-09-02T15:00:00+09:00',
    sourceUrl: 'https://ssp.kaigiroku.net/tenant/nerima/SpMinuteView.html?council_id=5227&schedule_id=9',
  },
  {
    issueId: 'nakano-ward-auto-2024-03-06-197-4-196',
    problemSummary: '保育施設の整備や待機児童対策など子育て支援の優先度が論点です。',
    governmentResponseSummary: '公開中の会議録では、中野区の子育て支援について質疑が行われました。',
    currentStatus: '議会で質問・答弁済み',
    statusSummary: '子育て支援策について質問・答弁が行われました。',
    statusUpdatedAt: '2024-03-06T00:00:00+09:00',
    statusCheckedAt: '2026-09-02T15:00:00+09:00',
    sourceUrl: 'https://ssp.kaigiroku.net/tenant/nakano/SpMinuteView.html?council_id=197&schedule_id=4',
  },
  {
    issueId: 'kita-ward-auto-2024-06-07-653-2-8',
    problemSummary: '子ども条例の実効性と、子育て支援・防災対策の一体推進が論点です。',
    governmentResponseSummary: '公開中の会議録では、子育て支援策と防災対策について質問・答弁が行われました。',
    currentStatus: '議会で質問・答弁済み',
    statusSummary: '子育て支援策と防災・安全なまちづくりについて質問されました。',
    statusUpdatedAt: '2024-06-07T00:00:00+09:00',
    statusCheckedAt: '2026-09-02T15:00:00+09:00',
    sourceUrl: 'https://ssp.kaigiroku.net/tenant/kita/SpMinuteView.html?council_id=653&schedule_id=2',
  },
  {
    issueId: 'sumida-ward-auto-2024-06-12-555-2-150',
    problemSummary: '職員確保・育成・定着と、行政サービスの持続可能性が論点です。',
    governmentResponseSummary: '公開中の会議録では、墨田区版総合的人事戦略について質問・答弁が行われました。',
    currentStatus: '議会で質問・答弁済み',
    statusSummary: '職員の人材育成と総合的人事戦略について質問されました。',
    statusUpdatedAt: '2024-06-12T00:00:00+09:00',
    statusCheckedAt: '2026-09-02T15:00:00+09:00',
    sourceUrl: 'https://ssp.kaigiroku.net/tenant/sumida/SpMinuteView.html?council_id=555&schedule_id=2',
  },
  {
    issueId: 'tachikawa-city-auto-2024-02-27-2629-4-62',
    problemSummary: '特別な支援を必要とする児童生徒への計画作成と学校間引き継ぎが論点です。',
    governmentResponseSummary: '立川市は個別の教育支援計画・指導計画の作成状況と保護者意向確認について答弁しました。',
    currentStatus: '議会で質問・答弁済み',
    statusSummary: '個別の教育支援計画と指導計画の作成・引き継ぎについて質問・答弁されました。',
    statusUpdatedAt: '2024-02-27T00:00:00+09:00',
    statusCheckedAt: '2026-09-02T15:00:00+09:00',
    sourceUrl: 'https://ssp.kaigiroku.net/tenant/tachikawa/SpMinuteView.html?council_id=2629&schedule_id=4',
  },
] as const;

const STATUS_BY_ISSUE_ID = new Map(ISSUE_STATUSES.map((status) => [status.issueId, status]));

export function getIssueStatus(issueId: string) {
  return STATUS_BY_ISSUE_ID.get(issueId);
}
