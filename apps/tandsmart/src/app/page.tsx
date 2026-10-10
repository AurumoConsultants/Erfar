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

      <section>
        <Card className="bg-accent-50 border-accent-200">
          <h2 className="font-semibold text-lg">Om Sylvia</h2>
          <p className="text-sm text-gray-700 mt-2">
            Alla ärenden granskas personligen av Sylvia, legitimerad tandläkare. Tandsmart är oberoende —
            vi tar inte provision från kliniker och säljer inga behandlingar.
          </p>
        </Card>
      </section>
    </div>
  )
}
