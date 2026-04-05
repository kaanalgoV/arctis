import type { Metadata } from 'next'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'

export const metadata: Metadata = {
  title: 'Impressum',
  description: 'Impressum und Anbieterkennzeichnung von Arctis.',
  openGraph: {
    title: 'Impressum — Arctis',
    description: 'Impressum und Anbieterkennzeichnung von Arctis.',
    url: 'https://arctis.trade/imprint',
    type: 'website',
  },
}

export default function ImprintPage() {
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
              Impressum
            </h1>
          </div>

          <div className="article-prose">
            <h2>Angaben gemäß § 5 TMG</h2>
            <p>
              Arctis<br />
              Musterstraße 1<br />
              10115 Berlin<br />
              Deutschland
            </p>

            <h2>Kontakt</h2>
            <p>
              E-Mail: support@arctis.app
            </p>

            <h2>Verantwortlich für den Inhalt nach § 55 Abs. 2 RStV</h2>
            <p>
              Arctis<br />
              Musterstraße 1<br />
              10115 Berlin
            </p>

            <h2>Haftung für Inhalte</h2>
            <p>
              Als Diensteanbieter sind wir gemäß § 7 Abs.1 TMG für eigene Inhalte auf diesen Seiten nach den allgemeinen Gesetzen verantwortlich. Nach §§ 8 bis 10 TMG sind wir als Diensteanbieter jedoch nicht verpflichtet, übermittelte oder gespeicherte fremde Informationen zu überwachen oder nach Umständen zu forschen, die auf eine rechtswidrige Tätigkeit hinweisen.
            </p>
            <p>
              Verpflichtungen zur Entfernung oder Sperrung der Nutzung von Informationen nach den allgemeinen Gesetzen bleiben hiervon unberührt. Eine diesbezügliche Haftung ist jedoch erst ab dem Zeitpunkt der Kenntnis einer konkreten Rechtsverletzung möglich. Bei Bekanntwerden von entsprechenden Rechtsverletzungen werden wir diese Inhalte umgehend entfernen.
            </p>

            <h2>Haftung für Links</h2>
            <p>
              Unser Angebot enthält Links zu externen Websites Dritter, auf deren Inhalte wir keinen Einfluss haben. Deshalb können wir für diese fremden Inhalte auch keine Gewähr übernehmen. Für die Inhalte der verlinkten Seiten ist stets der jeweilige Anbieter oder Betreiber der Seiten verantwortlich.
            </p>

            <h2>Urheberrecht</h2>
            <p>
              Die durch die Seitenbetreiber erstellten Inhalte und Werke auf diesen Seiten unterliegen dem deutschen Urheberrecht. Die Vervielfältigung, Bearbeitung, Verbreitung und jede Art der Verwertung außerhalb der Grenzen des Urheberrechtes bedürfen der schriftlichen Zustimmung des jeweiligen Autors bzw. Erstellers.
            </p>

            <h2>Risikohinweis</h2>
            <p>
              Arctis ist ein Analyse-Tool und keine Anlageberatung. Der Handel mit Futures und Derivaten ist mit erheblichen Risiken verbunden und kann zum Verlust des eingesetzten Kapitals führen. Vergangene Ergebnisse sind kein Indikator für zukünftige Performance. Handeln Sie nur mit Kapital, dessen Verlust Sie verkraften können.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
