import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/content";

// Single-page portfolio — one canonical URL. Add entries here if real routes
// are introduced later.
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: siteUrl,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 1,
    },
  ];
}
