"use client";

import React from "react";
import { CommandCenterContent } from "@/components/CommandCenterContent";
import { NavView } from "@/components/Sidebar";

interface PageProps {
  params: {
    view: string;
  };
}

const VALID_VIEWS: NavView[] = [
  "overview",
  "shortages",
  "inventory",
  "network",
  "donors",
  "optimization",
  "scenarios",
  "analytics"
];

export default function DynamicViewPage({ params }: PageProps) {
  const targetView = (VALID_VIEWS.includes(params.view as NavView)
    ? params.view
    : "overview") as NavView;

  return <CommandCenterContent initialView={targetView} />;
}
