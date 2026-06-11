export default function SettingsPage() {
  return (
    <main className="p-10">
      <h1 className="text-4xl font-bold mb-6">
        Settings
      </h1>

      <div className="bg-slate-900 rounded-2xl p-6">
        <h2 className="text-xl font-semibold mb-4">
          OpenAI Configuration
        </h2>

        <p className="text-slate-400">
          OpenAI API key not configured.
        </p>
      </div>
    </main>
  );
}