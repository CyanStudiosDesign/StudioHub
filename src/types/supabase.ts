export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      documents: {
        Row: {
          id: string;
          workspace_id: string;
          author_id: string;
          title: string;
          content_md: string;
          folder_path: string;
          created_at: string;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          author_id: string;
          title?: string;
          content_md?: string;
          folder_path?: string;
          created_at?: string;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          author_id?: string;
          title?: string;
          content_md?: string;
          folder_path?: string;
          created_at?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "documents_workspace_id_fkey";
            columns: ["workspace_id"];
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "documents_author_id_fkey";
            columns: ["author_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          id: string;
          username: string;
          email: string;
          full_name: string;
          date_of_birth: string;
          avatar_url: string | null;
          created_at: string;
          updated_at: string | null;
        };
        Insert: {
          id: string;
          username: string;
          email: string;
          full_name: string;
          date_of_birth: string;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string | null;
        };
        Update: {
          username?: string;
          email?: string;
          full_name?: string;
          date_of_birth?: string;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      project_members: {
        Row: {
          project_id: string;
          user_id: string;
          assigned_by: string | null;
          created_at: string;
        };
        Insert: {
          project_id: string;
          user_id: string;
          assigned_by?: string | null;
          created_at?: string;
        };
        Update: {
          project_id?: string;
          user_id?: string;
          assigned_by?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "project_members_project_id_fkey";
            columns: ["project_id"];
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "project_members_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "project_members_assigned_by_fkey";
            columns: ["assigned_by"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      projects: {
        Row: {
          id: string;
          workspace_id: string;
          created_by: string;
          name: string;
          description: string | null;
          status: Database["public"]["Enums"]["project_status"];
          created_at: string;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          created_by: string;
          name: string;
          description?: string | null;
          status?: Database["public"]["Enums"]["project_status"];
          created_at?: string;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          created_by?: string;
          name?: string;
          description?: string | null;
          status?: Database["public"]["Enums"]["project_status"];
          created_at?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "projects_workspace_id_fkey";
            columns: ["workspace_id"];
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "projects_created_by_fkey";
            columns: ["created_by"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      workspace_members: {
        Row: {
          workspace_id: string;
          user_id: string;
          role: Database["public"]["Enums"]["workspace_role"];
          invited_by: string | null;
          created_at: string;
          updated_at: string | null;
        };
        Insert: {
          workspace_id: string;
          user_id: string;
          role?: Database["public"]["Enums"]["workspace_role"];
          invited_by?: string | null;
          created_at?: string;
          updated_at?: string | null;
        };
        Update: {
          workspace_id?: string;
          user_id?: string;
          role?: Database["public"]["Enums"]["workspace_role"];
          invited_by?: string | null;
          created_at?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "workspace_members_workspace_id_fkey";
            columns: ["workspace_id"];
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "workspace_members_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "workspace_members_invited_by_fkey";
            columns: ["invited_by"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      workspace_member_permissions: {
        Row: {
          workspace_id: string;
          user_id: string;
          can_view_documents: boolean;
          can_manage_documents: boolean;
          can_view_projects: boolean;
          can_manage_projects: boolean;
          can_manage_members: boolean;
          created_at: string;
          updated_at: string | null;
        };
        Insert: {
          workspace_id: string;
          user_id: string;
          can_view_documents?: boolean;
          can_manage_documents?: boolean;
          can_view_projects?: boolean;
          can_manage_projects?: boolean;
          can_manage_members?: boolean;
          created_at?: string;
          updated_at?: string | null;
        };
        Update: {
          workspace_id?: string;
          user_id?: string;
          can_view_documents?: boolean;
          can_manage_documents?: boolean;
          can_view_projects?: boolean;
          can_manage_projects?: boolean;
          can_manage_members?: boolean;
          created_at?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "workspace_member_permissions_workspace_id_user_id_fkey";
            columns: ["workspace_id", "user_id"];
            referencedRelation: "workspace_members";
            referencedColumns: ["workspace_id", "user_id"];
          },
        ];
      };
      workspaces: {
        Row: {
          id: string;
          owner_id: string;
          name: string;
          slug: string;
          icon: string;
          description: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          owner_id: string;
          name: string;
          slug: string;
          icon?: string;
          description?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          owner_id?: string;
          name?: string;
          slug?: string;
          icon?: string;
          description?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "workspaces_owner_id_fkey";
            columns: ["owner_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: {
      add_workspace_member_by_email: {
        Args: {
          p_workspace_id: string;
          p_email: string;
          p_role?: Database["public"]["Enums"]["workspace_role"];
        };
        Returns: Database["public"]["Tables"]["workspace_members"]["Row"];
      };
      create_workspace: {
        Args: {
          p_name: string;
          p_slug: string;
          p_icon?: string;
        };
        Returns: string;
      };
      lookup_profile_by_email: {
        Args: {
          p_email: string;
        };
        Returns: {
          username: string;
          full_name: string;
        }[];
      };
      username_exists: {
        Args: {
          p_username: string;
        };
        Returns: boolean;
      };
      is_workspace_admin: {
        Args: {
          p_workspace_id: string;
          p_user_id?: string;
        };
        Returns: boolean;
      };
      can_access_project: {
        Args: {
          p_project_id: string;
        };
        Returns: boolean;
      };
      is_project_workspace_member: {
        Args: {
          p_project_id: string;
          p_user_id: string;
        };
        Returns: boolean;
      };
      has_workspace_permission: {
        Args: {
          p_workspace_id: string;
          p_permission: string;
          p_user_id?: string;
        };
        Returns: boolean;
      };
      is_workspace_member: {
        Args: {
          p_workspace_id: string;
          p_user_id?: string;
        };
        Returns: boolean;
      };
      is_workspace_owner: {
        Args: {
          p_workspace_id: string;
          p_user_id?: string;
        };
        Returns: boolean;
      };
    };
    Enums: {
      project_status: "active" | "completed" | "archived";
      workspace_role: "owner" | "admin" | "member";
    };
    CompositeTypes: Record<string, never>;
  };
};

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Document = Database["public"]["Tables"]["documents"]["Row"];
export type Project = Database["public"]["Tables"]["projects"]["Row"];
export type ProjectMember =
  Database["public"]["Tables"]["project_members"]["Row"];
export type Workspace = Database["public"]["Tables"]["workspaces"]["Row"];
export type WorkspaceMember =
  Database["public"]["Tables"]["workspace_members"]["Row"];
export type WorkspaceMemberPermission =
  Database["public"]["Tables"]["workspace_member_permissions"]["Row"];
