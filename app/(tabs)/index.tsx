import {
  client,
  COMPLETİONS_COLLECTION_ID,
  DATABASE_ID,
  databases,
  HABITS_COLLECTION_ID,
  RealTimeResponse,
} from "@/lib/appwrite";
import { useAuth } from "@/lib/auth-context";
import { Habit, HabitsCompletion } from "@/types/database.type";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useEffect, useRef, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { ID, Query } from "react-native-appwrite";
import { Swipeable } from "react-native-gesture-handler";
import { Button, Surface, Text } from "react-native-paper";

export default function Index() {
  const { signOut, user } = useAuth();
  const [habits, setHabits] = useState<Habit[]>();
  const [completedHabits, setCompletedHabits] = useState<string[]>();
  const swipeableRefs = useRef<{ [key: string]: Swipeable | null }>({});

  // Subscribe to habits collection changes
  // and fetch habits when the component mounts
  // and when the user changes
  // This will ensure that we always have the latest habits
  // and that we can react to changes in real-time
  // and also fetch today completions
  useEffect(() => {
    if (user) {
      const habitsChanel = `databases.${DATABASE_ID}.collections.${HABITS_COLLECTION_ID}.documents`;
      const habitsSubscription = client.subscribe(
        habitsChanel,
        (response: RealTimeResponse) => {
          if (
            response.events.includes(
              "databases.*.collections.*.documents.*.create"
            ) ||
            response.events.includes(
              "databases.*.collections.*.documents.*.update"
            ) ||
            response.events.includes(
              "databases.*.collections.*.documents.*.delete"
            )
          ) {
            // If the event is related to habits, fetch the updated habits
            fetchHabits();
            fetchTodayCompletions();
          }
        }
      );

      const complationsChanel = `databases.${DATABASE_ID}.collections.$
      {COMPLETİONS_COLLECTION_ID}.documents`;
      const completionsSubscription = client.subscribe(
        complationsChanel,
        (response: RealTimeResponse) => {
          if (
            response.events.includes(
              "databases.*.collections.*.documents.*.create"
            )
          ) {
            // If the event is related to habits, fetch the updated habits
            fetchTodayCompletions();
          }
        }
      );

      fetchHabits();
      fetchTodayCompletions();

      return () => {
        // Unsubscribe from the habits collection changes
        habitsSubscription();
        completionsSubscription();
      };
    }
  }, [user]);

  //
  const fetchHabits = async () => {
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        HABITS_COLLECTION_ID,
        [Query.equal("user_id", user?.$id ?? "")]
      );

      setHabits(response.documents as Habit[]);
    } catch (error) {
      console.log("Error fetching habits:", error);
    }
  };

  // Fetch today completions
  const fetchTodayCompletions = async () => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Set to start of the day
      const response = await databases.listDocuments(
        DATABASE_ID,
        COMPLETİONS_COLLECTION_ID,
        [
          Query.equal("user_id", user?.$id ?? ""),
          Query.greaterThanEqual("completed_at", today.toISOString()),
        ]
      );
      const completions = response.documents as HabitsCompletion[];
      setCompletedHabits(completions.map((completion) => completion.habit_id));
    } catch (error) {
      console.log("Error fetching today's completions:", error);
      return [];
    }
  };

  // deleteHabit
  const deleteHabit = async (habitId: string) => {
    try {
      await databases.deleteDocument(
        DATABASE_ID,
        HABITS_COLLECTION_ID,
        habitId
      );
      // Close the swipeable action after deletion
      const swipeableRef = swipeableRefs.current[habitId];
      if (swipeableRef) {
        swipeableRef.close();
      }
    } catch (error) {
      console.log("Error deleting habit:", error);
    }
  };
  const completeHabit = async (habitId: string) => {
    if (!user || completedHabits?.includes(habitId)) return;
    try {
      await databases.createDocument(
        DATABASE_ID,
        COMPLETİONS_COLLECTION_ID,
        ID.unique(),
        {
          habit_id: habitId,
          user_id: user?.$id ?? "",
          completed_at: new Date().toISOString(),
        }
      );

      const habit = habits?.find((h) => h.$id === habitId);
      if (!habit) return;
      await databases.updateDocument(
        DATABASE_ID,
        HABITS_COLLECTION_ID,
        habitId,
        {
          streak_count: habit.streak_count + 1,
          last_completed: new Date().toISOString(),
        }
      );
    } catch (error) {
      console.log("Error completing habit:", error);
    }
  };

  const isHabitCompleted = (habitId: string) => {
    return completedHabits?.includes(habitId);
  };

  // renderRightActions
  const renderRightActions = (habitId: string) => (
    <View style={styles.swipeActionRight}>
      {isHabitCompleted(habitId) ? (
        <Text style={{ color: "white", fontWeight: "bold" }}>Completed!</Text>
      ) : (
        <MaterialCommunityIcons name="check-circle" size={32} color={"#ffff"} />
      )}
    </View>
  );

  // renderLeftActions

  const renderLeftActions = () => (
    <View style={styles.swipeActionLeft}>
      <MaterialCommunityIcons
        name="trash-can-outline"
        size={32}
        color={"#ffff"}
      />
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text variant="headlineSmall" style={styles.title}>
          Today's Habits
        </Text>
        <Button mode="text" onPress={signOut} icon={"logout"}>
          Sign Out
        </Button>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {habits?.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText} variant="bodyLarge">
              No habits yet. Add your first Habit
            </Text>
          </View>
        ) : (
          habits?.map((habit, key) => (
            <Swipeable
              key={key}
              ref={(ref) => (swipeableRefs.current[habit.$id] = ref)}
              overshootLeft={false}
              overshootRight={false}
              renderLeftActions={renderLeftActions}
              renderRightActions={() => renderRightActions(habit.$id)}
              onSwipeableOpen={(direction) => {
                if (direction === "left") {
                  deleteHabit(habit.$id);
                  const swipeableRef = swipeableRefs.current[habit.$id];
                  if (swipeableRef) {
                    swipeableRef?.close();
                  }
                } else if (direction === "right") {
                  completeHabit(habit.$id);
                  const swipeableRef = swipeableRefs.current[habit.$id];
                  if (swipeableRef) {
                    swipeableRef?.close();
                  }
                }
              }}
            >
              <Surface
                style={[
                  styles.card,
                  isHabitCompleted(habit.$id) && styles.cardCompleted,
                ]}
                elevation={0}
              >
                <View style={styles.cardContent}>
                  <Text style={styles.cardTitle}>{habit.title}</Text>
                  <Text style={styles.cardDescription}>
                    {habit.description}
                  </Text>
                  <View style={styles.cardFooter}>
                    <View style={styles.streakBadge}>
                      <MaterialCommunityIcons
                        name="fire"
                        size={18}
                        color={"#ff9800"}
                      />
                      <Text style={styles.streakText}>
                        {habit.streak_count} day streak
                      </Text>
                    </View>
                    <View style={styles.frequencyBadge}>
                      <Text style={styles.frequencyText}>
                        {habit.frequency.charAt(0).toUpperCase() +
                          habit.frequency.slice(1)}
                      </Text>
                    </View>
                  </View>
                </View>
              </Surface>
            </Swipeable>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#f5f5f5",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 25,
  },
  title: {
    fontWeight: "bold",
  },
  card: {
    marginBottom: 18,
    borderRadius: 18,
    backgroundColor: "#f7f2f2",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.8,
    shadowRadius: 2,
    elevation: 4,
  },
  cardCompleted: {
    opacity: 0.5,
    backgroundColor: "#e0f7fa",
    borderColor: "#b2ebf2",
    borderWidth: 1,
    borderRadius: 18,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
  },
  cardContent: {
    padding: 20,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 4,
    color: "#22223b",
  },
  cardDescription: {
    fontSize: 15,
    color: "#6c6c80",
    marginBottom: 16,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  streakBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffecb3",
    padding: 8,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    gap: 8,
  },
  streakText: {
    marginLeft: 6,
    fontSize: 14,
    color: "#ff9800",
    fontWeight: "bold",
  },
  frequencyBadge: {
    backgroundColor: "#ede7f6",
    padding: 8,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  frequencyText: {
    fontSize: 14,
    color: "#7c4dff",
    fontWeight: "bold",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyStateText: {
    color: "#666666",
    textAlign: "center",
    paddingHorizontal: 20,
    fontSize: 16,
    fontWeight: "500",
    marginTop: 20,
  },
  swipeActionRight: {
    backgroundColor: "#4caf50",
    justifyContent: "center",
    alignItems: "flex-end",
    flex: 1,
    borderRadius: 18,
    marginBottom: 18,
    marginTop: 2,
    paddingRight: 16,
  },
  swipeActionLeft: {
    backgroundColor: "#e53935",
    justifyContent: "center",
    alignItems: "flex-start",
    flex: 1,
    borderRadius: 18,
    marginBottom: 18,
    marginTop: 2,
    paddingLeft: 16,
  },
});
