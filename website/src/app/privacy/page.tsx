import type { Metadata } from 'next'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'

export const metadata: Metadata = {
  title: 'Datenschutz',
  description: 'Datenschutzerklärung von Arctis — wie wir mit deinen Daten umgehen.',
  openGraph: {
    title: 'Datenschutz — Arctis',
    description: 'Datenschutzerklärung von Arctis.',
    url: 'https://arctis.trade/privacy',
    type: 'website',
  },
}

export default function PrivacyPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-24 pb-16">
        <div className="mx-auto max-w-3xl px-6">
          <div className="mb-12">
            <p className="mb-3 text-sm font-medium uppercase tracking-[0.15em] text-ice">
              Legal
            </p>
            <h1 className="font-display text-4xl font-bold text-frost-white sm:text-5xl">
              Datenschutz
            </h1>
            <p className="mt-4 text-lg text-frost-secondary">
              Stand: April 2026
            </p>
          </div>

          <div className="article-prose">
            <h2>1. Datenschutz auf einen Blick</h2>
            <p>
              Der Schutz deiner persönlichen Daten ist uns wichtig. Nachfolgend informieren wir dich darüber, welche Daten wir erheben, warum wir sie brauchen und welche Rechte du hast.
            </p>

            <h2>2. Verantwortliche Stelle</h2>
            <p>
              Verantwortlich für die Datenverarbeitung auf dieser Website ist:<br />
              Arctis<br />
              Musterstraße 1<br />
              10115 Berlin<br />
              E-Mail: support@arctis.app
            </p>

            <h2>3. Welche Daten wir erheben</h2>

            <h3>3.1 Beim Besuch der Website</h3>
            <p>
              Beim Besuch unserer Website werden automatisch technische Daten erfasst (Server-Logs). Dazu gehören:
            </p>
            <ul>
              <li>IP-Adresse (anonymisiert)</li>
              <li>Browsertyp und -version</li>
              <li>Betriebssystem</li>
              <li>Referrer URL</li>
              <li>Zeitpunkt des Zugriffs</li>
            </ul>
            <p>
              Diese Daten werden nicht mit anderen Datenquellen zusammengeführt.
            </p>

            <h3>3.2 Bei der Registrierung</h3>
            <p>
              Wenn du ein Konto erstellst, erheben wir:
            </p>
            <ul>
              <li>E-Mail-Adresse</li>
              <li>Passwort (verschlüsselt gespeichert)</li>
              <li>Gewählter Abo-Plan</li>
            </ul>

            <h3>3.3 Bei der Nutzung von Arctis</h3>
            <p>
              Arctis verarbeitet Marktdaten (OHLCV-Daten von ES und NQ Futures) lokal in deinem Browser bzw. auf deinem Gerät. Wir speichern keine Trading-Daten, Chart-Einstellungen oder Analyse-Ergebnisse auf unseren Servern. Deine Daten bleiben bei dir.
            </p>

            <h2>4. Zahlungsdaten</h2>
            <p>
              Zahlungen werden über Stripe abgewickelt. Wir speichern keine Kreditkartendaten. Stripe verarbeitet deine Zahlungsdaten gemäß deren eigener Datenschutzrichtlinie.
            </p>

            <h2>5. Cookies</h2>
            <p>
              Wir verwenden nur technisch notwendige Cookies für die Session-Verwaltung. Es werden keine Tracking-Cookies oder Analyse-Tools von Drittanbietern eingesetzt.
            </p>

            <h2>6. Deine Rechte</h2>
            <p>
              Du hast jederzeit das Recht auf:
            </p>
            <ul>
              <li>Auskunft über deine gespeicherten Daten</li>
              <li>Berichtigung unrichtiger Daten</li>
              <li>Löschung deiner Daten</li>
              <li>Einschränkung der Verarbeitung</li>
              <li>Datenübertragbarkeit</li>
              <li>Widerspruch gegen die Verarbeitung</li>
            </ul>
            <p>
              Wende dich dazu an support@arctis.app.
            </p>

            <h2>7. Datensicherheit</h2>
            <p>
              Wir nutzen SSL/TLS-Verschlüsselung für alle Datenübertragungen. Passwörter werden gehasht gespeichert. Der Zugang zu personenbezogenen Daten ist auf autorisiertes Personal beschränkt.
            </p>

            <h2>8. Änderungen</h2>
            <p>
              Wir behalten uns vor, diese Datenschutzerklärung zu aktualisieren. Die aktuelle Version findest du immer auf dieser Seite.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
