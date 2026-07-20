// Hierarchy driving the project "Tag-guide": each top-level node is a part of
// the building, drilling down through an attribute group (e.g. "Typ av
// yttertak") to concrete leaf values (e.g. "Plåt"). Only leaves are taggable —
// stored as "{Toplevel} / {Leaf}" (e.g. "Tak / Plåt"), which keeps the same
// leaf word distinct across branches (e.g. "Betong" under Sockel vs.
// Husgrund) while staying short enough to read as a tag chip.
export interface TaxonomyNode {
  label: string
  children?: TaxonomyNode[]
}

export const BUILDING_TAG_TAXONOMY: TaxonomyNode[] = [
  {
    label: 'Tak',
    children: [
      {
        label: 'Typ av yttertak',
        children: [
          { label: 'Plåt' },
          { label: 'Tegel' },
          { label: 'Papp' },
          { label: 'Shingel' },
          { label: 'Betongpannor' },
        ],
      },
      {
        label: 'Takkonstruktion',
        children: [
          { label: 'Sadeltak' },
          { label: 'Pulpettak' },
          { label: 'Platt tak' },
          { label: 'Valmat tak' },
        ],
      },
      {
        label: 'Takavvattning',
        children: [
          { label: 'Hängrännor' },
          { label: 'Stuprör' },
          { label: 'Takbrunnar' },
        ],
      },
    ],
  },
  {
    label: 'Fasad',
    children: [
      {
        label: 'Fasadmaterial',
        children: [
          { label: 'Puts' },
          { label: 'Tegel' },
          { label: 'Trä' },
          { label: 'Plåt' },
          { label: 'Skiffer' },
        ],
      },
      {
        label: 'Fasadisolering',
        children: [
          { label: 'Tilläggsisolering' },
          { label: 'Ventilerad fasad' },
        ],
      },
      {
        label: 'Fasaddetaljer',
        children: [
          { label: 'Vindskivor' },
          { label: 'Fönsterbleck' },
          { label: 'Sockelplåt' },
        ],
      },
    ],
  },
  {
    label: 'Fönster',
    children: [
      {
        label: 'Fönstertyp',
        children: [
          { label: 'Träfönster' },
          { label: 'Aluminiumfönster' },
          { label: 'PVC-fönster' },
          { label: 'Kompositfönster' },
        ],
      },
      {
        label: 'Glastyp',
        children: [
          { label: 'Enkelglas' },
          { label: 'Tvåglas' },
          { label: 'Treglas' },
          { label: 'Energiglas' },
        ],
      },
      {
        label: 'Fönsterfunktion',
        children: [
          { label: 'Vridfönster' },
          { label: 'Fasta fönster' },
          { label: 'Skjutfönster' },
        ],
      },
    ],
  },
  {
    label: 'Balkonger',
    children: [
      {
        label: 'Balkongtyp',
        children: [
          { label: 'Inglasad balkong' },
          { label: 'Öppen balkong' },
          { label: 'Fransk balkong' },
        ],
      },
      {
        label: 'Balkongkonstruktion',
        children: [
          { label: 'Utkragad balkong' },
          { label: 'Balkong på pelare' },
          { label: 'Indragen balkong' },
        ],
      },
      {
        label: 'Räcke',
        children: [
          { label: 'Glasräcke' },
          { label: 'Smidesräcke' },
          { label: 'Plåträcke' },
        ],
      },
    ],
  },
  {
    label: 'Sockel',
    children: [
      {
        label: 'Sockelmaterial',
        children: [
          { label: 'Betong' },
          { label: 'Puts' },
          { label: 'Natursten' },
          { label: 'Klinker' },
        ],
      },
      {
        label: 'Sockelisolering',
        children: [
          { label: 'Markisolering' },
          { label: 'Cellplast' },
          { label: 'Mineralull' },
        ],
      },
      {
        label: 'Sockeldetaljer',
        children: [
          { label: 'Sockelplåt' },
          { label: 'Dränering vid sockel' },
        ],
      },
    ],
  },
  {
    label: 'Dörrar',
    children: [
      {
        label: 'Dörrtyp',
        children: [
          { label: 'Entrédörr' },
          { label: 'Innerdörr' },
          { label: 'Altandörr' },
          { label: 'Garageport' },
        ],
      },
      {
        label: 'Dörrmaterial',
        children: [
          { label: 'Trä' },
          { label: 'Stål' },
          { label: 'Aluminium' },
          { label: 'Komposit' },
        ],
      },
      {
        label: 'Dörrfunktion',
        children: [
          { label: 'Slagdörr' },
          { label: 'Skjutdörr' },
          { label: 'Karuselldörr' },
        ],
      },
    ],
  },
  {
    label: 'Husgrund',
    children: [
      {
        label: 'Grundtyp',
        children: [
          { label: 'Platta på mark' },
          { label: 'Krypgrund' },
          { label: 'Källare' },
          { label: 'Plintgrund' },
        ],
      },
      {
        label: 'Grundmaterial',
        children: [
          { label: 'Betong' },
          { label: 'Lättklinkerblock' },
        ],
      },
      {
        label: 'Dränering och skydd',
        children: [
          { label: 'Dräneringsledning' },
          { label: 'Fuktisolering' },
          { label: 'Radonskydd' },
        ],
      },
    ],
  },
  {
    label: 'Markarbeten',
    children: [
      {
        label: 'Schaktning',
        children: [
          { label: 'Schakt för grund' },
          { label: 'Schakt för ledningar' },
          { label: 'Massutbyte' },
        ],
      },
      {
        label: 'Markbeläggning',
        children: [
          { label: 'Asfalt' },
          { label: 'Betongplattor' },
          { label: 'Grus' },
          { label: 'Gräsyta' },
        ],
      },
      {
        label: 'VA-arbeten',
        children: [
          { label: 'Dagvatten' },
          { label: 'Spillvatten' },
          { label: 'Dricksvatten' },
        ],
      },
    ],
  },
  {
    label: 'Installationer',
    children: [
      {
        label: 'VVS',
        children: [
          { label: 'Värme' },
          { label: 'Ventilation' },
          { label: 'Sanitet' },
        ],
      },
      {
        label: 'El',
        children: [
          { label: 'Elcentral' },
          { label: 'Belysning' },
          { label: 'Starkström' },
          { label: 'Svagström' },
        ],
      },
      {
        label: 'Styr och övervakning',
        children: [
          { label: 'Fastighetsautomation' },
          { label: 'Brandlarm' },
        ],
      },
    ],
  },
  {
    label: 'Inre utrymmen',
    children: [
      {
        label: 'Golv',
        children: [
          { label: 'Parkett' },
          { label: 'Klinker' },
          { label: 'Matta' },
          { label: 'Betonggolv' },
        ],
      },
      {
        label: 'Innerväggar',
        children: [
          { label: 'Gips' },
          { label: 'Tegel' },
          { label: 'Lättbetong' },
        ],
      },
      {
        label: 'Innertak',
        children: [
          { label: 'Undertak' },
          { label: 'Målat tak' },
          { label: 'Akustikplattor' },
        ],
      },
    ],
  },
]
