import Image from 'next/image'
import Link from 'next/link'
import Card from '@/components/ui/Card'
import { buttonClassName } from '@/components/ui/Button'
import { getProfile } from '@/lib/auth'

const STEPS = [
  { title: 'Ladda upp', text: 'Fotografera eller ladda upp prisförslaget och vårdplanen från din tandläkare.' },
  { title: 'Automatisk analys', text: 'Varje åtgärd jämförs direkt mot TLV:s referenspriser och vi räknar ut ditt tandvårdsstöd.' },
  { title: 'Tandläkaren granskar', text: 'Sylvia, legitimerad tandläkare, går igenom ditt ärende personligen och svarar skriftligt.' },
  { title: 'Du får ett tydligt svar', text: 'Är priset rimligt? Finns alternativ? Vilka frågor bör du ställa till din klinik?' },
]

const SERVICES = [
  {
    title: 'Prisbedömning',
    text: 'Varje åtgärdskod jämförs mot referenspriset. Du ser vad som ligger över, vad som inte ger ersättning och vad du själv betalar efter högkostnadsskyddet.',
  },
  {
    title: 'Granskning av vårdplan',
    text: 'Är behandlingen motiverad utifrån underlaget? Finns enklare eller mer hållbara alternativ, kan något vänta eller delas upp?',
  },
  {
    title: 'Klinikkoll',
    text: 'Klinikens ekonomiska stabilitet, eventuella IVO-ärenden och vad andra patienter säger — innan du binder dig för en dyr behandling.',
  },
]

export default async function HomePage() {
  const profile = await getProfile()
  const startHref = profile ? (profile.role === 'tandlakare' ? '/granskning' : '/arenden/nytt') : '/auth/registrera'

  return (
    <div className="space-y-14">
      <section className="text-center space-y-5 pt-6">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
          Fått ett dyrt prisförslag från tandläkaren?
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Tandsmart hjälper dig förstå om priset är rimligt, om vårdplanen är den rätta för dig och om
          kliniken går att lita på — granskat av en legitimerad tandläkare.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href={startHref} className={buttonClassName('primary')}>Skapa ett ärende</Link>
          <Link href="/snabbkoll" className={buttonClassName('secondary')}>Gratis snabbkoll av pris</Link>
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {SERVICES.map(s => (
          <Card key={s.title}>
            <h2 className="font-semibold text-lg">{s.title}</h2>
            <p className="text-sm text-gray-600 mt-2">{s.text}</p>
          </Card>
        ))}
      </section>

      <section>
        <h2 className="text-xl font-bold mb-4">Så fungerar det</h2>
        <ol className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {STEPS.map((step, i) => (
            <li key={step.title}>
              <Card className="h-full">
                <p className="text-accent-600 font-bold text-sm">Steg {i + 1}</p>
                <p className="font-semibold mt-1">{step.title}</p>
                <p className="text-sm text-gray-600 mt-1">{step.text}</p>
              </Card>
            </li>
          ))}
        </ol>
      </section>

      <section className="overflow-hidden rounded-2xl border border-accent-200 bg-accent-50 grid grid-cols-1 md:grid-cols-5">
        <div className="md:col-span-3 p-6 sm:p-10 flex flex-col justify-center space-y-5">
          <p className="font-brand font-semibold text-accent-600 uppercase tracking-wider text-sm">Om Sylvia</p>
          <h2 className="font-brand font-bold text-brand-navy text-3xl sm:text-4xl leading-tight">
            En tandläkare på din sida — inte på klinikens.
          </h2>
          <p className="text-lg text-gray-700">
            Bakom varje svar står Sylvia, legitimerad tandläkare. Hon läser ditt prisförslag, din vårdplan och
            ditt underlag personligen och säger rakt ut vad hon tycker — som hon hade gjort till en vän.
          </p>
          <ul className="space-y-2 font-brand font-semibold text-brand-navy">
            {[
              'Varje ärende granskas personligen av en legitimerad tandläkare',
              'Helt oberoende — ingen provision från kliniker, inga behandlingar att sälja',
              'Ett skriftligt svar du kan ta med dig till din klinik',
            ].map(point => (
              <li key={point} className="flex gap-3">
                <span aria-hidden className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent-600 text-white text-sm">✓</span>
                <span>{point}</span>
              </li>
            ))}
          </ul>
          <div className="flex flex-col sm:flex-row gap-3 pt-1">
            <Link href={startHref} className={buttonClassName('primary')}>Låt Sylvia granska ditt förslag</Link>
            <Link href="/snabbkoll" className={buttonClassName('secondary', 'bg-white')}>Gör en gratis snabbkoll</Link>
          </div>
        </div>
        <div className="md:col-span-2 relative min-h-80 md:min-h-full order-first md:order-last">
          <Image src="/sylvia.webp" alt="Sylvia, legitimerad tandläkare" fill priority={false}
            sizes="(min-width: 768px) 40vw, 100vw" className="object-cover object-top" />
        </div>
      </section>
    </div>
  )
}
