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
      announcement_reads: {
        Row: {
          announcement_id: string;
          user_id: string;
          read_at: string;
        };
        Insert: {
          announcement_id: string;
          user_id: string;
          read_at?: string;
        };
        Update: {
          announcement_id?: string;
          user_id?: string;
          read_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "announcement_reads_announcement_id_fkey";
            columns: ["announcement_id"];
            referencedRelation: "announcements";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "announcement_reads_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      announcements: {
        Row: {
          id: string;
          workspace_id: string;
          title: string;
          message: string;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          title: string;
          message: string;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          title?: string;
          message?: string;
          created_by?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "announcements_workspace_id_fkey";
            columns: ["workspace_id"];
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "announcements_created_by_fkey";
            columns: ["created_by"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
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
          role: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          project_id: string;
          user_id: string;
          assigned_by?: string | null;
          role?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          project_id?: string;
          user_id?: string;
          assigned_by?: string | null;
          role?: string;
          created_at?: string;
          updated_at?: string;
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
          client_name: string | null;
          estimated_deadline: string | null;
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
          client_name?: string | null;
          estimated_deadline?: string | null;
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
          client_name?: string | null;
          estimated_deadline?: string | null;
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
      project_activity: {
        Row: {
          id: string;
          project_id: string;
          task_id: string | null;
          goal_id: string | null;
          actor_id: string | null;
          type: Database["public"]["Enums"]["project_activity_type"];
          message: string;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          task_id?: string | null;
          goal_id?: string | null;
          actor_id?: string | null;
          type: Database["public"]["Enums"]["project_activity_type"];
          message: string;
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          task_id?: string | null;
          goal_id?: string | null;
          actor_id?: string | null;
          type?: Database["public"]["Enums"]["project_activity_type"];
          message?: string;
          metadata?: Json;
          created_at?: string;
        };
        Relationships: [];
      };
      project_attachments: {
        Row: {
          id: string;
          project_id: string;
          task_id: string | null;
          uploaded_by: string;
          storage_path: string;
          preview_url: string | null;
          file_name: string;
          file_size: number | null;
          mime_type: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          task_id?: string | null;
          uploaded_by: string;
          storage_path: string;
          preview_url?: string | null;
          file_name: string;
          file_size?: number | null;
          mime_type?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          task_id?: string | null;
          uploaded_by?: string;
          storage_path?: string;
          preview_url?: string | null;
          file_name?: string;
          file_size?: number | null;
          mime_type?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      project_comments: {
        Row: {
          id: string;
          project_id: string;
          task_id: string | null;
          author_id: string;
          message: string;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          task_id?: string | null;
          author_id: string;
          message: string;
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          task_id?: string | null;
          author_id?: string;
          message?: string;
          metadata?: Json;
          created_at?: string;
        };
        Relationships: [];
      };
      project_financial_entries: {
        Row: {
          id: string;
          project_id: string;
          workspace_id: string;
          title: string;
          category: string;
          amount: number;
          is_revenue: boolean;
          notes: string | null;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          workspace_id: string;
          title: string;
          category: string;
          amount: number;
          is_revenue?: boolean;
          notes?: string | null;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          workspace_id?: string;
          title?: string;
          category?: string;
          amount?: number;
          is_revenue?: boolean;
          notes?: string | null;
          created_by?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      project_goals: {
        Row: {
          id: string;
          project_id: string;
          workspace_id: string;
          name: string;
          description: string | null;
          deadline: string | null;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          workspace_id: string;
          name: string;
          description?: string | null;
          deadline?: string | null;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          workspace_id?: string;
          name?: string;
          description?: string | null;
          deadline?: string | null;
          created_by?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      project_subtasks: {
        Row: {
          id: string;
          task_id: string;
          title: string;
          is_completed: boolean;
          completed_by: string | null;
          completed_at: string | null;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          task_id: string;
          title: string;
          is_completed?: boolean;
          completed_by?: string | null;
          completed_at?: string | null;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          task_id?: string;
          title?: string;
          is_completed?: boolean;
          completed_by?: string | null;
          completed_at?: string | null;
          created_by?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      project_task_assignees: {
        Row: {
          task_id: string;
          user_id: string;
          assigned_by: string | null;
          created_at: string;
        };
        Insert: {
          task_id: string;
          user_id: string;
          assigned_by?: string | null;
          created_at?: string;
        };
        Update: {
          task_id?: string;
          user_id?: string;
          assigned_by?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      project_task_dependencies: {
        Row: {
          task_id: string;
          depends_on_task_id: string;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          task_id: string;
          depends_on_task_id: string;
          created_by?: string | null;
          created_at?: string;
        };
        Update: {
          task_id?: string;
          depends_on_task_id?: string;
          created_by?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      project_tasks: {
        Row: {
          id: string;
          project_id: string;
          workspace_id: string;
          goal_id: string | null;
          parent_task_id: string | null;
          title: string;
          description: string | null;
          status: Database["public"]["Enums"]["project_task_status"];
          priority: Database["public"]["Enums"]["project_task_priority"];
          reporter_id: string | null;
          created_by: string;
          start_date: string | null;
          due_date: string | null;
          estimated_hours: number | null;
          actual_hours: number | null;
          labels: string[];
          block_completion_on_dependencies: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          workspace_id: string;
          goal_id?: string | null;
          parent_task_id?: string | null;
          title: string;
          description?: string | null;
          status?: Database["public"]["Enums"]["project_task_status"];
          priority?: Database["public"]["Enums"]["project_task_priority"];
          reporter_id?: string | null;
          created_by: string;
          start_date?: string | null;
          due_date?: string | null;
          estimated_hours?: number | null;
          actual_hours?: number | null;
          labels?: string[];
          block_completion_on_dependencies?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          workspace_id?: string;
          goal_id?: string | null;
          parent_task_id?: string | null;
          title?: string;
          description?: string | null;
          status?: Database["public"]["Enums"]["project_task_status"];
          priority?: Database["public"]["Enums"]["project_task_priority"];
          reporter_id?: string | null;
          created_by?: string;
          start_date?: string | null;
          due_date?: string | null;
          estimated_hours?: number | null;
          actual_hours?: number | null;
          labels?: string[];
          block_completion_on_dependencies?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
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
      workspace_join_requests: {
        Row: {
          id: string;
          workspace_id: string;
          user_id: string;
          status: "pending" | "approved" | "rejected" | "cancelled";
          requested_at: string;
          reviewed_at: string | null;
          reviewed_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          user_id: string;
          status?: "pending" | "approved" | "rejected" | "cancelled";
          requested_at?: string;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          user_id?: string;
          status?: "pending" | "approved" | "rejected" | "cancelled";
          requested_at?: string;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "workspace_join_requests_workspace_id_fkey";
            columns: ["workspace_id"];
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "workspace_join_requests_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "workspace_join_requests_reviewed_by_fkey";
            columns: ["reviewed_by"];
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
          is_deleted: boolean;
          deleted_at: string | null;
          deleted_by: string | null;
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
          is_deleted?: boolean;
          deleted_at?: string | null;
          deleted_by?: string | null;
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
          is_deleted?: boolean;
          deleted_at?: string | null;
          deleted_by?: string | null;
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
      get_workspace_by_slug: {
        Args: {
          p_slug: string;
        };
        Returns: {
          id: string;
          name: string;
          slug: string;
          icon: string;
          description: string | null;
        }[];
      };
      request_workspace_join: {
        Args: {
          p_workspace_slug: string;
        };
        Returns: Database["public"]["Tables"]["workspace_join_requests"]["Row"];
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
      can_manage_project: {
        Args: {
          p_project_id: string;
          p_user_id?: string;
        };
        Returns: boolean;
      };
      can_view_project_financials: {
        Args: {
          p_project_id: string;
          p_user_id?: string;
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
      project_activity_type:
        | "project_updated"
        | "goal_created"
        | "goal_completed"
        | "task_created"
        | "task_updated"
        | "status_changed"
        | "member_assigned"
        | "deadline_changed"
        | "comment_added"
        | "attachment_uploaded"
        | "subtask_completed"
        | "financial_entry_added";
      project_task_priority: "low" | "medium" | "high" | "critical";
      project_task_status:
        | "backlog"
        | "todo"
        | "in_progress"
        | "blocked"
        | "in_review"
        | "completed"
        | "cancelled";
      workspace_role: "owner" | "admin" | "member";
    };
    CompositeTypes: Record<string, never>;
  };
};

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Announcement =
  Database["public"]["Tables"]["announcements"]["Row"];
export type AnnouncementRead =
  Database["public"]["Tables"]["announcement_reads"]["Row"];
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
export type ProjectActivity =
  Database["public"]["Tables"]["project_activity"]["Row"];
export type ProjectAttachment =
  Database["public"]["Tables"]["project_attachments"]["Row"];
export type ProjectComment =
  Database["public"]["Tables"]["project_comments"]["Row"];
export type ProjectFinancialEntry =
  Database["public"]["Tables"]["project_financial_entries"]["Row"];
export type ProjectGoal =
  Database["public"]["Tables"]["project_goals"]["Row"];
export type ProjectMember =
  Database["public"]["Tables"]["project_members"]["Row"];
export type ProjectSubtask =
  Database["public"]["Tables"]["project_subtasks"]["Row"];
export type ProjectTask =
  Database["public"]["Tables"]["project_tasks"]["Row"];
export type ProjectTaskAssignee =
  Database["public"]["Tables"]["project_task_assignees"]["Row"];
export type ProjectTaskDependency =
  Database["public"]["Tables"]["project_task_dependencies"]["Row"];
export type Workspace = Database["public"]["Tables"]["workspaces"]["Row"];
export type WorkspaceMember =
  Database["public"]["Tables"]["workspace_members"]["Row"];
export type WorkspaceMemberPermission =
  Database["public"]["Tables"]["workspace_member_permissions"]["Row"];
