import Card from '@/components/ui/Card'

// Draft policy — review with a GDPR/patientdatalag adviser before launch.
export default function PrivacyPage() {
  return (
    <Card className="prose max-w-none space-y-4 text-sm text-gray-700">
      <h1 className="text-2xl font-bold text-gray-900">Integritet & personuppgifter</h1>
      <p>
        Tandsmart behandlar hälsouppgifter, som är känsliga personuppgifter. Vi behandlar dem endast för att
        granska ditt ärende och med ditt uttryckliga samtycke, som du kan återkalla när som helst.
      </p>
      <h2 className="font-semibold text-gray-900">Vad vi sparar</h2>
      <ul className="list-disc pl-5 space-y-1">
        <li>Namn, e-post, födelseår och de uppgifter du skriver i ditt ärende.</li>
        <li>Dokument du laddar upp: prisförslag, vårdplan, röntgenbilder och foton.</li>
        <li>Tandläkarens bedömning och er dialog i ärendet, samt en logg över vem som öppnat ärendet.</li>
      </ul>
      <h2 className="font-semibold text-gray-900">Vem som ser uppgifterna</h2>
      <p>
        Endast du och den granskande legitimerade tandläkaren. Uppgifterna lagras krypterat inom EU.
        Som stöd för tandläkaren kan underlaget analyseras med ett AI-verktyg (Anthropic) under ett
        personuppgiftsbiträdesavtal; AI:n fattar inga beslut och dess utkast visas aldrig för dig utan att
        tandläkaren granskat och skrivit svaret.
      </p>
      <h2 className="font-semibold text-gray-900">Dina rättigheter</h2>
      <p>
        Du har rätt att få ut, rätta och i vissa fall radera dina uppgifter. Observera att journalhandlingar
        enligt patientdatalagen kan behöva sparas i minst tio år. Kontakta oss för att utöva dina rättigheter.
      </p>
    </Card>
  )
}
