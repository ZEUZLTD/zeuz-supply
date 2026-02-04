/** @type {import('next').NextConfig} */
import { execSync } from 'child_process';

const getGitCommit = () => {
    if (process.env.VERCEL_GIT_COMMIT_SHA) return process.env.VERCEL_GIT_COMMIT_SHA;
    try {
        return execSync('git rev-parse --short HEAD').toString().trim();
    } catch {
        // Fallback: Generate a Build ID based on date (e.g., 240123-1405)
        const now = new Date();
        const date = now.toISOString().slice(2, 10).replace(/-/g, '');
        const time = now.toISOString().slice(11, 16).replace(':', '');
        return `${date}-${time}`;
    }
};

const nextConfig = {
    output: 'standalone',
    experimental: {
        optimizePackageImports: ['lucide-react', 'recharts', 'framer-motion', '@react-three/drei'],
        // ppr: true,
    },
    images: {
        formats: ['image/avif', 'image/webp'],
        minimumCacheTTL: 31536000, // 1 Year - aggressive caching
        remotePatterns: [
            {
                protocol: 'https',
                hostname: '**.supabase.co',
            },
        ],
    },
    logging: {
        fetches: {
            fullUrl: true,
        },
    },
    // eslint config removed (deprecated)
    env: {
        NEXT_PUBLIC_DEPLOYMENT_VERSION: getGitCommit(),
    },
};

export default nextConfig;
