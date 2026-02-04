
"use client";

import * as React from "react";
import { 
  BookOpen, 
  History, 
  LayoutDashboard, 
  Settings, 
  Star,
  FileText,
  PlusCircle
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarSeparator,
} from "@/components/ui/sidebar";

export function AppSidebar() {
  return (
    <Sidebar collapsible="icon" className="border-r">
      <SidebarHeader className="h-16 flex items-center px-4">
        <div className="flex items-center gap-2 font-bold text-xl text-primary">
          <BookOpen className="h-6 w-6" />
          <span className="group-data-[collapsible=icon]:hidden">Concurso AI</span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton isActive tooltip="Painel Principal">
                <LayoutDashboard />
                <span>Painel Principal</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton tooltip="Novo Simulado">
                <PlusCircle />
                <span>Novo Simulado</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        <SidebarSeparator />

        <SidebarGroup>
          <SidebarGroupLabel>Histórico</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton tooltip="Simulado: Direito Adm.">
                  <History />
                  <span>Direito Administrativo</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton tooltip="Simulado: Português">
                  <History />
                  <span>Língua Portuguesa</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Favoritos</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton tooltip="Questões Salvas">
                  <Star />
                  <span>Questões Salvas</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton tooltip="Configurações">
              <Settings />
              <span>Configurações</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
