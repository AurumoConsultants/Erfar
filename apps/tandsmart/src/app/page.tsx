import Image from 'next/image'
import Link from 'next/link'
import { buttonClassName } from '@/components/ui/Button'
import { getProfile } from '@/lib/auth'
import Icon, { type IconName } from '@/components/Icon'

const STEPS: { title: string; text: string; icon: IconName }[] = [
  { title: 'Ladda upp', text: 'Fotografera eller ladda upp prisförslaget och vårdplanen. Det tar två minuter.', icon: 'upload' },
  { title: 'Direkt prisanalys', text: 'Varje åtgärd jämförs med TLV:s referenspriser och vi räknar ut ditt tandvårdsstöd.', icon: 'chart' },
  { title: 'Sylvia granskar', text: 'En legitimerad tandläkare går igenom ditt ärende personligen — ingen robot.', icon: 'doctor' },
  { title: 'Du får ett klart svar', text: 'Är priset rimligt? Finns bättre alternativ? Vad ska du fråga din klinik?', icon: 'chat' },
]

const SERVICES: { title: string; lead: string; text: string; icon: IconName; cta: string; href?: string }[] = [
  {
    title: 'Prisbedömning',
    lead: 'Betalar du för mycket?',
    text: 'Vi jämför varje åtgärd med referenspriset och visar exakt vad som ligger över, vad som ger ersättning och vad du själv betalar efter högkostnadsskyddet.',
    icon: 'tag',
    cta: 'Gör en gratis snabbkoll',
    href: '/snabbkoll',
  },
  {
    title: 'Granskning av vårdplan',
    lead: 'Är behandlingen rätt för dig?',
    text: 'Sylvia bedömer om behandlingen är motiverad utifrån underlaget — och om det finns enklare, mer hållbara eller billigare alternativ.',
    icon: 'clipboard',
    cta: 'Få vårdplanen granskad',
  },
  {
    title: 'Klinikkoll',
    lead: 'Kan du lita på kliniken?',
    text: 'Ekonomisk stabilitet, eventuella IVO-ärenden och vad andra patienter säger — innan du binder dig för en dyr behandling.',
    icon: 'building',
    cta: 'Kolla din klinik',
  },
]

const TRUST = ['Legitimerad tandläkare', 'Helt oberoende', 'Gratis snabbkoll — utan konto']

export default async function HomePage() {
  const profile = await getProfile()
  const startHref = profile ? (profile.role === 'tandlakare' ? '/granskning' : '/arenden/nytt') : '/auth/registrera'

  return (
    <div className="space-y-16">
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-accent-50 via-white to-accent-100 border border-accent-100 px-6 py-12 sm:px-12 sm:py-16 text-center">
        <div aria-hidden className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-accent-200/40 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-accent-300/30 blur-3xl" />
        <div className="relative space-y-6">
          <p className="inline-flex items-center gap-2 rounded-full bg-white/80 border border-accent-200 px-4 py-1.5 font-brand font-semibold text-sm text-accent-700">
            <Icon name="doctor" className="h-4 w-4" /> Second opinion av legitimerad tandläkare
          </p>
          <h1 className="font-brand font-bold text-brand-navy text-4xl sm:text-5xl lg:text-6xl leading-[1.05] tracking-tight max-w-3xl mx-auto">
            Fått ett <span className="text-accent-600">dyrt</span> prisförslag från tandläkaren?
          </h1>
          <p className="text-lg sm:text-xl text-gray-700 max-w-2xl mx-auto">
            Ta reda på om priset är rimligt, om vårdplanen är rätt för dig och om kliniken går att lita på
            — innan du säger ja.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href={startHref} className={buttonClassName('primary', 'text-base! px-7! min-h-12 shadow-lg shadow-accent-600/20')}>
              Skapa ett ärende
            </Link>
            <Link href="/snabbkoll" className={buttonClassName('secondary', 'text-base! px-7! min-h-12 bg-white')}>
              Gratis snabbkoll av pris
            </Link>
          </div>
          <ul className="flex flex-wrap justify-center gap-x-6 gap-y-2 pt-2 text-sm font-brand font-semibold text-brand-navy">
            {TRUST.map(t => (
              <li key={t} className="flex items-center gap-2">
                <span aria-hidden className="flex h-5 w-5 items-center justify-center rounded-full bg-accent-600 text-white text-xs">✓</span>
                {t}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="space-y-6">
        <div className="text-center space-y-2">
          <p className="font-brand font-semibold text-accent-600 uppercase tracking-wider text-sm">Vad vi hjälper dig med</p>
          <h2 className="font-brand font-bold text-brand-navy text-3xl sm:text-4xl">Tre frågor du bör ställa innan du betalar</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {SERVICES.map(s => (
            <Link key={s.title} href={s.href ?? startHref}
              className="group relative flex flex-col rounded-2xl bg-white border border-gray-200 border-t-4 border-t-accent-500 p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg hover:border-accent-300">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent-100 text-accent-700 transition group-hover:bg-accent-600 group-hover:text-white">
                <Icon name={s.icon} />
              </span>
              <h3 className="font-brand font-bold text-brand-navy text-xl mt-4">{s.title}</h3>
              <p className="font-brand font-semibold text-accent-600 mt-1">{s.lead}</p>
              <p className="text-gray-600 mt-3 flex-1">{s.text}</p>
              <span className="font-brand font-semibold text-accent-700 mt-5 inline-flex items-center gap-1">
                {s.cta} <span aria-hidden className="transition group-hover:translate-x-1">→</span>
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="rounded-3xl bg-brand-navy text-white px-6 py-12 sm:px-12 space-y-10">
        <div className="text-center space-y-2">
          <p className="font-brand font-semibold text-accent-300 uppercase tracking-wider text-sm">Så fungerar det</p>
          <h2 className="font-brand font-bold text-white text-3xl sm:text-4xl">Från prisförslag till klart besked</h2>
        </div>
        <ol className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {STEPS.map((step, i) => (
            <li key={step.title} className="relative text-center">
              {i < STEPS.length - 1 && (
                <span aria-hidden className="hidden lg:block absolute top-8 left-[calc(50%+2.5rem)] right-[calc(-50%+2.5rem)] border-t-2 border-dashed border-accent-400/50" />
              )}
              <span className="relative mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-accent-500 text-white shadow-lg shadow-black/20">
                <Icon name={step.icon} className="h-7 w-7" />
                <span className="absolute -top-2 -right-2 flex h-7 w-7 items-center justify-center rounded-full bg-white text-brand-navy font-brand font-bold text-sm">{i + 1}</span>
              </span>
              <p className="font-brand font-bold text-white text-lg mt-5">{step.title}</p>
              <p className="text-sm text-white/75 mt-2">{step.text}</p>
            </li>
          ))}
        </ol>
        <div className="text-center">
          <Link href={startHref} className={buttonClassName('primary', 'text-base! px-7! min-h-12 bg-accent-500 hover:bg-accent-400')}>
            Kom igång nu
          </Link>
        </div>
      </section>

      <section className="relative mt-24 rounded-2xl border border-accent-200 bg-accent-50 grid grid-cols-1 md:grid-cols-5">
        <div className="relative z-10 md:col-span-3 p-6 sm:p-10 md:pr-24 flex flex-col justify-center space-y-5">
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
        <div className="md:col-span-2 relative z-20 aspect-[800/920] md:aspect-auto md:min-h-full order-first md:order-last">
          <div aria-hidden className="absolute inset-0 overflow-hidden rounded-t-2xl md:rounded-none md:rounded-r-2xl bg-gradient-to-br from-accent-100 via-accent-200 to-accent-400">
            <div className="absolute -right-10 top-10 h-64 w-64 rounded-full bg-white/40 blur-2xl" />
          </div>
          {/* Cut-out portrait (transparent background) taller than its panel so the head rises
              above the box. On mobile it spans the panel's exact width; on desktop it is anchored
              to the right edge and the pointing arm reaches over the text column's background. */}
          <Image src="/sylvia.webp" alt="Sylvia, legitimerad tandläkare" width={800} height={1071}
            sizes="(min-width: 768px) 420px, 340px"
            className="absolute bottom-0 left-0 w-full h-auto md:left-auto md:right-0 md:h-[118%] md:w-auto md:max-w-none" />
        </div>
      </section>
    </div>
  )
}
