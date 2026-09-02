import type { Metadata } from 'next';
import Home from '../../home-page';
import {
  buildIssueOgImageUrl,
  buildIssuePageUrl,
  resolveIssueOgMetaWithCatalog,
} from '../../lib/issueOgMeta';

const DEFAULT_TITLE = 'マチボイス｜議会の一次情報から市民参加をひらく';
const DEFAULT_DESCRIPTION = '議会を知る、原文を確かめる、声を届ける。選挙の日だけで終わらない市民参加を日常へ。';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ issueId: string }>;
}): Promise<Metadata> {
  const { issueId } = await params;
  const meta = await resolveIssueOgMetaWithCatalog(issueId);

  if (!meta) {
    return {
      title: DEFAULT_TITLE,
      description: DEFAULT_DESCRIPTION,
    };
  }

  const pageUrl = buildIssuePageUrl(meta.issueId);
  const imageUrl = buildIssueOgImageUrl(meta.issueId);

  return {
    title: `${meta.title}｜マチボイス`,
    description: meta.description,
    openGraph: {
      title: meta.title,
      description: meta.description,
      type: 'article',
      url: pageUrl,
      siteName: 'マチボイス',
      locale: 'ja_JP',
      images: [{ url: imageUrl, width: 1200, height: 630, alt: meta.title }],
    },
    twitter: {
      card: 'summary_large_image',
      title: meta.title,
      description: meta.description,
      images: [imageUrl],
    },
  };
}

export default function IssuePage() {
  return <Home />;
}
