import { Helmet } from 'react-helmet-async'

const defaults = {
  title: 'GOR TAKUR | Sistem Informasi Reservasi Badminton',
  description: 'Sistem informasi reservasi lapangan badminton GOR TAKUR. Booking online, jadwal transparan, dan harga terjangkau.',
  image: '/og-image.png',
  url: 'https://gortakur.netlify.app',
}

export default function SEO({ title, description }) {
  const pageTitle = title ? `${title} | GOR TAKUR` : defaults.title
  const pageDesc = description || defaults.description

  return (
    <Helmet>
      <title>{pageTitle}</title>
      <meta name="description" content={pageDesc} />
      <meta name="keywords" content="badminton, gor takur, reservasi lapangan, booking badminton, lapangan badminton" />
      <meta name="author" content="GOR TAKUR" />
      <meta name="robots" content="index, follow" />
      <meta name="googlebot" content="index, follow" />
      <meta name="theme-color" content="#1e40af" />

      {/* Open Graph */}
      <meta property="og:type" content="website" />
      <meta property="og:title" content={pageTitle} />
      <meta property="og:description" content={pageDesc} />
      <meta property="og:image" content={defaults.image} />
      <meta property="og:url" content={defaults.url} />
      <meta property="og:site_name" content="GOR TAKUR" />
      <meta property="og:locale" content="id_ID" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={pageTitle} />
      <meta name="twitter:description" content={pageDesc} />
      <meta name="twitter:image" content={defaults.image} />

      {/* JSON-LD Structured Data */}
      <script type="application/ld+json">
        {JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'SportsActivityLocation',
          name: 'GOR TAKUR',
          description: 'Lapangan badminton dengan sistem reservasi online',
          url: defaults.url,
          telephone: '+62-xxx-xxxx-xxxx',
          address: {
            '@type': 'PostalAddress',
            addressLocality: 'Indonesia',
          },
          openingHours: 'Mo-Su 06:00-22:00',
          priceRange: 'Rp5.000 - Rp50.000',
        })}
      </script>

      {/* Canonical */}
      <link rel="canonical" href={defaults.url} />
    </Helmet>
  )
}
