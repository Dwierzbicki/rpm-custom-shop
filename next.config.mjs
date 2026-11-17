// Keep the shop under / and proxy Road Assistance under /autopomoc.
// The destination retains the prefix so FastAPI can generate correct links,
// CSS, cookies and API URLs without affecting its original onrender.com host.
const roadOrigin = 'https://rpm-custom-road-assistance.onrender.com';

/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return {
      beforeFiles: [
        { source: '/autopomoc', destination: roadOrigin + '/autopomoc' },
        { source: '/autopomoc/:path*', destination: roadOrigin + '/autopomoc/:path*' },
      ],
    };
  },
};

export default nextConfig;
