// Tipe TypeScript yang merepresentasikan schema Supabase (lihat
// supabase/migrations/0001_init_schema.sql). Setelah project Supabase asli
// dibuat, file ini idealnya di-generate ulang otomatis dengan:
//   npx supabase gen types typescript --project-id <project-id> > src/lib/supabase/database.types.ts
// Untuk sekarang ditulis manual agar client Supabase (client.ts/server.ts/admin.ts)
// sudah type-safe sejak awal.

export type TemplateStatus = "active" | "inactive";

export interface Database {
  public: {
    Tables: {
      templates: {
        Row: {
          id: string;
          name: string;
          category: string;
          thumbnail_url: string | null;
          background_url: string | null;
          overlay_url: string | null;
          layers: Record<string, unknown>[];
          text_positions: Record<string, unknown>;
          photo_placeholder: Record<string, unknown>;
          font_name: string;
          font_size: number;
          font_color: string;
          dominant_color: string;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          category?: string;
          thumbnail_url?: string | null;
          background_url?: string | null;
          overlay_url?: string | null;
          layers?: Record<string, unknown>[];
          text_positions?: Record<string, unknown>;
          photo_placeholder?: Record<string, unknown>;
          font_name?: string;
          font_size?: number;
          font_color?: string;
          dominant_color?: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["templates"]["Insert"]>;
        Relationships: [];
      };
      generated_images: {
        Row: {
          id: string;
          template_id: string;
          form_data: Record<string, unknown>;
          photo_url: string | null;
          result_image_url: string | null;
          status: "pending" | "processing" | "completed" | "failed";
          created_at: string;
        };
        Insert: {
          id?: string;
          template_id: string;
          form_data: Record<string, unknown>;
          photo_url?: string | null;
          result_image_url?: string | null;
          status?: "pending" | "processing" | "completed" | "failed";
          created_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["generated_images"]["Insert"]
        >;
        Relationships: [
          {
            foreignKeyName: "generated_images_template_id_fkey";
            columns: ["template_id"];
            referencedRelation: "templates";
            referencedColumns: ["id"];
          },
        ];
      };
      orders: {
        Row: {
          id: string;
          generated_image_id: string;
          customer_wa: string;
          status: "pending" | "confirmed" | "cancelled";
          created_at: string;
        };
        Insert: {
          id?: string;
          generated_image_id: string;
          customer_wa: string;
          status?: "pending" | "confirmed" | "cancelled";
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["orders"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "orders_generated_image_id_fkey";
            columns: ["generated_image_id"];
            referencedRelation: "generated_images";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
  };
}
