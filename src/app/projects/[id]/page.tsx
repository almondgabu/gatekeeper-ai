import {
  FileText,
  MessageSquare,
  Brain,
  Paperclip,
  ChevronRight,
  Sparkles,
  Star,
  FolderOpen,
} from "lucide-react";

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const projectName = id
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

  return (
    <div className="p-10 w-full min-h-screen text-white">
      <div className="mb-10 flex items-start justify-between">
        <div>
          <p className="text-sm text-yellow-400 mb-2">Project Workspace</p>

          <div className="flex items-center gap-3">
            <h1 className="text-4xl font-bold">{projectName}</h1>
            <Star size={24} className="text-slate-400" />
          </div>

          <p className="text-slate-400 mt-3">
            Manage documents, conversations, notes and AI memory for this project.
          </p>
        </div>

        <button className="flex items-center gap-2 px-6 py-3 rounded-xl bg-yellow-500 text-black font-semibold hover:bg-yellow-400 transition">
          <Sparkles size={18} />
          Ask Project AI
        </button>
      </div>

      <div className="grid grid-cols-3 gap-6 mb-8">
        <StatCard icon={<FileText size={28} />} color="yellow" title="Documents" value="0" desc="No files attached" />
        <StatCard icon={<MessageSquare size={28} />} color="purple" title="Conversations" value="0" desc="No conversations yet" />
        <StatCard icon={<Brain size={28} />} color="green" title="AI Memories" value="0" desc="No memories yet" />
      </div>

      <div className="grid gap-6" style={{ gridTemplateColumns: "3fr 1fr" }}>
  <section className="bg-slate-900 border border-slate-800 rounded-2xl p-8 min-h-[520px]">
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-3">
        <FolderOpen className="text-yellow-400" size={24} />

        <div>
          <h2 className="text-2xl font-semibold">Attached Documents</h2>
          <p className="text-slate-400 text-sm">
            Files that are linked to this project.
          </p>
        </div>
      </div>

      <button className="flex items-center gap-2 px-5 py-3 rounded-xl bg-yellow-500 text-black font-semibold hover:bg-yellow-400 transition">
        <Paperclip size={18} />
        Attach From Vault
      </button>
    </div>

    <div className="border border-dashed border-slate-700 rounded-2xl p-20 text-center min-h-[360px] flex flex-col items-center justify-center">
      <div className="mx-auto mb-5 w-20 h-20 rounded-2xl bg-yellow-500/10 flex items-center justify-center">
        <FileText className="text-yellow-400" size={40} />
      </div>

      <h3 className="text-xl font-semibold">
        No documents attached yet.
      </h3>

      <p className="text-slate-400 mt-3 max-w-md mx-auto">
        Attach files from your Knowledge Vault to build project intelligence.
      </p>
    </div>
  </section>

  <aside className="space-y-6">
    <SideCard
      icon={<MessageSquare size={22} />}
      color="purple"
      title="Conversations"
      desc="Related chats and project discussions."
      button="Open Chat"
    />

    <SideCard
      icon={<Brain size={22} />}
      color="green"
      title="AI Memory"
      desc="Key facts and insights remembered for this project."
      button="View Memory"
    />

    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
      <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
      <p className="text-slate-300 text-sm">Project workspace created</p>
      <p className="text-slate-500 text-sm mt-2">No document activity yet.</p>
    </div>
  </aside>
</div>
    </div>
  );
}

function StatCard({ icon, title, value, desc, color }: any) {
  const colors: any = {
    yellow: "bg-yellow-500/10 text-yellow-400",
    purple: "bg-purple-500/10 text-purple-400",
    green: "bg-green-500/10 text-green-400",
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${colors[color]}`}>
          {icon}
        </div>

        <div>
          <p className="text-slate-400 text-sm">{title}</p>
          <p className="text-4xl font-bold">{value}</p>
          <p className="text-slate-500 text-sm">{desc}</p>
        </div>
      </div>

      <ChevronRight className="text-slate-500" />
    </div>
  );
}

function SideCard({ icon, title, desc, button, color }: any) {
  const colors: any = {
    purple: "text-purple-400",
    green: "text-green-400",
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
      <div className="flex items-center gap-3 mb-3">
        <div className={colors[color]}>
          {icon}
        </div>

        <h2 className="text-lg font-semibold">
          {title}
        </h2>
      </div>

      <p className="text-slate-400 text-sm mb-5">
        {desc}
      </p>

      <button className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-slate-700 text-slate-200 hover:border-yellow-500/40">
        {button}
        <ChevronRight size={16} />
      </button>
    </div>
  );
}