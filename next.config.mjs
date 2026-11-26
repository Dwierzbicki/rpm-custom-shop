// Keep the shop under / and proxy Road Assistance under /autopomoc.
// The destination retains the prefix so FastAPI can generate correct links,
// CSS, cookies and API URLs without affecting its original onrender.com host.
const roadOrigin = 'https://rpm-custom-road-assistance.onrender.com';

// An independent Next.js service is exposed under the shop's own domain.
// ITB must be built with NEXT_PUBLIC_ITB_BASE_PATH=/itb-designer.
// Until a verified service origin is configured, the public route is not enabled.
const itbOrigin = process.env.ITB_DESIGNER_ORIGIN?.trim().replace(/\/$/, '');

/** @type {import('next').NextConfig} */
const deploymentId = process.env.NEXT_DEPLOYMENT_ID || process.env.RENDER_GIT_COMMIT;
const nextConfig = {
  ...(deploymentId ? { deploymentId } : {}),
  async rewrites() {
    return {
      beforeFiles: [
        { source: '/autopomoc', destination: roadOrigin + '/autopomoc' },
        { source: '/autopomoc/:path*', destination: roadOrigin + '/autopomoc/:path*' },
        ...(itbOrigin ? [
          { source: '/itb-designer', destination: itbOrigin + '/itb-designer' },
          { source: '/itb-designer/:path*', destination: itbOrigin + '/itb-designer/:path*' },
        ] : []),
      ],
    };
  },
};

export default nextConfig;
