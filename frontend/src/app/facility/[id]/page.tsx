"use client";

import React from "react";
import CommandCenterPage from "../../page";

interface FacilityPageProps {
  params: {
    id: string;
  };
}

export default function FacilityDetailPage({ params }: FacilityPageProps) {
  return <CommandCenterPage initialFacilityId={params.id} />;
}
