import { fileURLToPath, URL } from 'node:url'
import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'

// الصفحات العامة فقط (التي يُسمح بأرشفتها) — مصدر واحد للـsitemap و robots
const PUBLIC_PAGES = [
  { path: '/', changefreq: 'weekly', priority: '1.0' },
  { path: '/projects', changefreq: 'weekly', priority: '0.9' },
  { path: '/about', changefreq: 'monthly', priority: '0.7' },
  { path: '/team', changefreq: 'monthly', priority: '0.6' }
]

/**
 * يجعل الدومين مرنًا: يُحقن في index.html (مكان التوكن __SITE_URL__) ويولّد
 * robots.txt و sitemap.xml وقت البناء — كلها من المتغيّر VITE_PUBLIC_URL.
 * تغيير الدومين = ضبط VITE_PUBLIC_URL وإعادة البناء، بلا تعديل أي ملف.
 */
function seoSiteUrl(siteUrl) {
  const robots = `# منصة مسار — إدارة مشاريع التخرج
# نسمح بأرشفة الصفحات العامة فقط، ونمنع لوحات التحكم وصفحات المصادقة

User-agent: *
Allow: /$
Allow: /projects
Allow: /about
Allow: /team

# مناطق خاصة لا تُؤرشَف (لوحات التحكم والمصادقة)
Disallow: /login
Disallow: /reset-password
Disallow: /committee
Disallow: /supervisor
Disallow: /student
Disallow: /super-admin
Disallow: /403

Sitemap: ${siteUrl}/sitemap.xml
`

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${PUBLIC_PAGES.map((p) => `  <url>
    <loc>${siteUrl}${p.path}</loc>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`).join('\n')}
</urlset>
`

  return {
    name: 'seo-site-url',
    transformIndexHtml: (html) => html.replaceAll('__SITE_URL__', siteUrl),
    generateBundle() {
      this.emitFile({ type: 'asset', fileName: 'robots.txt', source: robots })
      this.emitFile({ type: 'asset', fileName: 'sitemap.xml', source: sitemap })
    }
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const siteUrl = (env.VITE_PUBLIC_URL || 'https://masar.slidd.app').replace(/\/+$/, '')

  return {
    // بلا تعليقات HTML في القوالب (كالبناء النهائي): تعليق قبل جذر الصفحة يجعلها Fragment فيعلق انتقال <transition mode="out-in"> عند مغادرتها
    plugins: [vue({ template: { compilerOptions: { comments: false } } }), seoSiteUrl(siteUrl)],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url))
      }
    },
    server: {
      port: 5173,
      open: true
    }
  }
})
