const isGithubPages = process.env.GITHUB_ACTIONS === 'true';

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: isGithubPages ? 'export' : undefined,
  trailingSlash: true,
  basePath: isGithubPages ? '/colebranston.github.io' : '',
  assetPrefix: isGithubPages ? '/colebranston.github.io/' : '',
  images: {
    unoptimized: isGithubPages ? true : false,
    remotePatterns: [
      { protocol: 'https', hostname: 'opengraph.githubassets.com' },
      { protocol: 'https', hostname: 'avatars.githubusercontent.com' },
      { protocol: 'https', hostname: 'raw.githubusercontent.com' },
      { protocol: 'https', hostname: 'github.com' },
    ],
  },
};

export default nextConfig;