import type { Metadata } from 'next'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'

export const metadata: Metadata = {
  title: 'Nutzungsbedingungen',
  description: 'Allgemeine Nutzungsbedingungen für die Arctis Trading-Analyse-Plattform.',
  openGraph: {
    title: 'Nutzungsbedingungen — Arctis',
    description: 'AGB und Nutzungsbedingungen für Arctis.',
    url: 'https://arctis.trade/terms',
    type: 'website',
  },
}

export default function TermsPage() {
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
              Nutzungsbedingungen
            </h1>
            <p className="mt-4 text-lg text-frost-secondary">
              Stand: April 2026
            </p>
          </div>

          <div className="article-prose">
            <h2>1. Geltungsbereich</h2>
            <p>
              Diese Nutzungsbedingungen gelten für die Nutzung der Arctis-Plattform (im Folgenden &quot;Dienst&quot;), einer webbasierten Trading-Analyse-Software für Futures-Märkte. Mit der Registrierung akzeptierst du diese Bedingungen.
            </p>

            <h2>2. Leistungsbeschreibung</h2>
            <p>
              Arctis bietet Echtzeit-Marktanalyse für ES (S&P 500 E-mini) und NQ (Nasdaq 100 E-mini) Futures. Der Dienst umfasst:
            </p>
            <ul>
              <li>Candlestick-Charts mit Overlays (VWAP, EMA, Volumenprofil)</li>
              <li>BIAS-Scoring und Confluence-Analyse</li>
              <li>Automatische Setup-Erkennung mit Entry, Stop und Target</li>
              <li>Replay-Modus für historische Sessions</li>
              <li>Risiko-Management-Tools</li>
            </ul>

            <h2>3. Kein Anlageberatung</h2>
            <p>
              <strong>Arctis ist ausdrücklich keine Anlageberatung.</strong> Alle bereitgestellten Analysen, Scores, Setups und Signale dienen ausschließlich zu Informationszwecken. Sie stellen keine Empfehlung zum Kauf oder Verkauf von Finanzinstrumenten dar.
            </p>
            <p>
              Der Handel mit Futures ist mit erheblichen Risiken verbunden und kann zum vollständigen Verlust des eingesetzten Kapitals führen. Du bist allein verantwortlich für deine Handelsentscheidungen.
            </p>

            <h2>4. Abo und Zahlung</h2>

            <h3>4.1 Laufzeit</h3>
            <p>
              Pro-Abonnements laufen monatlich oder jährlich, je nach gewähltem Plan. Die Laufzeit verlängert sich automatisch, sofern nicht vor Ablauf gekündigt wird.
            </p>

            <h3>4.2 Preise</h3>
            <p>
              Die aktuellen Preise findest du auf unserer Pricing-Seite. Alle Preise verstehen sich inklusive der gesetzlichen Mehrwertsteuer.
            </p>

            <h3>4.3 Kündigung</h3>
            <p>
              Du kannst dein Abo jederzeit zum Ende der aktuellen Laufzeit kündigen. Nach Kündigung behältst du Zugang bis zum Ende der bezahlten Periode.
            </p>

            <h2>5. Verfügbarkeit</h2>
            <p>
              Wir bemühen uns um eine hohe Verfügbarkeit des Dienstes, können aber keine 100%ige Verfügbarkeit garantieren. Wartungsarbeiten werden, soweit möglich, außerhalb der US-Handelszeiten durchgeführt.
            </p>

            <h2>6. Datenfeed</h2>
            <p>
              Arctis bezieht Echtzeit-Marktdaten über Rithmic. Für den Zugang benötigst du einen Rithmic-kompatiblen Broker. Die Qualität und Verfügbarkeit der Daten liegt außerhalb unserer Kontrolle.
            </p>

            <h2>7. Nutzungsregeln</h2>
            <p>
              Du verpflichtest dich:
            </p>
            <ul>
              <li>Den Dienst nur für persönliche, nicht-kommerzielle Zwecke zu nutzen (außer Enterprise-Plan)</li>
              <li>Deine Zugangsdaten nicht an Dritte weiterzugeben</li>
              <li>Den Dienst nicht zu reverse-engineeren oder zu kopieren</li>
              <li>Keine Inhalte aus Arctis ohne Genehmigung zu verbreiten</li>
            </ul>

            <h2>8. Haftungsbeschränkung</h2>
            <p>
              Arctis haftet nicht für:
            </p>
            <ul>
              <li>Verluste aus Trading-Entscheidungen, die auf Grundlage unserer Analysen getroffen werden</li>
              <li>Fehlerhafte oder verzögerte Marktdaten</li>
              <li>Ausfälle des Dienstes durch höhere Gewalt</li>
              <li>Schäden durch Nutzung oder Nichtnutzung der bereitgestellten Informationen</li>
            </ul>

            <h2>9. Änderungen der AGB</h2>
            <p>
              Wir behalten uns vor, diese Nutzungsbedingungen zu ändern. Wesentliche Änderungen werden dir per E-Mail mitgeteilt. Die weitere Nutzung des Dienstes nach Änderung gilt als Zustimmung.
            </p>

            <h2>10. Anwendbares Recht</h2>
            <p>
              Es gilt das Recht der Bundesrepublik Deutschland. Gerichtsstand ist Berlin, sofern gesetzlich zulässig.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
