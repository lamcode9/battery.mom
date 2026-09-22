import { ARTICLES } from '@/content/articles'

export async function GET() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://battery.mom'
  const now = new Date().toUTCString()

  const items = ARTICLES.map((article) => {
    const pubDate = new Date(article.publishedAt).toUTCString()
    return `    <item>
      <title><![CDATA[${article.title}]]></title>
      <link>${siteUrl}/insights/${article.slug}</link>
      <guid isPermaLink="true">${siteUrl}/insights/${article.slug}</guid>
      <description><![CDATA[${article.description}]]></description>
      <category>${article.category}</category>
      <pubDate>${pubDate}</pubDate>
      <author>team@battery.mom (${article.author})</author>
    </item>`
  }).join('\n')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>battery.mom, insights</title>
    <link>${siteUrl}/insights</link>
    <description>Data-driven analysis, explainers, and market snapshots on EVs, battery storage, and solar across Southeast Asia.</description>
    <language>en</language>
    <lastBuildDate>${now}</lastBuildDate>
    <atom:link href="${siteUrl}/feed.xml" rel="self" type="application/rss+xml"/>
    <image>
      <url>${siteUrl}/og-image.png</url>
      <title>battery.mom</title>
      <link>${siteUrl}</link>
    </image>
${items}
  </channel>
</rss>`

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  })
}
