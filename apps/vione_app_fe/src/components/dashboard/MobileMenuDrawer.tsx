import { Drawer as DrawerPrimitive } from "vaul";
import { X } from "lucide-react";
import { useT } from "@/lib/i18n";
import { Sidebar } from "./Sidebar";

export function MobileMenuDrawer({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useT();
  return (
    <DrawerPrimitive.Root
      open={open}
      onOpenChange={onOpenChange}
      direction="left"
      shouldScaleBackground={false}
      dismissible
      // Require a deliberate swipe before the drawer closes (smoother feel on all widths)
      closeThreshold={0.35}
      // Slower scroll velocity threshold so quick flicks still register as a close
      scrollLockTimeout={250}
    >
      <DrawerPrimitive.Portal>
        <DrawerPrimitive.Overlay className="fixed inset-0 z-40 bg-foreground/50 backdrop-blur-sm transition-opacity duration-300 data-[state=closed]:opacity-0 data-[state=open]:opacity-100 lg:hidden" />
        <DrawerPrimitive.Content
          className="fixed inset-y-0 left-0 z-50 flex w-[280px] max-w-[85vw] flex-col shadow-2xl outline-none transition-transform duration-300 ease-out will-change-transform lg:hidden"
          role="dialog"
          aria-modal="true"
          aria-label={t("nav.menu")}
        >
          <DrawerPrimitive.Title className="sr-only">{t("nav.menu")}</DrawerPrimitive.Title>
          <DrawerPrimitive.Description className="sr-only">
            {t("nav.menu")}
          </DrawerPrimitive.Description>

          {/* Explicit, focusable close button */}
          <DrawerPrimitive.Close
            aria-label={t("action.close")}
            className="absolute right-2 top-2 z-10 inline-flex h-9 w-9 items-center justify-center rounded-lg text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring"
          >
            <X className="h-5 w-5" />
          </DrawerPrimitive.Close>

          <Sidebar mobile onNavigate={() => onOpenChange(false)} />
          {/* Swipe handle */}
          <div
            aria-hidden="true"
            className="absolute inset-y-0 right-1 my-auto h-16 w-1.5 rounded-full bg-card/20"
          />
        </DrawerPrimitive.Content>
      </DrawerPrimitive.Portal>
    </DrawerPrimitive.Root>
  );
}
