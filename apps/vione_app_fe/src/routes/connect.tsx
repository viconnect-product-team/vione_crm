import { createFileRoute, Link, Outlet, redirect } from "@tanstack/react-router";
import { LangSwitcher } from "@/components/LangSwitcher";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";
import { getAuthToken } from "@/lib/api-client";

export const Route = createFileRoute("/connect")({
  ssr: false,
  beforeLoad: async ({ location }) => {
    const token = getAuthToken();
    if (!token && typeof window !== "undefined") {
      throw redirect({ to: "/auth", search: { redirect: location.href } });
    }
  },
  component: ConnectRoot,
});

function ConnectRoot() {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-20 border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between px-4">
          <Link to="/connect/cards" className="font-semibold text-foreground">
            Connect
          </Link>
          <nav className="ml-6 mr-auto flex items-center gap-4 text-sm">
            <Link
              to="/connect/cards"
              className="text-muted-foreground hover:text-foreground [&.active]:text-foreground [&.active]:font-medium"
            >
              Cards
            </Link>
            <Link
              to="/connect/connections"
              className="text-muted-foreground hover:text-foreground [&.active]:text-foreground [&.active]:font-medium"
            >
              Connections
            </Link>
            <Link
              to="/connect/network"
              className="text-muted-foreground hover:text-foreground [&.active]:text-foreground [&.active]:font-medium"
            >
              Network
            </Link>
            <Link
              to="/connect/meetings"
              className="text-muted-foreground hover:text-foreground [&.active]:text-foreground [&.active]:font-medium"
            >
              Meetings
            </Link>
            <Link
              to="/connect/saved-cards"
              className="text-muted-foreground hover:text-foreground [&.active]:text-foreground [&.active]:font-medium"
            >
              Saved
            </Link>
          </nav>
          <LangSwitcher />
          <ThemeSwitcher />
        </div>
      </header>
      <main>
        <Outlet />
      </main>
    </div>
  );
}
