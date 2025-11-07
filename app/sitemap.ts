import { MetadataRoute } from 'next'

/**
 * Generates the sitemap for SEO purposes.
 * 
 * @returns The sitemap metadata
 */
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: 'https://insulin-time-action.projects.fittedtech.com',
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 1,
    },
  ]
}

