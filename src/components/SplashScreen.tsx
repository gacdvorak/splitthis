export default function SplashScreen() {
  return (
    <div className="fixed inset-0 bg-dark-bg flex flex-col items-center justify-center">
      <img
        src="/splitthis-logo-splash.svg"
        alt="SplitThis"
        className="w-32 h-32 mb-8"
      />
      <h1 className="text-display text-dark-text">splitthis</h1>
    </div>
  );
}
