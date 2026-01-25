
import { MetadataRoute } from 'next';
import { supabase } from '@/lib/supabase';

// Frequency: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never'
const BASE_URL = 'https://zeuz.supply';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {

    // 1. Static Routes
    const staticRoutes = [
        {
            url: BASE_URL,
            lastModified: new Date(),
            changeFrequency: 'daily' as const,
            priority: 1,
        },
    ];

    // 2. Dynamic Product Routes
    const { data: products } = await supabase
        .from('products')
        .select('slug, updated_at');

    const productRoutes = (products || []).map((product) => ({
        url: `${BASE_URL}/products/${product.slug}`,
        lastModified: new Date(product.updated_at || new Date()),
        changeFrequency: 'weekly' as const,
        priority: 0.8,
    }));

    return [...staticRoutes, ...productRoutes];
}
