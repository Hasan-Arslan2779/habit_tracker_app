import React, { useContext, useEffect, useState } from "react";
import { StyleSheet } from "react-native";
import { ID, Models } from "react-native-appwrite";
import { account } from "./appwrite";

type AuthContextType = {
  user: Models.User<Models.Preferences> | null;
  isLoadingUser: boolean;
  signUp: (email: string, password: string) => Promise<string | null>;
  signIn: (email: string, password: string) => Promise<string | null>;
  signOut?: () => Promise<void>;
};

// Create a context with a default value
const AuthContext = React.createContext<AuthContextType | undefined>(undefined);

// Custom hook to use the AuthContext
export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<Models.User<Models.Preferences> | null>(
    null
  );

  const [isLoadingUser, setIsLoadingUser] = useState<boolean>(true);

  useEffect(() => {
    // Fetch the user session when the component mounts
    getUser();
  }, []);

  // Function to get the user session
  const getUser = async () => {
    try {
      const session = await account.get();
      setUser(session);
    } catch (error) {
      setUser(null);
    } finally {
      setIsLoadingUser(false); // Set loading to false after fetching user
    }
  };
  //signUp function to create a new user
  const signUp = async (email: string, password: string) => {
    try {
      await account.create(ID.unique(), email, password);
      await signIn(email, password); // Automatically sign in after sign up
      return null; // Return null on successful sign up
    } catch (error) {
      if (error instanceof Error) {
        console.error("Sign Up Error:", error.message);
        return error.message; // Return the error message for handling in the component
      }
      return "An unexpected error occurred during sign up.";
    }
  };
  // signIn function to authenticate the user
  const signIn = async (email: string, password: string) => {
    try {
      await account.createEmailPasswordSession(email, password);
      const session = await account.get();
      setUser(session); //Set the user state on successful sign in
      return null; // Return null on successful sign in
    } catch (error) {
      if (error instanceof Error) {
        console.error("Sign ın Error:", error.message);
        return error.message; // Return the error message for handling in the component
      }
      return "An unexpected error occurred during sign in.";
    }
  };

  // signOut function to log out the user
  const signOut = async () => {
    try {
      await account.deleteSession("current");
      setUser(null); // Clear the user state on sign out
    } catch (error) {
      console.error("Sign Out Error:", error);
    }
  };
  return (
    <AuthContext.Provider
      value={{
        isLoadingUser,
        user,
        signUp,
        signIn,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

const styles = StyleSheet.create({});
