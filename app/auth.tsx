import { useAuth } from "@/lib/auth-context";
import React, { useState } from "react";
import { KeyboardAvoidingView, Platform, StyleSheet, View } from "react-native";
import { Button, Text, TextInput, useTheme } from "react-native-paper";
const AuthScreen = () => {
  const [isSignUp, setIsSignUp] = useState<boolean>(false);
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [error, setError] = useState<string | null>("");
  // Import necessary components and hooks

  // Use the theme from react-native-paper
  const theme = useTheme();
  // Import the signUp and signIn functions from the auth context
  const { signUp, signIn } = useAuth();

  const handleAuth = async () => {
    if (!email || !password) {
      setError("Please fill in all fields !");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters long !");
      return;
    }
    setError(null);
    if (isSignUp) {
      const error = await signUp(email, password);
      if (error) {
        setError(error);
        return;
      }
    } else {
      const error = await signIn(email, password);
      if (error) {
        setError(error);
        return;
      }
    }
  };
  const handleSwitch = () => {
    setIsSignUp((prev) => !prev);
  };
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <View style={styles.content}>
        <Text style={styles.title} variant="headlineMedium">
          {isSignUp ? "Create Account" : "Welcome Back"}
        </Text>
        <TextInput
          style={styles.input}
          aria-label="Email"
          placeholder="example@gmail.com"
          autoCapitalize="none"
          keyboardType="email-address"
          mode="outlined"
          onChangeText={setEmail}
        />
        <TextInput
          style={styles.input}
          aria-label="password"
          placeholder="enter your password"
          autoCapitalize="none"
          mode="outlined"
          secureTextEntry
          onChangeText={setPassword}
        />
        {error && <Text style={{ color: theme.colors.error }}>{error}</Text>}
        <Button style={styles.button} mode="contained" onPress={handleAuth}>
          {isSignUp ? "Sign Up" : "Sign In"}
        </Button>
        <Button
          style={styles.switchModeButton}
          mode="text"
          onPress={handleSwitch}
        >
          {isSignUp
            ? "Already have an account? Sign In"
            : "Don't have an account? Sign Up"}
        </Button>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  content: {
    flex: 1,
    padding: 16,
    justifyContent: "center",
  },
  title: {
    textAlign: "center",
    marginBottom: 24,
  },
  input: {
    marginBottom: 16,
  },
  button: {
    marginTop: 8,
  },
  switchModeButton: {
    marginTop: 16,
  },
});

export default AuthScreen;
