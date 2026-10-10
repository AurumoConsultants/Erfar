import Image from 'next/image'
import Link from 'next/link'
import { buttonClassName } from '@/components/ui/Button'
import { getProfile } from '@/lib/auth'

// Simple outline icons (24×24, stroke = currentColor) for the selling sections.
const ICONS = {
  tag: 'M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.1 18.1 0 0 0 5.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 0 0 9.568 3ZM6 6h.008v.008H6V6Z',
  clipboard: 'M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48 48 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.3 2.3 0 0 0-.1-.664m-5.8 0A2.25 2.25 0 0 1 13.5 2.25H15a2.25 2.25 0 0 1 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25Z',
  building: 'M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21',
  upload: 'M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5',
  chart: 'M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z',
  doctor: 'M9 12.75 11.25 15 15 9.75m-3-7.036A11.96 11.96 0 0 1 3.598 6 12 12 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z',
  chat: 'M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.8 9.8 0 0 1-2.555-.337A5.97 5.97 0 0 1 5.41 20.97a6 6 0 0 1-.474-.065 4.5 4.5 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z',
}

function Icon({ name, className = 'h-6 w-6' }: { name: keyof typeof ICONS; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden className={className}>
      <path d={ICONS[name]} />
    </svg>
  )
}

const STEPS: { title: string; text: string; icon: keyof typeof ICONS }[] = [
  { title: 'Ladda upp', text: 'Fotografera eller ladda upp prisförslaget och vårdplanen. Det tar två minuter.', icon: 'upload' },
  { title: 'Direkt prisanalys', text: 'Varje åtgärd jämförs med TLV:s referenspriser och vi räknar ut ditt tandvårdsstöd.', icon: 'chart' },
  { title: 'Sylvia granskar', text: 'En legitimerad tandläkare går igenom ditt ärende personligen — ingen robot.', icon: 'doctor' },
  { title: 'Du får ett klart svar', text: 'Är priset rimligt? Finns bättre alternativ? Vad ska du fråga din klinik?', icon: 'chat' },
]

const SERVICES: { title: string; lead: string; text: string; icon: keyof typeof ICONS; cta: string; href?: string }[] = [
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
          <h2 className="font-brand font-bold text-3xl sm:text-4xl">Från prisförslag till klart besked</h2>
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
              <p className="font-brand font-bold text-lg mt-5">{step.title}</p>
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
