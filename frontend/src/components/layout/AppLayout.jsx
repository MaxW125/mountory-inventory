import React from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";

export default function AppLayout() {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <main className="pl-60">
        <div className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}