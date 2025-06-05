import { DATABASE_ID, databases, HABITS_COLLECTION_ID } from "@/lib/appwrite";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "expo-router";
import React from "react";
import { StyleSheet, View } from "react-native";
import { ID } from "react-native-appwrite";
import {
  Button,
  SegmentedButtons,
  Text,
  TextInput,
  useTheme,
} from "react-native-paper";

const FREQUENCIES = ["daily", "weekly", "monthly"];
type Frequency = (typeof FREQUENCIES)[number];
const AddHabitScreen = () => {
  //
  const [title, setTitle] = React.useState<string>("");
  const [description, setDescription] = React.useState<string>("");
  const [frequency, setFrequency] = React.useState<Frequency>("daily");
  const [error, setError] = React.useState<string>("");
  const { user } = useAuth();
  const router = useRouter();
  const theme = useTheme();

  // Function to handle the submission of the habit
  const handleSubmit = async () => {
    if (!user) return;
    try {
      await databases.createDocument(
        DATABASE_ID,
        HABITS_COLLECTION_ID,
        ID.unique(),
        {
          user_id: user.$id,
          title,
          description,
          frequency,
          streak_count: 0,
          last_completed: new Date().toISOString(),
          created_at: new Date().toISOString(),
        }
      );
      router.back();
      setTitle("");
      setDescription("");
      setFrequency("daily");
      setError("");
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
        return;
      }
      setError("An unexpected error occurred while adding the habit.");
    }
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        label={"Title"}
        mode="outlined"
        onChangeText={setTitle}
        value={title}
      />
      <TextInput
        style={styles.input}
        label={"Description"}
        mode="outlined"
        onChangeText={setDescription}
        value={description}
      />
      <View style={styles.frequencyContainer}>
        <SegmentedButtons
          value={frequency}
          onValueChange={(value) => setFrequency(value as Frequency)}
          buttons={FREQUENCIES.map((frequency) => ({
            value: frequency,
            label: frequency.charAt(0).toUpperCase() + frequency.slice(1),
          }))}
        />
      </View>
      <Button
        mode="contained"
        onPress={handleSubmit}
        disabled={!title || !description}
      >
        Add Habit
      </Button>
      {error && <Text style={{ color: theme.colors.error }}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#f5f5f5",
    justifyContent: "center",
  },
  input: {
    marginBottom: 16,
  },
  frequencyContainer: {
    marginBottom: 24,
  },
});

export default AddHabitScreen;
