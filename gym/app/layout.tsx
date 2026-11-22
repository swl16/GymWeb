import './globals.css';
export const metadata = {
  title: 'PULSE | Your next chapter starts here',
  description:
    'A stronger routine. A healthier you. Gym memberships, classes and progress in one place.',
};
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
