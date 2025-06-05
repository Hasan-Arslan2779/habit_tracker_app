import { Models } from "react-native-appwrite";

export interface Habit extends Models.Document {
  user_id: string;
  title: string;
  description?: string;
  frequency: string; // e.g., "daily", "weekly", "monthly"
  streak_count: number; // Number of consecutive days the habit has been completed
  last_completed?: string; // ISO date string of the last completion
  created_at: string; // ISO date string of when the habit was created
}

export interface HabitsCompletion extends Models.Document {
  habit_id: string; // Reference to the Habit document
  user_id: string; // Reference to the User document
  completed_at: string; // ISO date string of when the habit was completed
}
