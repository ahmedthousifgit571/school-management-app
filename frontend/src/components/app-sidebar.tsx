"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut } from "lucide-react";

import { logout } from "@/app/login/actions";
import { Star } from "@/components/dashboard/doodles";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import { getNavGroups } from "@/lib/navigation";
import { roleLabel, type SessionUser } from "@/lib/session";
import { threadsForRole, threadsStore } from "@/lib/stores";

const hideWhenCollapsed = "group-data-[collapsible=icon]:hidden";

export function AppSidebar({ user }: { user: SessionUser }) {
  const pathname = usePathname();
  const { setOpenMobile } = useSidebar();
  const groups = getNavGroups(user.role);
  const unread = threadsForRole(threadsStore.useStore(), user.role).reduce((sum, thread) => sum + thread.unread, 0);

  return (
    <Sidebar variant="floating" collapsible="icon" className="print:hidden">
      <SidebarHeader className="px-5 pb-1 pt-5 group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:px-1">
        <Link
          href="/dashboard"
          aria-label="MGM, go to dashboard"
          onClick={() => setOpenMobile(false)}
          className="flex items-center gap-2 rounded-2xl text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          <span className={`font-logo text-[2rem] leading-tight ${hideWhenCollapsed}`}>MGM</span>
          <span className="hidden font-logo text-3xl leading-tight group-data-[collapsible=icon]:inline">M</span>
          <Star className={`mt-1 size-5 -rotate-12 text-pastel-pink hover:motion-safe:animate-wiggle ${hideWhenCollapsed}`} />
        </Link>
        <p className={`-mt-1 font-hand text-lg leading-none text-white/75 ${hideWhenCollapsed}`}>
          {user.title ?? roleLabel(user.role)} portal
        </p>
      </SidebarHeader>

      <SidebarContent className="px-1.5 pb-4 [mask-image:linear-gradient(to_bottom,black_calc(100%-20px),transparent)] group-data-[collapsible=icon]:overflow-y-auto">
        {groups.map((group) => (
          <SidebarGroup key={group.label} className="py-0.5">
            <SidebarGroupLabel className="h-7 px-3.5 text-sm font-normal text-white/65">
              {group.label}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="gap-0.5 group-data-[collapsible=icon]:items-center">
                {group.items.map((item) => {
                  const active = pathname === item.href;
                  const badge = item.href === "/dashboard/messaging" ? unread : 0;
                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        render={<Link href={item.href} onClick={() => setOpenMobile(false)} />}
                        isActive={active}
                        tooltip={item.title}
                        className="h-11 gap-3 rounded-full md:h-[38px] border-[1.5px] border-transparent px-3.5 text-[15px] text-white/85 transition-colors duration-200 hover:bg-white hover:text-ink focus-visible:ring-white data-active:border-white/85 data-active:bg-white/10 data-active:font-medium data-active:text-white data-active:hover:bg-white data-active:hover:text-ink group-data-[collapsible=icon]:size-10! group-data-[collapsible=icon]:p-2.5! [&_svg]:size-[18px]"
                      >
                        <item.icon aria-hidden />
                        <span className={`flex-1 ${hideWhenCollapsed}`}>{item.title}</span>
                        {badge > 0 && (
                          <span
                            className={`rounded-full bg-pastel-pink px-2 text-xs font-semibold leading-5 text-ink ${hideWhenCollapsed}`}
                          >
                            <span className="sr-only">Unread: </span>
                            {badge}
                          </span>
                        )}
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="p-3 group-data-[collapsible=icon]:items-center">
        <form action={logout}>
          <button
            type="submit"
            aria-label="Log out"
            title="Log out"
            className="flex h-11 w-full cursor-pointer items-center gap-3 rounded-[20px] border-[1.5px] border-white/70 px-4 text-[15px] text-white transition-colors duration-200 hover:bg-white hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white group-data-[collapsible=icon]:w-11 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0"
          >
            <LogOut className="size-[18px] shrink-0" aria-hidden />
            <span className={hideWhenCollapsed}>Log out</span>
          </button>
        </form>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
