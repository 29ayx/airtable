"use client";

import * as React from "react";
import {
  IconCamera,

  IconDatabase,
  IconFileAi,
  IconFileDescription,
  IconFileWord,


  IconStar,
  IconReport,
} from "@tabler/icons-react";
import { GoHome } from "react-icons/go";
import { PiShareLight } from "react-icons/pi";
import { PiUsersThree } from "react-icons/pi";
import { PiBookOpen } from "react-icons/pi";
import { PiShoppingBagOpenThin } from "react-icons/pi";
import { PiUploadSimple } from "react-icons/pi";
import { IoIosAdd } from "react-icons/io";
import { CiStar } from "react-icons/ci";


import { NavMain } from "@/components/nav-main";
import { NavSecondary } from "@/components/nav-secondary";
import { NavUser } from "@/components/nav-user";
import { CreateDialog } from "@/components/create-dialog";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Button } from "./ui/button";

const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  navMain: [
    {
      title: "Home",
      url: "#",
      icon: GoHome,
    },
    {
      title: "Starred",
      url: "#",
      icon: CiStar,
    },
    {
      title: "Shared",
      url: "#",
      icon: PiShareLight,
    },
    {
      title: "Workspaces",
      url: "#",
      icon: PiUsersThree,
    },
  ],
  navClouds: [
    {
      title: "Capture",
      icon: IconCamera,
      isActive: true,
      url: "#",
      items: [
        {
          title: "Active Proposals",
          url: "#",
        },
        {
          title: "Archived",
          url: "#",
        },
      ],
    },
    {
      title: "Proposal",
      icon: IconFileDescription,
      url: "#",
      items: [
        {
          title: "Active Proposals",
          url: "#",
        },
        {
          title: "Archived",
          url: "#",
        },
      ],
    },
    {
      title: "Prompts",
      icon: IconFileAi,
      url: "#",
      items: [
        {
          title: "Active Proposals",
          url: "#",
        },
        {
          title: "Archived",
          url: "#",
        },
      ],
    },
  ],
  navSecondary: [
    {
      title: "Templates and apps",
      url: "#",
      icon: PiBookOpen,
    },
    {
      title: "Marketplace",
      url: "#",
      icon: PiShoppingBagOpenThin,
    },
    {
      title: "Import",
      url: "#",
      icon: PiUploadSimple,
    },
  ],
  documents: [
    {
      name: "Data Library",
      url: "#",
      icon: IconDatabase,
    },
    {
      name: "Reports",
      url: "#",
      icon: IconReport,
    },
    {
      name: "Word Assistant",
      url: "#",
      icon: IconFileWord,
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props} className="bg-white border-r-1">
      <SidebarHeader className="bg-white" >
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent className="bg-white">
        <NavMain items={data.navMain} />
        <NavSecondary items={data.navSecondary} className="mt-auto " />
      </SidebarContent>

      <SidebarFooter className="bg-white">
        {/* <NavUser user={data.user} /> */}
        <CreateDialog>
          <Button className="font-regular text-sm bg-[#166ee1]">
            <IoIosAdd
              style={{ fontSize: "10px", width: "21px", height: "21px" }}
            />{" "}
            Create
          </Button>
        </CreateDialog>
      </SidebarFooter>
    </Sidebar>
  );
}
