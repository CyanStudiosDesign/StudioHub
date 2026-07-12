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
      creative_activity: {
        Row: {
          id: string;
          workspace_id: string;
          campaign_id: string | null;
          post_id: string | null;
          version_id: string | null;
          actor_id: string | null;
          type: Database["public"]["Enums"]["creative_activity_type"];
          message: string;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          campaign_id?: string | null;
          post_id?: string | null;
          version_id?: string | null;
          actor_id?: string | null;
          type: Database["public"]["Enums"]["creative_activity_type"];
          message: string;
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          campaign_id?: string | null;
          post_id?: string | null;
          version_id?: string | null;
          actor_id?: string | null;
          type?: Database["public"]["Enums"]["creative_activity_type"];
          message?: string;
          metadata?: Json;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "creative_activity_workspace_id_fkey";
            columns: ["workspace_id"];
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "creative_activity_campaign_id_fkey";
            columns: ["campaign_id"];
            referencedRelation: "creative_campaigns";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "creative_activity_post_id_fkey";
            columns: ["post_id"];
            referencedRelation: "creative_posts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "creative_activity_version_id_fkey";
            columns: ["version_id"];
            referencedRelation: "creative_versions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "creative_activity_actor_id_fkey";
            columns: ["actor_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      creative_campaigns: {
        Row: {
          id: string;
          workspace_id: string;
          title: string;
          description: string | null;
          status: Database["public"]["Enums"]["creative_campaign_status"];
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          title: string;
          description?: string | null;
          status?: Database["public"]["Enums"]["creative_campaign_status"];
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          title?: string;
          description?: string | null;
          status?: Database["public"]["Enums"]["creative_campaign_status"];
          created_by?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "creative_campaigns_workspace_id_fkey";
            columns: ["workspace_id"];
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "creative_campaigns_created_by_fkey";
            columns: ["created_by"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      creative_comments: {
        Row: {
          id: string;
          version_id: string;
          post_id: string;
          workspace_id: string;
          author_id: string;
          message: string;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          version_id: string;
          post_id: string;
          workspace_id: string;
          author_id: string;
          message: string;
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          version_id?: string;
          post_id?: string;
          workspace_id?: string;
          author_id?: string;
          message?: string;
          metadata?: Json;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "creative_comments_version_id_fkey";
            columns: ["version_id"];
            referencedRelation: "creative_versions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "creative_comments_post_id_fkey";
            columns: ["post_id"];
            referencedRelation: "creative_posts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "creative_comments_workspace_id_fkey";
            columns: ["workspace_id"];
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "creative_comments_author_id_fkey";
            columns: ["author_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      creative_post_assignees: {
        Row: {
          post_id: string;
          user_id: string;
          assigned_by: string | null;
          created_at: string;
        };
        Insert: {
          post_id: string;
          user_id: string;
          assigned_by?: string | null;
          created_at?: string;
        };
        Update: {
          post_id?: string;
          user_id?: string;
          assigned_by?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "creative_post_assignees_post_id_fkey";
            columns: ["post_id"];
            referencedRelation: "creative_posts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "creative_post_assignees_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "creative_post_assignees_assigned_by_fkey";
            columns: ["assigned_by"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      creative_post_tags: {
        Row: {
          post_id: string;
          tag_id: string;
        };
        Insert: {
          post_id: string;
          tag_id: string;
        };
        Update: {
          post_id?: string;
          tag_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "creative_post_tags_post_id_fkey";
            columns: ["post_id"];
            referencedRelation: "creative_posts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "creative_post_tags_tag_id_fkey";
            columns: ["tag_id"];
            referencedRelation: "creative_tags";
            referencedColumns: ["id"];
          },
        ];
      };
      creative_posts: {
        Row: {
          id: string;
          campaign_id: string;
          workspace_id: string;
          title: string;
          description: string | null;
          owner_id: string | null;
          current_status: Database["public"]["Enums"]["creative_post_status"];
          current_version_id: string | null;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          campaign_id: string;
          workspace_id: string;
          title: string;
          description?: string | null;
          owner_id?: string | null;
          current_status?: Database["public"]["Enums"]["creative_post_status"];
          current_version_id?: string | null;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          campaign_id?: string;
          workspace_id?: string;
          title?: string;
          description?: string | null;
          owner_id?: string | null;
          current_status?: Database["public"]["Enums"]["creative_post_status"];
          current_version_id?: string | null;
          created_by?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "creative_posts_campaign_id_fkey";
            columns: ["campaign_id"];
            referencedRelation: "creative_campaigns";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "creative_posts_workspace_id_fkey";
            columns: ["workspace_id"];
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "creative_posts_owner_id_fkey";
            columns: ["owner_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "creative_posts_current_version_id_fkey";
            columns: ["current_version_id"];
            referencedRelation: "creative_versions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "creative_posts_created_by_fkey";
            columns: ["created_by"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      creative_tags: {
        Row: {
          id: string;
          workspace_id: string;
          name: string;
          color: string;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          name: string;
          color?: string;
          created_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          name?: string;
          color?: string;
          created_by?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "creative_tags_workspace_id_fkey";
            columns: ["workspace_id"];
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "creative_tags_created_by_fkey";
            columns: ["created_by"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      creative_versions: {
        Row: {
          id: string;
          post_id: string;
          workspace_id: string;
          version_number: number;
          uploaded_by: string;
          storage_path: string;
          preview_url: string | null;
          file_name: string;
          file_size: number | null;
          mime_type: string | null;
          media_type: Database["public"]["Enums"]["creative_media_type"];
          notes: string | null;
          is_active_draft: boolean;
          is_approved: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          post_id: string;
          workspace_id: string;
          version_number?: number;
          uploaded_by: string;
          storage_path: string;
          preview_url?: string | null;
          file_name: string;
          file_size?: number | null;
          mime_type?: string | null;
          media_type?: Database["public"]["Enums"]["creative_media_type"];
          notes?: string | null;
          is_active_draft?: boolean;
          is_approved?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          post_id?: string;
          workspace_id?: string;
          version_number?: number;
          uploaded_by?: string;
          storage_path?: string;
          preview_url?: string | null;
          file_name?: string;
          file_size?: number | null;
          mime_type?: string | null;
          media_type?: Database["public"]["Enums"]["creative_media_type"];
          notes?: string | null;
          is_active_draft?: boolean;
          is_approved?: boolean;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "creative_versions_post_id_fkey";
            columns: ["post_id"];
            referencedRelation: "creative_posts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "creative_versions_workspace_id_fkey";
            columns: ["workspace_id"];
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "creative_versions_uploaded_by_fkey";
            columns: ["uploaded_by"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
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
          can_view_creatives: boolean;
          can_manage_creatives: boolean;
          can_upload_creatives: boolean;
          can_approve_creatives: boolean;
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
          can_view_creatives?: boolean;
          can_manage_creatives?: boolean;
          can_upload_creatives?: boolean;
          can_approve_creatives?: boolean;
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
          can_view_creatives?: boolean;
          can_manage_creatives?: boolean;
          can_upload_creatives?: boolean;
          can_approve_creatives?: boolean;
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
      creative_activity_type:
        | "campaign_created"
        | "post_created"
        | "version_uploaded"
        | "status_changed"
        | "comment_added"
        | "creative_selected"
        | "creative_rejected"
        | "creative_published"
        | "assignee_changed";
      creative_campaign_status: "active" | "completed" | "archived";
      creative_media_type: "image" | "video" | "pdf" | "other";
      creative_post_status:
        | "draft"
        | "improvement_required"
        | "selected"
        | "rejected"
        | "published"
        | "archived";
      project_status: "active" | "completed" | "archived";
      workspace_role: "owner" | "admin" | "member";
    };
    CompositeTypes: Record<string, never>;
  };
};

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type CreativeActivity =
  Database["public"]["Tables"]["creative_activity"]["Row"];
export type CreativeCampaign =
  Database["public"]["Tables"]["creative_campaigns"]["Row"];
export type CreativeComment =
  Database["public"]["Tables"]["creative_comments"]["Row"];
export type CreativePost =
  Database["public"]["Tables"]["creative_posts"]["Row"];
export type CreativeVersion =
  Database["public"]["Tables"]["creative_versions"]["Row"];
export type Document = Database["public"]["Tables"]["documents"]["Row"];
export type Project = Database["public"]["Tables"]["projects"]["Row"];
export type ProjectMember =
  Database["public"]["Tables"]["project_members"]["Row"];
export type Workspace = Database["public"]["Tables"]["workspaces"]["Row"];
export type WorkspaceMember =
  Database["public"]["Tables"]["workspace_members"]["Row"];
export type WorkspaceMemberPermission =
  Database["public"]["Tables"]["workspace_member_permissions"]["Row"];
