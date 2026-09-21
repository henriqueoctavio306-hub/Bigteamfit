export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      body_measurements: {
        Row: {
          abdomen: number | null
          arm_left: number | null
          arm_right: number | null
          body_fat: number | null
          chest: number | null
          evaluation_id: string
          hip: number | null
          id: string
          thigh_left: number | null
          thigh_right: number | null
          waist: number | null
          weight: number | null
        }
        Insert: {
          abdomen?: number | null
          arm_left?: number | null
          arm_right?: number | null
          body_fat?: number | null
          chest?: number | null
          evaluation_id: string
          hip?: number | null
          id?: string
          thigh_left?: number | null
          thigh_right?: number | null
          waist?: number | null
          weight?: number | null
        }
        Update: {
          abdomen?: number | null
          arm_left?: number | null
          arm_right?: number | null
          body_fat?: number | null
          chest?: number | null
          evaluation_id?: string
          hip?: number | null
          id?: string
          thigh_left?: number | null
          thigh_right?: number | null
          waist?: number | null
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "body_measurements_evaluation_id_fkey"
            columns: ["evaluation_id"]
            isOneToOne: false
            referencedRelation: "evaluations"
            referencedColumns: ["id"]
          },
        ]
      }
      check_ins: {
        Row: {
          adherence_score: number | null
          energy_score: number | null
          id: string
          notes: string | null
          pain_score: number | null
          personal_feedback: string | null
          photo_paths: string[]
          responded_at: string | null
          sleep_score: number | null
          status: Database["public"]["Enums"]["checkin_status"]
          student_id: string
          submitted_at: string
          weight: number | null
        }
        Insert: {
          adherence_score?: number | null
          energy_score?: number | null
          id?: string
          notes?: string | null
          pain_score?: number | null
          personal_feedback?: string | null
          photo_paths?: string[]
          responded_at?: string | null
          sleep_score?: number | null
          status?: Database["public"]["Enums"]["checkin_status"]
          student_id: string
          submitted_at?: string
          weight?: number | null
        }
        Update: {
          adherence_score?: number | null
          energy_score?: number | null
          id?: string
          notes?: string | null
          pain_score?: number | null
          personal_feedback?: string | null
          photo_paths?: string[]
          responded_at?: string | null
          sleep_score?: number | null
          status?: Database["public"]["Enums"]["checkin_status"]
          student_id?: string
          submitted_at?: string
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "check_ins_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      diets: {
        Row: {
          carbs_g: number | null
          created_at: string
          daily_calories: number | null
          fats_g: number | null
          id: string
          name: string
          notes: string | null
          personal_id: string
          protein_g: number | null
          status: Database["public"]["Enums"]["record_status"]
          student_id: string
          updated_at: string
          water_liters: number | null
        }
        Insert: {
          carbs_g?: number | null
          created_at?: string
          daily_calories?: number | null
          fats_g?: number | null
          id?: string
          name: string
          notes?: string | null
          personal_id: string
          protein_g?: number | null
          status?: Database["public"]["Enums"]["record_status"]
          student_id: string
          updated_at?: string
          water_liters?: number | null
        }
        Update: {
          carbs_g?: number | null
          created_at?: string
          daily_calories?: number | null
          fats_g?: number | null
          id?: string
          name?: string
          notes?: string | null
          personal_id?: string
          protein_g?: number | null
          status?: Database["public"]["Enums"]["record_status"]
          student_id?: string
          updated_at?: string
          water_liters?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "diets_personal_id_fkey"
            columns: ["personal_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "diets_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      evaluations: {
        Row: {
          created_at: string
          evaluated_at: string
          evaluator_id: string
          id: string
          notes: string | null
          student_id: string
        }
        Insert: {
          created_at?: string
          evaluated_at?: string
          evaluator_id: string
          id?: string
          notes?: string | null
          student_id: string
        }
        Update: {
          created_at?: string
          evaluated_at?: string
          evaluator_id?: string
          id?: string
          notes?: string | null
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "evaluations_evaluator_id_fkey"
            columns: ["evaluator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evaluations_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      food_substitutions: {
        Row: {
          calories: number | null
          carbs_g: number | null
          fats_g: number | null
          food_name: string
          id: string
          meal_item_id: string
          protein_g: number | null
          quantity: number
          unit: string
        }
        Insert: {
          calories?: number | null
          carbs_g?: number | null
          fats_g?: number | null
          food_name: string
          id?: string
          meal_item_id: string
          protein_g?: number | null
          quantity: number
          unit?: string
        }
        Update: {
          calories?: number | null
          carbs_g?: number | null
          fats_g?: number | null
          food_name?: string
          id?: string
          meal_item_id?: string
          protein_g?: number | null
          quantity?: number
          unit?: string
        }
        Relationships: [
          {
            foreignKeyName: "food_substitutions_meal_item_id_fkey"
            columns: ["meal_item_id"]
            isOneToOne: false
            referencedRelation: "meal_items"
            referencedColumns: ["id"]
          },
        ]
      }
      meal_items: {
        Row: {
          calories: number | null
          carbs_g: number | null
          fats_g: number | null
          food_name: string
          id: string
          meal_id: string
          position: number
          protein_g: number | null
          quantity: number
          unit: string
        }
        Insert: {
          calories?: number | null
          carbs_g?: number | null
          fats_g?: number | null
          food_name: string
          id?: string
          meal_id: string
          position?: number
          protein_g?: number | null
          quantity: number
          unit?: string
        }
        Update: {
          calories?: number | null
          carbs_g?: number | null
          fats_g?: number | null
          food_name?: string
          id?: string
          meal_id?: string
          position?: number
          protein_g?: number | null
          quantity?: number
          unit?: string
        }
        Relationships: [
          {
            foreignKeyName: "meal_items_meal_id_fkey"
            columns: ["meal_id"]
            isOneToOne: false
            referencedRelation: "meals"
            referencedColumns: ["id"]
          },
        ]
      }
      meals: {
        Row: {
          diet_id: string
          id: string
          name: string
          notes: string | null
          position: number
          scheduled_time: string | null
        }
        Insert: {
          diet_id: string
          id?: string
          name: string
          notes?: string | null
          position?: number
          scheduled_time?: string | null
        }
        Update: {
          diet_id?: string
          id?: string
          name?: string
          notes?: string | null
          position?: number
          scheduled_time?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "meals_diet_id_fkey"
            columns: ["diet_id"]
            isOneToOne: false
            referencedRelation: "diets"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          body: string
          created_at: string
          id: string
          read_at: string | null
          recipient_id: string
          sender_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          read_at?: string | null
          recipient_id: string
          sender_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          read_at?: string | null
          recipient_id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string
          created_at: string
          id: string
          read_at: string | null
          title: string
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          read_at?: string | null
          title: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          read_at?: string | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount_cents: number
          created_at: string
          due_date: string
          external_reference: string | null
          id: string
          method: Database["public"]["Enums"]["payment_method"]
          paid_at: string | null
          plan_id: string
          status: Database["public"]["Enums"]["payment_status"]
          student_id: string
        }
        Insert: {
          amount_cents: number
          created_at?: string
          due_date: string
          external_reference?: string | null
          id?: string
          method: Database["public"]["Enums"]["payment_method"]
          paid_at?: string | null
          plan_id: string
          status?: Database["public"]["Enums"]["payment_status"]
          student_id: string
        }
        Update: {
          amount_cents?: number
          created_at?: string
          due_date?: string
          external_reference?: string | null
          id?: string
          method?: Database["public"]["Enums"]["payment_method"]
          paid_at?: string | null
          plan_id?: string
          status?: Database["public"]["Enums"]["payment_status"]
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      plans: {
        Row: {
          active: boolean
          created_at: string
          duration_months: number
          id: string
          name: string
          price_cents: number
        }
        Insert: {
          active?: boolean
          created_at?: string
          duration_months: number
          id?: string
          name: string
          price_cents: number
        }
        Update: {
          active?: boolean
          created_at?: string
          duration_months?: number
          id?: string
          name?: string
          price_cents?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          birth_date: string | null
          created_at: string
          full_name: string
          id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          birth_date?: string | null
          created_at?: string
          full_name?: string
          id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          birth_date?: string | null
          created_at?: string
          full_name?: string
          id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      students: {
        Row: {
          available_equipment: string | null
          birth_date: string | null
          created_at: string
          dietary_restrictions: string | null
          email: string | null
          full_name: string | null
          goal: string | null
          height_cm: number | null
          id: string
          injuries: string | null
          medications: string | null
          notes: string | null
          occupation: string | null
          personal_id: string | null
          phone: string | null
          plan_expires_at: string | null
          plan_id: string | null
          restrictions: string | null
          sex: string | null
          sleep_hours: number | null
          sports_history: string | null
          start_date: string
          status: Database["public"]["Enums"]["student_status"]
          training_experience: string | null
          training_location: string | null
          updated_at: string
          user_id: string
          water_liters: number | null
          weekly_frequency: number | null
          weight_kg: number | null
        }
        Insert: {
          available_equipment?: string | null
          birth_date?: string | null
          created_at?: string
          dietary_restrictions?: string | null
          email?: string | null
          full_name?: string | null
          goal?: string | null
          height_cm?: number | null
          id?: string
          injuries?: string | null
          medications?: string | null
          notes?: string | null
          occupation?: string | null
          personal_id?: string | null
          phone?: string | null
          plan_expires_at?: string | null
          plan_id?: string | null
          restrictions?: string | null
          sex?: string | null
          sleep_hours?: number | null
          sports_history?: string | null
          start_date?: string
          status?: Database["public"]["Enums"]["student_status"]
          training_experience?: string | null
          training_location?: string | null
          updated_at?: string
          user_id: string
          water_liters?: number | null
          weekly_frequency?: number | null
          weight_kg?: number | null
        }
        Update: {
          available_equipment?: string | null
          birth_date?: string | null
          created_at?: string
          dietary_restrictions?: string | null
          email?: string | null
          full_name?: string | null
          goal?: string | null
          height_cm?: number | null
          id?: string
          injuries?: string | null
          medications?: string | null
          notes?: string | null
          occupation?: string | null
          personal_id?: string | null
          phone?: string | null
          plan_expires_at?: string | null
          plan_id?: string | null
          restrictions?: string | null
          sex?: string | null
          sleep_hours?: number | null
          sports_history?: string | null
          start_date?: string
          status?: Database["public"]["Enums"]["student_status"]
          training_experience?: string | null
          training_location?: string | null
          updated_at?: string
          user_id?: string
          water_liters?: number | null
          weekly_frequency?: number | null
          weight_kg?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "students_personal_id_fkey"
            columns: ["personal_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "students_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "students_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_exercises: {
        Row: {
          advanced_method: string | null
          id: string
          instructions: string | null
          muscle_group: string | null
          name: string
          position: number
          reps: string
          rest_seconds: number
          sets: number
          target_load: number | null
          target_rpe: number | null
          workout_id: string
        }
        Insert: {
          advanced_method?: string | null
          id?: string
          instructions?: string | null
          muscle_group?: string | null
          name: string
          position?: number
          reps?: string
          rest_seconds?: number
          sets?: number
          target_load?: number | null
          target_rpe?: number | null
          workout_id: string
        }
        Update: {
          advanced_method?: string | null
          id?: string
          instructions?: string | null
          muscle_group?: string | null
          name?: string
          position?: number
          reps?: string
          rest_seconds?: number
          sets?: number
          target_load?: number | null
          target_rpe?: number | null
          workout_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workout_exercises_workout_id_fkey"
            columns: ["workout_id"]
            isOneToOne: false
            referencedRelation: "workouts"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_logs: {
        Row: {
          completed: boolean
          exercise_id: string | null
          id: string
          load: number | null
          notes: string | null
          performed_at: string
          reps: number | null
          rpe: number | null
          set_number: number
          student_id: string
          workout_id: string
        }
        Insert: {
          completed?: boolean
          exercise_id?: string | null
          id?: string
          load?: number | null
          notes?: string | null
          performed_at?: string
          reps?: number | null
          rpe?: number | null
          set_number?: number
          student_id: string
          workout_id: string
        }
        Update: {
          completed?: boolean
          exercise_id?: string | null
          id?: string
          load?: number | null
          notes?: string | null
          performed_at?: string
          reps?: number | null
          rpe?: number | null
          set_number?: number
          student_id?: string
          workout_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workout_logs_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "workout_exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_logs_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_logs_workout_id_fkey"
            columns: ["workout_id"]
            isOneToOne: false
            referencedRelation: "workouts"
            referencedColumns: ["id"]
          },
        ]
      }
      workouts: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          personal_id: string
          status: Database["public"]["Enums"]["record_status"]
          student_id: string
          updated_at: string
          weekday: number | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          personal_id: string
          status?: Database["public"]["Enums"]["record_status"]
          student_id: string
          updated_at?: string
          weekday?: number | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          personal_id?: string
          status?: Database["public"]["Enums"]["record_status"]
          student_id?: string
          updated_at?: string
          weekday?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "workouts_personal_id_fkey"
            columns: ["personal_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workouts_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      assign_user_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: undefined
      }
      create_student_record: {
        Args: { _student: Json }
        Returns: {
          available_equipment: string | null
          birth_date: string | null
          created_at: string
          dietary_restrictions: string | null
          email: string | null
          full_name: string | null
          goal: string | null
          height_cm: number | null
          id: string
          injuries: string | null
          medications: string | null
          notes: string | null
          occupation: string | null
          personal_id: string | null
          phone: string | null
          plan_expires_at: string | null
          plan_id: string | null
          restrictions: string | null
          sex: string | null
          sleep_hours: number | null
          sports_history: string | null
          start_date: string
          status: Database["public"]["Enums"]["student_status"]
          training_experience: string | null
          training_location: string | null
          updated_at: string
          user_id: string
          water_liters: number | null
          weekly_frequency: number | null
          weight_kg: number | null
        }
        SetofOptions: {
          from: "*"
          to: "students"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      ensure_my_profile: {
        Args: { _full_name?: string }
        Returns: {
          avatar_url: string | null
          birth_date: string | null
          created_at: string
          full_name: string
          id: string
          phone: string | null
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "profiles"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "personal" | "aluno"
      checkin_status: "pendente" | "respondido" | "analisado"
      payment_method: "pix" | "cartao"
      payment_status: "pendente" | "pago" | "falhou" | "reembolsado"
      record_status: "rascunho" | "ativo" | "arquivado"
      student_status: "ativo" | "pausado" | "inativo"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["personal", "aluno"],
      checkin_status: ["pendente", "respondido", "analisado"],
      payment_method: ["pix", "cartao"],
      payment_status: ["pendente", "pago", "falhou", "reembolsado"],
      record_status: ["rascunho", "ativo", "arquivado"],
      student_status: ["ativo", "pausado", "inativo"],
    },
  },
} as const
