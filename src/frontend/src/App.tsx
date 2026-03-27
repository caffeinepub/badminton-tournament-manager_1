import { Toaster } from "@/components/ui/sonner";
import {
  QueryClient,
  QueryClientProvider,
  useQueryClient,
} from "@tanstack/react-query";
import { useEffect, useState } from "react";
import AdminPanel from "./pages/AdminPanel";
import Dashboard from "./pages/Dashboard";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

type Tab = "dashboard" | "admin";

function AppContent() {
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");
  const qc = useQueryClient();

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      qc.invalidateQueries({ queryKey: ["matches"] });
      qc.invalidateQueries({ queryKey: ["leaderboard"] });
      qc.invalidateQueries({ queryKey: ["bracket"] });
      qc.invalidateQueries({ queryKey: ["teams"] });
      qc.invalidateQueries({ queryKey: ["tournamentInfo"] });
    }, 30_000);
    return () => clearInterval(interval);
  }, [qc]);

  return (
    <div className="min-h-screen bg-background">
      {/* Top Navigation */}
      <nav className="sticky top-0 z-50 bg-white border-b border-border shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🏸</span>
              <span className="font-display font-bold text-lg text-sport-green hidden sm:block">
                Badminton Tournament
              </span>
              <span className="font-display font-bold text-lg text-sport-green sm:hidden">
                Tournament
              </span>
            </div>
            <div className="flex items-center gap-1 bg-muted rounded-xl p-1">
              <button
                data-ocid="nav.dashboard.tab"
                type="button"
                onClick={() => setActiveTab("dashboard")}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                  activeTab === "dashboard"
                    ? "bg-white text-sport-green shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                🏸 Dashboard
              </button>
              <button
                data-ocid="nav.admin.tab"
                type="button"
                onClick={() => setActiveTab("admin")}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                  activeTab === "admin"
                    ? "bg-white text-sport-blue shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                ⚙️ Admin
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {activeTab === "dashboard" && <Dashboard />}
        {activeTab === "admin" && <AdminPanel />}
      </main>

      {/* Footer */}
      <footer className="mt-12 border-t border-border py-6 text-center">
        <p className="text-sm text-muted-foreground">
          © {new Date().getFullYear()}. Built with ❤️ using{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sport-green hover:underline font-medium"
          >
            caffeine.ai
          </a>
        </p>
      </footer>

      <Toaster richColors />
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  );
}
