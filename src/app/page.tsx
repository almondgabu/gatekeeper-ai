export default function Home() {
  return (
    <main className="min-h-screen bg-slate-950 text-white flex">
      
      {/* Main Content */}
      <section className="flex-1 p-10">
        <h2 className="text-4xl font-bold mb-2">
          Good Evening, Almond
        </h2>
        <p className="text-slate-400 mb-10">
          What would you like to work on today?
        </p>

        <div className="grid grid-cols-3 gap-6 mb-10">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <p className="text-slate-400 text-sm">Documents</p>
            <h3 className="text-3xl font-bold mt-2">0</h3>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <p className="text-slate-400 text-sm">Projects</p>
            <h3 className="text-3xl font-bold mt-2">0</h3>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <p className="text-slate-400 text-sm">Conversations</p>
            <h3 className="text-3xl font-bold mt-2">0</h3>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <h3 className="text-xl font-semibold mb-4">Recent Projects</h3>
            <ul className="space-y-3 text-slate-300">
              <li>Dream World Resort</li>
              <li>SMK Kundasang Series</li>
              <li>Aforce Matter</li>
            </ul>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <h3 className="text-xl font-semibold mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <button className="w-full bg-yellow-500 text-slate-950 py-3 rounded-xl font-semibold">
                New Chat
              </button>
              <button className="w-full bg-slate-800 py-3 rounded-xl">
                Upload Document
              </button>
              <button className="w-full bg-slate-800 py-3 rounded-xl">
                Search Vault
              </button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}