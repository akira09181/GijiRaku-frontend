export interface PublicCommentPortal {
  readonly assemblyId: string;
  readonly municipality: string;
  readonly portalLabel: string;
  readonly portalUrl: string;
  readonly guidance: string;
  readonly deadlineNote?: string;
}

export const PUBLIC_COMMENT_PORTALS: readonly PublicCommentPortal[] = [
  {
    assemblyId: 'tokyo-metropolitan',
    municipality: '東京都',
    portalLabel: '東京都 パブリックコメント',
    portalUrl: 'https://www.metro.tokyo.lg.jp/government/public-comment/index.html',
    guidance: '都政の施策案に対する意見募集ページから、該当テーマの募集を選んで提出してください。',
    deadlineNote: '募集ごとに期限が異なります。ページ内の案内を確認してください。',
  },
  {
    assemblyId: 'shinjuku-ward',
    municipality: '新宿区',
    portalLabel: '新宿区 意見公募',
    portalUrl: 'https://www.city.shinjuku.lg.jp/seisaku/ikenkoubo/index.html',
    guidance: '区の意見公募ページから、該当する募集テーマを選んで意見を送信してください。',
  },
  {
    assemblyId: 'machida-city',
    municipality: '町田市',
    portalLabel: '町田市 パブリックコメント',
    portalUrl: 'https://www.city.machida.tokyo.jp/kurashi/shisetsu/iken/index.html',
    guidance: '市の意見募集ページで、該当するテーマの募集期間内に意見を提出してください。',
  },
  {
    assemblyId: 'shinagawa-ward',
    municipality: '品川区',
    portalLabel: '品川区 意見公募',
    portalUrl: 'https://www.city.shinagawa.tokyo.jp/section/kikaku-annai/opinion/index.html',
    guidance: '区の意見公募ページから、該当する政策テーマの募集を選んでください。',
  },
  {
    assemblyId: 'shibuya-ward',
    municipality: '渋谷区',
    portalLabel: '渋谷区 パブリックコメント',
    portalUrl: 'https://www.city.shibuya.tokyo.jp/smph/seisaku/kikaku/public-comment.html',
    guidance: '区のパブリックコメントページで、該当する募集案内を確認して提出してください。',
  },
  {
    assemblyId: 'arakawa-ward',
    municipality: '荒川区',
    portalLabel: '荒川区 意見募集',
    portalUrl: 'https://www.cityarakawa.lg.jp/kusei/seisaku/ikenkoubo/index.html',
    guidance: '区の意見募集ページから、該当するテーマを選んで意見を送ってください。',
  },
  {
    assemblyId: 'hachioji-city',
    municipality: '八王子市',
    portalLabel: '八王子市 パブリックコメント',
    portalUrl: 'https://www.city.hachioji.tokyo.jp/kurashi/kikaku/publiccomment/index.html',
    guidance: '市のパブリックコメントページで、該当する募集を選んで意見を提出してください。',
  },
  {
    assemblyId: 'nerima-ward',
    municipality: '練馬区',
    portalLabel: '練馬区 パブリックコメント',
    portalUrl: 'https://www.city.nerima.tokyo.jp/kusei/seisaku/publiccomment/index.html',
    guidance: '区のパブリックコメントページから、該当する募集テーマを選んで意見を送信してください。',
  },
  {
    assemblyId: 'nakano-ward',
    municipality: '中野区',
    portalLabel: '中野区 意見公募',
    portalUrl: 'https://www.city.nakano.tokyo.jp/kusei/seisaku/ikenkoubo/index.html',
    guidance: '区の意見公募ページから、該当する政策テーマの募集を選んでください。',
  },
  {
    assemblyId: 'kita-ward',
    municipality: '北区',
    portalLabel: '北区 パブリックコメント',
    portalUrl: 'https://www.city.kita.tokyo.jp/kusei/seisaku/publiccomment/index.html',
    guidance: '区のパブリックコメントページで、該当する募集案内を確認して提出してください。',
  },
  {
    assemblyId: 'sumida-ward',
    municipality: '墨田区',
    portalLabel: '墨田区 意見公募',
    portalUrl: 'https://www.city.sumida.lg.jp/kusei/seisaku/ikenkoubo/index.html',
    guidance: '区の意見公募ページから、該当するテーマを選んで意見を送ってください。',
  },
  {
    assemblyId: 'tachikawa-city',
    municipality: '立川市',
    portalLabel: '立川市 パブリックコメント',
    portalUrl: 'https://www.city.tachikawa.lg.jp/kusei/seisaku/publiccomment/index.html',
    guidance: '市のパブリックコメントページで、該当する募集を選んで意見を提出してください。',
  },
  {
    assemblyId: 'chuo-ward',
    municipality: '中央区',
    portalLabel: '中央区 意見公募',
    portalUrl: 'https://www.city.chuo.lg.jp/kusei/seisaku/publiccomment/index.html',
    guidance: '区の意見公募ページから、該当するテーマを選んで意見を送ってください。',
  },
  {
    assemblyId: 'kodaira-city',
    municipality: '小平市',
    portalLabel: '小平市 パブリックコメント',
    portalUrl: 'https://www.city.kodaira.tokyo.jp/kusei/seisaku/publiccomment/index.html',
    guidance: '市のパブリックコメントページで、該当する募集を選んで意見を提出してください。',
  },
  {
    assemblyId: 'akishima-city',
    municipality: '昭島市',
    portalLabel: '昭島市 パブリックコメント',
    portalUrl: 'https://www.city.akishima.lg.jp/kusei/seisaku/publiccomment/index.html',
    guidance: '市のパブリックコメントページで、該当する募集を選んで意見を提出してください。',
  },
  {
    assemblyId: 'ome-city',
    municipality: '青梅市',
    portalLabel: '青梅市 パブリックコメント',
    portalUrl: 'https://www.city.ome.tokyo.jp/kusei/seisaku/publiccomment/index.html',
    guidance: '市のパブリックコメントページで、該当する募集を選んで意見を提出してください。',
  },
  {
    assemblyId: 'higashiyamato-city',
    municipality: '東大和市',
    portalLabel: '東大和市 パブリックコメント',
    portalUrl: 'https://www.city.higashiyamato.lg.jp/kusei/seisaku/publiccomment/index.html',
    guidance: '市のパブリックコメントページで、該当する募集を選んで意見を提出してください。',
  },
  {
    assemblyId: 'kiyose-city',
    municipality: '清瀬市',
    portalLabel: '清瀬市 パブリックコメント',
    portalUrl: 'https://www.city.kiyose.lg.jp/kusei/seisaku/publiccomment/index.html',
    guidance: '市のパブリックコメントページで、該当する募集を選んで意見を提出してください。',
  },
  {
    assemblyId: 'musashimurayama-city',
    municipality: '武蔵村山市',
    portalLabel: '武蔵村山市 パブリックコメント',
    portalUrl: 'https://www.city.musashimurayama.lg.jp/kusei/seisaku/publiccomment/index.html',
    guidance: '市のパブリックコメントページで、該当する募集を選んで意見を提出してください。',
  },
  {
    assemblyId: 'koto-ward',
    municipality: '江東区',
    portalLabel: '江東区 意見公募',
    portalUrl: 'https://www.city.koto.lg.jp/kusei/seisaku/ikenkoubo/index.html',
    guidance: '区の意見公募ページから、該当するテーマを選んで意見を送ってください。',
  },
  {
    assemblyId: 'musashino-city',
    municipality: '武蔵野市',
    portalLabel: '武蔵野市 パブリックコメント',
    portalUrl: 'https://www.city.musashino.lg.jp/kusei/seisaku/publiccomment/index.html',
    guidance: '市のパブリックコメントページで、該当する募集を選んで意見を提出してください。',
  },
  {
    assemblyId: 'fuchu-city',
    municipality: '府中市',
    portalLabel: '府中市 パブリックコメント',
    portalUrl: 'https://www.city.fuchu.tokyo.jp/kusei/seisaku/publiccomment/index.html',
    guidance: '市のパブリックコメントページで、該当する募集を選んで意見を提出してください。',
  },
  {
    assemblyId: 'mitaka-city',
    municipality: '三鷹市',
    portalLabel: '三鷹市 パブリックコメント',
    portalUrl: 'https://www.city.mitaka.lg.jp/kusei/seisaku/publiccomment/index.html',
    guidance: '市のパブリックコメントページで、該当する募集を選んで意見を提出してください。',
  },
  {
    assemblyId: 'kokubunji-city',
    municipality: '国分寺市',
    portalLabel: '国分寺市 パブリックコメント',
    portalUrl: 'https://www.city.kokubunji.tokyo.jp/kusei/seisaku/publiccomment/index.html',
    guidance: '市のパブリックコメントページで、該当する募集を選んで意見を提出してください。',
  },
] as const;

const PORTAL_BY_ASSEMBLY_ID = new Map(
  PUBLIC_COMMENT_PORTALS.map((portal) => [portal.assemblyId, portal]),
);

export function getPublicCommentPortal(assemblyId: string | undefined) {
  return assemblyId ? PORTAL_BY_ASSEMBLY_ID.get(assemblyId) : undefined;
}

export function buildPublicCommentSubmissionText(params: {
  readonly municipality: string;
  readonly issueTitle: string;
  readonly draftText: string;
}): string {
  const trimmedDraft = params.draftText.trim();
  if (!trimmedDraft) return '';
  return [
    `【${params.municipality} パブリックコメント意見】`,
    `テーマ: ${params.issueTitle}`,
    '',
    trimmedDraft,
  ].join('\n');
}
