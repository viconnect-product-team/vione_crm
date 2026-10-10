export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = any;

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;
type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  _T extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"]) | string = string
> = Record<string, any>;

export type TablesInsert<
  _T extends keyof DefaultSchema["Tables"] | string = string
> = Record<string, any>;

export type TablesUpdate<
  _T extends keyof DefaultSchema["Tables"] | string = string
> = Record<string, any>;

export type Enums<
  _T extends keyof DefaultSchema["Enums"] | string = string
> = any;

export type CompositeTypes<
  _T extends keyof DefaultSchema["CompositeTypes"] | string = string
> = any;

export const Constants = {
  public: {
    Enums: {},
  },
} as const;
