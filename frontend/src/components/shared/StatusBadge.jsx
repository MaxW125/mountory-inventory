import React from "react";

const variants = {
  listed:    { light: "bg-green-50 text-green-700 border border-green-200", dark: "dark:bg-green-900/20 dark:text-green-400 dark:border-green-800" },
  unlisted:  { light: "bg-slate-50 text-slate-700 border border-slate-200", dark: "dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700" },
  received:  { light: "bg-green-50 text-green-700 border border-green-200", dark: "dark:bg-green-900/20 dark:text-green-400 dark:border-green-800" },
  shipped:   { light: "bg-blue-50 text-blue-700 border border-blue-200", dark: "dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800" },
  ordered:   { light: "bg-yellow-50 text-yellow-700 border border-yellow-200", dark: "dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800" },
  draft:     { light: "bg-slate-50 text-slate-700 border border-slate-200", dark: "dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700" },
  low:       { light: "bg-red-50 text-red-700 border border-red-200", dark: "dark:bg-red-900/20 dark:text-red-400 dark:border-red-800" },
  healthy:   { light: "bg-green-50 text-green-700 border border-green-200", dark: "dark:bg-green-900/20 dark:text-green-400 dark:border-green-800" },
  near:      { light: "bg-yellow-50 text-yellow-700 border border-yellow-200", dark: "dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800" },
  over:      { light: "bg-blue-50 text-blue-700 border border-blue-200", dark: "dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800" },
};

export default function StatusBadge({ variant, children }) {
  const v = variants[variant] || variants.draft;
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${v.light} ${v.dark}`}>
      {children}
    </span>
  );
}