
import { MetadataRoute } from 'next';
import { getSupabaseServer } from '@/lib/supabase-server';

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
    let products: any[] = [];
    try {
        const supabase = getSupabaseServer();
        // If build environment lacks keys, getSupabaseServer might throw or return null depending on implementation
        // But we changed it to throw. Let's wrap in try/catch to be safe for sitemap.
        // Actually, for sitemap we WANT products. If we can't get them, sitemap is incomplete.
        // But better incomplete than broken build?
        const { data } = await supabase
            .from('products')
            .select('slug, updated_at');
        products = data || [];
    } catch (e) {
        console.warn('Sitemap generation failed to fetch products (likely missing env vars during build). Skipping dynamic routes.');
    }

    const productRoutes = (products || []).map((product) => ({
        url: `${BASE_URL}/products/${product.slug}`,
        lastModified: new Date(product.updated_at || new Date()),
        changeFrequency: 'weekly' as const,
        priority: 0.8,
    }));

    return [...staticRoutes, ...productRoutes];
}
