export const metadata = { title: 'Sumber — FaseZat', description: 'Semua data dan riset yang dipakai di simulasi wujud zat, lengkap dengan tautannya.' };

const GROUPS = [
  {
    title: 'Data unsur',
    items: [
      { name: 'Bowserinator/Periodic-Table-JSON — dataset titik leleh, titik didih, dan massa atom 118 unsur (bersumber dari Wikipedia; nama unsur dan golongan diterjemahkan ke bahasa Indonesia)', url: 'https://github.com/Bowserinator/Periodic-Table-JSON' },
      { name: 'Wikipedia bahasa Indonesia — Daftar unsur menurut nomor atom (nama unsur bahasa Indonesia: Kalium, Zirkonium, Natrium, Besi, …)', url: 'https://id.wikipedia.org/wiki/Buku:Unsur_kimia_(urut_nomor)' },
      { name: 'Prohaska dkk. (2022) — Standard atomic weights of the elements 2021, Pure Appl. Chem. 94, 573–600', url: 'https://doi.org/10.1515/pac-2019-0603' },
      { name: 'Wikipedia — Template:Standard atomic weight of the elements (nilai IUPAC 2009–2024, termasuk revisi 2024: Zr 91,222, Gd 157,249, Lu 174,96669)', url: 'https://en.wikipedia.org/wiki/Template:Standard_atomic_weight_of_the_elements' },
      { name: 'mendeleev — paket Python berisi data unsur, dipakai untuk memeriksa silang ke-118 unsur', url: 'https://github.com/lmmentel/mendeleev' },
      { name: 'Wikipedia — Zirconium (kotak info: titik didih 4.650 K; teks artikel: 4.409 °C = 4.682 K)', url: 'https://en.wikipedia.org/wiki/Zirconium' },
    ],
  },
  {
    title: 'Model atom 3D (Bohr)',
    items: [
      { name: 'Google — model 3D Bohr 118 unsur (file .glb), lewat kolom bohr_model_3d di Bowserinator/Periodic-Table-JSON', url: 'https://github.com/Bowserinator/Periodic-Table-JSON' },
      { name: 'Google Model Viewer — cara menampilkan file .glb di web', url: 'https://modelviewer.dev/' },
    ],
  },
  {
    title: 'Helium, superfluid, dan titik lambda',
    items: [
      { name: 'Wikipedia — Liquid helium', url: 'https://en.wikipedia.org/wiki/Liquid_helium' },
      { name: 'Wikipedia — Superfluid helium-4 (titik lambda 2,17 K)', url: 'https://en.wikipedia.org/wiki/Superfluid_helium-4' },
      { name: 'Kapitza, P. — Viscosity of Liquid Helium Below the λ-Point, Nature 141, 74 (1938)', url: 'https://www.nature.com/articles/141074a0' },
      { name: 'Keesom, W. H. — Solidification of Helium, Nature 118, 81 (1926) — helium pertama kali dibekukan, butuh ~25 atm', url: 'https://www.nature.com/articles/118081a0' },
      { name: 'Pessoa, de Koning & Vitiello (2008) — zero-point vacancy in solid ⁴He', url: 'https://arxiv.org/abs/0806.1237' },
    ],
  },
  {
    title: 'Kondensat Bose–Einstein dan fermionik',
    items: [
      { name: 'Wikipedia — Bose–Einstein condensate (pertama kali dibuat 1995 dari rubidium pada 170 nK)', url: 'https://en.wikipedia.org/wiki/Bose%E2%80%93Einstein_condensate' },
      { name: 'LibreTexts — Bose-Einstein Condensation (BEC adalah gas encer, kerapatan 10¹²–10¹³ atom/cm³)', url: 'https://phys.libretexts.org/Bookshelves/Quantum_Mechanics/Introduction_to_the_Physics_of_Atoms_Molecules_and_Photons_(Benedict)/01%3A_Chapters/1.08%3A_New_Page' },
      { name: 'Physics World — Caesium joins the condensates', url: 'https://physicsworld.com/a/caesium-joins-the-condensates/' },
    ],
  },
  {
    title: 'Tekanan, titik tripel, dan titik kritis',
    items: [
      { name: 'LibreTexts — Appendix F: Triple Point of Selected Substances (H₂ 7,04 kPa, N₂ 12,6 kPa, Ne 43,3 kPa, Ar 68,9 kPa, Kr 74,1 kPa, Xe 81,5 kPa)', url: 'https://eng.libretexts.org/Bookshelves/Chemistry/Physical_and_Theoretical_Chemistry_Textbook_Maps/Supplemental_Modules_(Physical_and_Theoretical_Chemistry)/Thermodynamics/Energies_and_Potentials/Entropy/Appendix_F_-_Triple_Point_of_Selected_Substances' },
      { name: 'Engineering Toolbox — Triple points table', url: 'https://www.engineeringtoolbox.com/triple-point-d_1926.html' },
      { name: 'Haaland (1976) — Carbon triple point, Sandia Labs SAND76-0074', url: 'https://www.osti.gov/biblio/7364437' },
      { name: 'Wikipedia — Critical point (thermodynamics) — di atas titik kritis, cair dan gas jadi satu fase superkritis', url: 'https://en.wikipedia.org/wiki/Critical_point_(thermodynamics)' },
      { name: 'Engineering Toolbox — Critical Temperatures and Pressures for some Common Substances', url: 'https://www.engineeringtoolbox.com/gas-critical-temperature-pressure-d_161.html' },
      { name: 'Pearson — Clausius–Clapeyron (kalkulator titik didih + rumus)', url: 'https://www.pearson.com/channels/calculators/boiling-point-calculator' },
      { name: 'Clausius–Clapeyron, penjelasan rumusnya', url: 'https://robertthanlon.com/2025/04/06/the-clausius-clapeyron-equation-explained/' },
      { name: 'LibreTexts — Troutons rule (ΔSvap ≈ 85 J/mol·K)', url: 'https://chem.libretexts.org/Courses/University_of_Georgia/CHEM_3212:_Physical_Chemistry_II/07:_Entropy_Part_II/7.02:_Trouton%27s_rule' },
      { name: 'Wikipedia — Troutons ratio', url: 'https://en.wikipedia.org/wiki/Trouton%27s_ratio' },
    ],
  },
  {
    title: 'Gaya antar atom',
    items: [
      { name: 'LibreTexts — Intermolecular Forces (London dispersion, dipol-dipol, ikatan hidrogen)', url: 'https://chem.libretexts.org/Courses/Sacramento_City_College/Chem_420%3A_Organic_Chemistry_I/02%3A_Structure_and_Properties_of_Organic_Molecules/2.11%3A_Intermolecular_Forces' },
    ],
  },
  {
    title: 'Unsur superberat dan arsenik',
    items: [
      { name: 'Wikipedia — Superheavy element (belum pernah ada sampel makroskopis)', url: 'https://en.wikipedia.org/wiki/Superheavy_element' },
      { name: 'Helmholtz — Superheavy elements', url: 'https://www.helmholtz.de/en/newsroom/article/the-heaviest-element/' },
      { name: 'IAEA — Transactinide chemistry, one atom at a time', url: 'https://inis.iaea.org/records/0ymc5-7e935' },
      { name: 'Wikipedia — Arsenic (menyublim di 887 K, titik tripel 3,63 MPa / 1.090 K)', url: 'https://en.wikipedia.org/wiki/Inorganic_arsenic' },
    ],
  },
  {
    title: 'Wujud lain yang dikenal fisika',
    items: [
      { name: 'Physics Today — The original evidence of supersolidity in helium-4 is explained away (klaim 2004, dibatalkan 2012)', url: 'https://physicstoday.aip.org/news/the-original-evidence-of-supersolidity-in-helium-4-is-explained-away' },
      { name: 'Kim & Chan — Absence of Supersolidity in Solid Helium in Porous Vycor Glass, Phys. Rev. Lett. 109, 155301 (2012)', url: 'https://doi.org/10.1103/PhysRevLett.109.155301' },
      { name: 'Wikipedia — Quark–gluon plasma (di atas ~2 triliun K)', url: 'https://en.wikipedia.org/wiki/Quark%E2%80%93gluon_plasma' },
      { name: 'Rice / Nature Communications (2025) — Temperature measurement of Quark-Gluon plasma at different stages', url: 'https://www.nature.com/articles/s41467-025-63216-5' },
      { name: 'LibreTexts — Glasses (padat amorf: cairan yang didinginkan cepat sampai atomnya nggak sempat tersusun rapi)', url: 'https://chem.libretexts.org/Courses/Iowa_State_University/CHEM-3010%3A_Spring__2026/08%3A_Introduction_to_Solid_State_Chemistry/8.05%3A_Glasses' },
      { name: 'arXiv — Metastability and Ostwald Step Rule in the Crystallisation of Diamond and Graphite from Molten Carbon (titik tripel grafit-berlian-cair ~12 GPa, 4.500 K)', url: 'https://arxiv.org/html/2503.02069v2' },
    ],
  },
];

export default function Sumber() {
  return (
    <div className="wrap">
      <header>
        <div className="eyebrow">Sumber</div>
        <h1>Dari mana semua angka di situs ini?</h1>
        <p>Semua data dan riset yang dipakai di simulasi wujud zat, lengkap dengan tautannya. Klik judulnya buat buka sumber aslinya.</p>
        <p><a href="/" style={{ color: '#00E5FF' }}>← Kembali ke simulasi</a></p>
      </header>
      {GROUPS.map((g) => (
        <div key={g.title} className="panel" style={{ marginTop: 18 }}>
          <h2 style={{ margin: '0 0 10px' }}>{g.title}</h2>
          <ul style={{ margin: 0, paddingLeft: 20, display: 'grid', gap: 8, lineHeight: 1.6 }}>
            {g.items.map((it) => (
              <li key={it.url}>
                <a href={it.url} target="_blank" rel="noreferrer" style={{ color: '#8ef1ff' }}>{it.name}</a>
              </li>
            ))}
          </ul>
        </div>
      ))}
      <footer style={{ marginTop: 28, paddingTop: 18, borderTop: '1px solid rgba(255,255,255,.12)', display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: 13, color: '#7d8aa8' }}>FaseZat · Visualisasi buat belajar, bukan alat ukur.</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <a href="/" className="footLink">← Kembali ke simulasi</a>
          <a href="https://www.instagram.com/edge_ofuniverse?srtk=NG84NDhiNGtiZ29o" target="_blank" rel="noreferrer" className="footLink"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5" /><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" /><line x1="17.5" y1="6.5" x2="17.51" y2="6.5" /></svg>@edge_ofuniverse</a>
        </div>
      </footer>
    </div>
  );
}
