// Tipos de la base de datos. Reflejan supabase/migrations/20261017000001_init.sql.
//
// Si cambias el esquema, regenera este archivo en vez de editarlo a mano:
//   npx supabase gen types typescript --project-id uevcvgkvrttbnqiorrlt > lib/supabase/types.ts

export type HackerLevel = "Principiante" | "Intermedio" | "Avanzado" | "Experto"
export type JoinRequestStatus = "pending" | "accepted" | "rejected"
export type ProjectStatus = "draft" | "submitted"
export type InstitutionKind = "publica" | "privada" | "instituto"

export type Institution = {
  id: string
  name: string
  short_name: string | null
  kind: InstitutionKind
  is_licensed: boolean
  is_eligible: boolean
  created_at: string
}

export type Expertise = {
  id: string
  name: string
  created_at: string
}

export type Team = {
  id: string
  name: string
  description: string | null
  stack: string[]
  level_wanted: HackerLevel | null
  slots_total: number
  is_open: boolean
  leader_id: string | null
  created_at: string
  updated_at: string
}

export type Hacker = {
  id: string
  auth_user_id: string | null
  email: string
  email_domain: string
  name: string | null
  lastname: string | null
  phone: string | null
  linkedin_url: string | null
  github_url: string | null
  discord_id: string | null
  discord_username: string | null
  level: HackerLevel | null
  institution_id: string | null
  expertise_id: string | null
  career: string | null
  study_year: number | null
  team_id: string | null
  photo_url: string | null
  badge_role: string | null
  badge_number: number
  qr_token: string
  profile_completed_at: string | null
  checked_in_at: string | null
  created_at: string
  updated_at: string
}

/** Lo que el hacker puede editar de su propia fila desde el panel. */
export type HackerProfileInput = Pick<
  Hacker,
  | "name"
  | "lastname"
  | "phone"
  | "linkedin_url"
  | "github_url"
  | "discord_username"
  | "level"
  | "institution_id"
  | "expertise_id"
  | "career"
  | "study_year"
  | "badge_role"
  | "photo_url"
>

export type PublicStats = {
  hackers: number
  teams: number
  universities: number
  projects_submitted: number
  checked_in: number
  updated_at: string
}

export type PublicTeam = {
  id: string
  name: string
  description: string | null
  stack: string[]
  level_wanted: HackerLevel | null
  slots_total: number
  is_open: boolean
  slots_free: number
}

export type Sponsor = {
  id: string
  company_name: string
  contact_name: string
  contact_lastname: string | null
  email: string
  phone: string | null
  plan: string | null
  message: string | null
  linkedin: string | null
  instagram: string | null
  facebook: string | null
  created_at: string
}

export type InstitutionForEmail = {
  institution_id: string
  institution_name: string
  short_name: string | null
}

/**
 * Forma mínima del esquema para que el cliente de Supabase tipe las consultas.
 * Solo se declaran las tablas y funciones que el frontend realmente usa.
 */
// Tiene que ser `type` y no `interface`: TypeScript solo le da firma de índice
// implícita a los alias de tipo, y sin eso el esquema no cumple `GenericSchema`,
// el cliente lo resuelve como `never` y todas las consultas pierden el tipado.
export type Database = {
  public: {
    Tables: {
      institutions: {
        Row: Institution
        Insert: Partial<Institution> & { name: string }
        Update: Partial<Institution>
        Relationships: []
      }
      expertises: {
        Row: Expertise
        Insert: Partial<Expertise> & { name: string }
        Update: Partial<Expertise>
        Relationships: []
      }
      teams: {
        Row: Team
        Insert: Partial<Team> & { name: string }
        Update: Partial<Team>
        Relationships: []
      }
      hackers: {
        Row: Hacker
        Insert: Partial<Hacker> & { email: string }
        Update: Partial<Hacker>
        Relationships: []
      }
      sponsors: {
        Row: Sponsor
        Insert: Partial<Sponsor> & {
          company_name: string
          contact_name: string
          email: string
        }
        Update: Partial<Sponsor>
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_institutional_email: {
        Args: { p_email: string }
        Returns: boolean
      }
      institution_for_email: {
        Args: { p_email: string }
        Returns: InstitutionForEmail[]
      }
      get_public_stats: {
        Args: Record<PropertyKey, never>
        Returns: PublicStats[]
      }
      get_public_teams: {
        Args: Record<PropertyKey, never>
        Returns: PublicTeam[]
      }
    }
    Enums: {
      hacker_level: HackerLevel
      join_request_status: JoinRequestStatus
      project_status: ProjectStatus
      institution_kind: InstitutionKind
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
