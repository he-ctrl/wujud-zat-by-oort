import './globals.css';

export const metadata = {
  title: 'Kecepatan Atom — Padat, Cair, Gas, Plasma & BEC',
  description: 'Simulasi 3D interaktif: geser slider suhu dari nol mutlak sampai plasma, terus lihat atom makin ngebut, meleleh, mendidih, sampai jadi kondensat Bose-Einstein.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
