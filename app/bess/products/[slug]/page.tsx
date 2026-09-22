import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import bessDataRaw from '@/data/BESS-Home-data.json'
import BESSDetailClient from './page-client'

const bessData = Array.isArray(bessDataRaw) ? bessDataRaw : (bessDataRaw as any).default || []

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

interface PageProps {
  params: Promise<{
    slug: string
  }>
}

export async function generateStaticParams() {
  return bessData.map((item: any) => ({
    slug: slugify(item.name),
  }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const product = bessData.find((item: any) => slugify(item.name) === slug)

  if (!product) {
    return { title: 'Product not found, battery.mom' }
  }

  const title = `${product.name}, battery.mom`
  const description = `${product.name} specs: ${product.capacityKwh} kWh capacity, ${product.roundTripEfficiency}% efficiency, ${product.warrantyYears}-year warranty. ${product.manufacturer} home battery storage system with pricing across Southeast Asia.`

  return {
    title,
    description,
    alternates: { canonical: `/bess/products/${slug}` },
    openGraph: {
      title,
      description,
      type: 'website',
    },
  }
}

export default async function BESSProductPage({ params }: PageProps) {
  const { slug } = await params
  const product = bessData.find((item: any) => slugify(item.name) === slug)

  if (!product) {
    notFound()
  }

  return <BESSDetailClient product={product} slug={slug} />
}
