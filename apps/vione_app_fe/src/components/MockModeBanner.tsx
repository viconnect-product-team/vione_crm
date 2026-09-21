import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getMockModeStatusFn, type MockModeStatus } from "@/lib/mock-mode.functions";

export function MockModeBanner() {
  // Mock mode warning banner disabled — data is sourced from real database
  return null;
}
