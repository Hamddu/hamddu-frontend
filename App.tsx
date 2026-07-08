import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Provider as PaperProvider } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import HomeScreen from "./src/screens/HomeScreen";
import TutorialVideoScreen from "./src/screens/TutorialVideoScreen";
import CounterScreen from "./src/screens/CounterScreen";
import CommunityScreen from "./src/screens/CommunityScreen";
import ProfileScreen from "./src/screens/ProfileScreen";
import PostDetailScreen from "./src/screens/PostDetailScreen";
import AddPostScreen from "./src/screens/AddPostScreen";
import LoginScreen from "./src/screens/LoginScreen";
import SurveyScreen from "./src/screens/SurveyScreen";
import SurveyQuestionsScreen from "./src/screens/SurveyQuestionsScreen";

import { useAuthStore } from "./src/store/authStore";
import { useXpLevelDetection } from "./src/hooks/useXpLevelUp";

const Tab = createBottomTabNavigator();
const HomeStack = createNativeStackNavigator();
const CommunityStack = createNativeStackNavigator();
const SurveyStack = createNativeStackNavigator();
const RootStack = createNativeStackNavigator();

const PRIMARY = "#FF7325";
const INK3 = "#8A8A8A";

function HomeStackNavigator() {
  return (
    <HomeStack.Navigator>
      <HomeStack.Screen
        name="TutorialList"
        component={HomeScreen}
        options={{ headerShown: false }}
      />
      <HomeStack.Screen
        name="TutorialVideo"
        component={TutorialVideoScreen}
        options={{ headerShown: false }}
      />
    </HomeStack.Navigator>
  );
}

function CommunityStackNavigator() {
  return (
    <CommunityStack.Navigator>
      <CommunityStack.Screen
        name="CommunityFeed"
        component={CommunityScreen}
        options={{ headerShown: false }}
      />
      <CommunityStack.Screen
        name="PostDetail"
        component={PostDetailScreen}
        options={{ headerTitle: "게시물", headerStyle: { backgroundColor: "#fff" }, headerTintColor: "#1A1A1A", headerTitleStyle: { fontWeight: "800" } }}
      />
      <CommunityStack.Screen
        name="AddPost"
        component={AddPostScreen}
        options={{ headerTitle: "작품 등록", headerStyle: { backgroundColor: "#fff" }, headerTintColor: "#1A1A1A", headerTitleStyle: { fontWeight: "800" } }}
      />
    </CommunityStack.Navigator>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: PRIMARY,
        tabBarInactiveTintColor: INK3,
        tabBarStyle: {
          backgroundColor: "#FFFFFF",
          borderTopWidth: 1,
          borderTopColor: "#ECECEC",
          elevation: 8,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.06,
          shadowRadius: 8,
          height: 78,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
          marginBottom: 4,
        },
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeStackNavigator}
        options={{
          tabBarLabel: "홈",
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="home" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Counter"
        component={CounterScreen}
        options={{
          tabBarLabel: "코카운터",
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="counter" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Community"
        component={CommunityStackNavigator}
        options={{
          tabBarLabel: "커뮤니티",
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="forum" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="MyPage"
        component={ProfileScreen}
        options={{
          tabBarLabel: "마이",
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="account" color={color} size={size} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

function AppInitializer({ children }: { children: React.ReactNode }) {
  useXpLevelDetection();

  return <>{children}</>;
}

function SurveyStackNavigator() {
  return (
    <SurveyStack.Navigator screenOptions={{ headerShown: false }}>
      <SurveyStack.Screen name="Survey" component={SurveyScreen} />
      <SurveyStack.Screen name="SurveyQuestions" component={SurveyQuestionsScreen} />
    </SurveyStack.Navigator>
  );
}

function RootNavigator() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const surveyRequired = useAuthStore((s) => s.surveyRequired);
  return (
    <RootStack.Navigator screenOptions={{ headerShown: false }}>
      {!accessToken ? (
        <RootStack.Screen name="Login" component={LoginScreen} />
      ) : surveyRequired ? (
        <RootStack.Screen name="SurveyFlow" component={SurveyStackNavigator} />
      ) : (
        <RootStack.Screen name="Main" component={MainTabs} />
      )}
    </RootStack.Navigator>
  );
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 2, staleTime: 1000 * 60 * 5, gcTime: 1000 * 60 * 10 },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <PaperProvider>
        <NavigationContainer>
          <AppInitializer>
            <RootNavigator />
          </AppInitializer>
        </NavigationContainer>
      </PaperProvider>
    </QueryClientProvider>
  );
}
