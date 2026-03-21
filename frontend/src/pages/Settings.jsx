import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import PageHeader from "@/components/layout/PageHeader";

export default function Settings() {
  const [darkMode, setDarkMode] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [lowStockAlerts, setLowStockAlerts] = useState(true);

  useEffect(() => {
    const isDark = document.documentElement.classList.contains("dark");
    setDarkMode(isDark);
  }, []);

  const toggleDarkMode = (checked) => {
    setDarkMode(checked);
    document.documentElement.classList.toggle("dark", checked);
  };

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      <PageHeader title="Settings" subtitle="Workspace preferences and profile details" />

      <Card className="p-6">
        <h2 className="text-sm font-semibold text-foreground mb-4">Business Profile</h2>
        <div className="grid gap-4">
          <div className="grid gap-1.5">
            <Label className="text-xs text-muted-foreground">Business Name</Label>
            <Input value="Mountory" readOnly className="h-9 text-sm bg-muted/50" />
          </div>
          <div className="grid gap-1.5">
            <Label className="text-xs text-muted-foreground">Industry</Label>
            <Input value="3D Printing & Product Inventory" readOnly className="h-9 text-sm bg-muted/50" />
          </div>
          <div className="grid gap-1.5">
            <Label className="text-xs text-muted-foreground">Currency</Label>
            <Input value="USD" readOnly className="h-9 text-sm bg-muted/50" />
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-sm font-semibold text-foreground mb-4">User Profile</h2>
        <div className="grid gap-4">
          <div className="grid gap-1.5">
            <Label className="text-xs text-muted-foreground">Admin User</Label>
            <Input value="Mountory Admin" readOnly className="h-9 text-sm bg-muted/50" />
          </div>
          <div className="grid gap-1.5">
            <Label className="text-xs text-muted-foreground">Account Email</Label>
            <Input value="admin@mountory.local" readOnly className="h-9 text-sm bg-muted/50" />
          </div>
          <div className="grid gap-1.5">
            <Label className="text-xs text-muted-foreground">Role</Label>
            <Input value="Admin" readOnly className="h-9 text-sm bg-muted/50" />
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-sm font-semibold text-foreground mb-4">Preferences</h2>
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">Dark Mode</p>
              <p className="text-xs text-muted-foreground">Switch between light and dark themes</p>
            </div>
            <Switch checked={darkMode} onCheckedChange={toggleDarkMode} />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">Email Notifications</p>
              <p className="text-xs text-muted-foreground">Preference placeholder for future notification settings</p>
            </div>
            <Switch checked={emailNotifications} onCheckedChange={setEmailNotifications} />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">Low Stock Alerts</p>
              <p className="text-xs text-muted-foreground">Preference placeholder for future stock alert settings</p>
            </div>
            <Switch checked={lowStockAlerts} onCheckedChange={setLowStockAlerts} />
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-sm font-semibold text-foreground mb-4">About</h2>
        <div className="space-y-3 text-sm text-muted-foreground">
          <p>
            <span className="font-medium text-foreground">Mountory Inventory</span> is a
            portfolio project for managing products and materials used in a 3D printing workflow.
            The app is designed to showcase practical inventory management UI, backend fundamentals,
            relational data modeling, and a clean migration path from a simple internal tool to a
            more complete operations dashboard.
          </p>
          <div className="flex items-center gap-4 pt-1 text-xs">
            <span className="font-medium text-foreground">Version 1.0.0</span>
            <span>·</span>
            <span>Portfolio Project</span>
            <span>·</span>
            <span>React + Tailwind Frontend</span>
          </div>
        </div>
      </Card>
    </div>
  );
}