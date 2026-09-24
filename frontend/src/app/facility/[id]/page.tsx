"use client";

import React from "react";
import { CommandCenterContent } from "@/components/CommandCenterContent";

interface FacilityPageProps {
  params: {
    id: string;
  };
}

export default function FacilityDetailPage({ params }: FacilityPageProps) {
  return <CommandCenterContent initialFacilityId={params.id} />;
}
