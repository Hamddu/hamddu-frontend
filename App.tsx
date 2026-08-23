import React, { useEffect, useRef, useState } from "react";
import { Animated, Text, TouchableOpacity, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { DefaultTheme, NavigationContainer, getFocusedRouteNameFromRoute } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Provider as PaperProvider } from "react-native-paper";
import type { SvgProps } from "react-native-svg";
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { BlurView } from "expo-blur";
import { requireOptionalNativeModule } from "expo-modules-core";

import HomeActiveIcon from "./assets/tab-icons/home_active.svg";
import HomeDisabledIcon from "./assets/tab-icons/home_disabled.svg";
import CounterActiveIcon from "./assets/tab-icons/counter_active.svg";
import CounterDisabledIcon from "./assets/tab-icons/counter_disabled.svg";
import CommunityActiveIcon from "./assets/tab-icons/community.svg";
import CommunityDisabledIcon from "./assets/tab-icons/community_disabled.svg";
import MyActiveIcon from "./assets/tab-icons/my_active.svg";
import MyDisabledIcon from "./assets/tab-icons/my_disabled.svg";
import HomeScreen from "./src/screens/HomeScreen";
import TutorialVideoScreen from "./src/screens/TutorialVideoScreen";
import CounterScreen from "./src/screens/CounterScreen";
import CommunityScreen from "./src/screens/CommunityScreen";
import ProfileScreen from "./src/screens/ProfileScreen";
import PostDetailScreen from "./src/screens/PostDetailScreen";
import ChallengeDetailScreen from "./src/screens/ChallengeDetailScreen";
import AddPostScreen from "./src/screens/AddPostScreen";
import LoginScreen from "./src/screens/LoginScreen";
import SurveyScreen from "./src/screens/SurveyScreen";
import SurveyQuestionsScreen from "./src/screens/SurveyQuestionsScreen";
import SplashScreen from "./src/screens/SplashScreen";

import { useAuthStore } from "./src/store/authStore";
import { registerForPushNotifications } from "./src/services/notifications";
import { useCounterStore } from "./src/store/counterStore";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const Tab = createBottomTabNavigator();
const HomeStack = createNativeStackNavigator();
const CommunityStack = createNativeStackNavigator();
const ProfileStack = createNativeStackNavigator();
const SurveyStack = createNativeStackNavigator();
const RootStack = createNativeStackNavigator();

const PRIMARY = "#FF7325";
const INK3 = "#8A8A8A";
const WHITE = "#FFFFFF";
const NATIVE_BLUR_AVAILABLE = !!requireOptionalNativeModule("ExpoBlur");

function TabIcon({
  focused,
  ActiveIcon,
  DisabledIcon,
}: {
  focused: boolean;
  ActiveIcon: React.ComponentType<SvgProps>;
  DisabledIcon: React.ComponentType<SvgProps>;
}) {
  const progress = useRef(new Animated.Value(focused ? 1 : 0)).current;
  useEffect(() => {
    Animated.spring(progress, {
      toValue: focused ? 1 : 0,
      useNativeDriver: true,
      speed: 18,
      bounciness: 6,
    }).start();
  }, [focused, progress]);

  return (
    <Animated.View
      style={{
        transform: [
          {
            scale: progress.interpolate({
              inputRange: [0, 1],
              outputRange: [1, 1.04],
            }),
          },
        ],
      }}
    >
      <View style={{ width: 32, height: 32 }}>
        <Animated.View style={{ position: "absolute", opacity: progress }}>
          <ActiveIcon width={32} height={32} />
        </Animated.View>
        <Animated.View
          style={{
            position: "absolute",
            opacity: progress.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }),
          }}
        >
          <DisabledIcon width={32} height={32} />
        </Animated.View>
      </View>
    </Animated.View>
  );
}

function HomeStackNavigator() {
  return (
    <HomeStack.Navigator>
      <HomeStack.Screen
        name="TutorialList"
        component={HomeScreen}
        options={{ headerShown: false, contentStyle: { backgroundColor: PRIMARY } }}
      />
      <HomeStack.Screen
        name="TutorialVideo"
        component={TutorialVideoScreen}
        options={{ headerShown: false, contentStyle: { backgroundColor: "#000" } }}
      />
    </HomeStack.Navigator>
  );
}

function HeaderBackButton({ onPress }: { onPress: () => void }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      hitSlop={{ top: 12, right: 12, bottom: 12, left: 12 }}
      accessibilityRole="button"
      accessibilityLabel="뒤로가기"
      style={{ width: 36, height: 36, alignItems: "center", justifyContent: "center" }}
    >
      <Ionicons name="chevron-back" size={25} color="#1A1A1A" />
    </TouchableOpacity>
  );
}

function CommunityHeader({ onBack }: { onBack: () => void }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={{ height: insets.top + 56, paddingTop: insets.top, backgroundColor: WHITE }}>
      <View style={{ height: 56, flexDirection: "row", alignItems: "center", paddingHorizontal: 14 }}>
        <HeaderBackButton onPress={onBack} />
      </View>
    </View>
  );
}

function CommunityStackNavigator() {
  return (
    <CommunityStack.Navigator
      screenOptions={({ navigation }) => ({
        header: () => <CommunityHeader onBack={navigation.goBack} />,
        contentStyle: { backgroundColor: WHITE },
      })}
    >
      <CommunityStack.Screen
        name="CommunityFeed"
        component={CommunityScreen}
        options={{ headerShown: false }}
      />
      <CommunityStack.Screen
        name="PostDetail"
        component={PostDetailScreen}
      />
      <CommunityStack.Screen
        name="ChallengeDetail"
        component={ChallengeDetailScreen}
      />
      <CommunityStack.Screen
        name="AddPost"
        component={AddPostScreen}
        options={{ headerShown: false }}
      />
    </CommunityStack.Navigator>
  );
}

function ProfileStackNavigator() {
  return (
    <ProfileStack.Navigator
      screenOptions={({ navigation }) => ({
        header: () => <CommunityHeader onBack={navigation.goBack} />,
        contentStyle: { backgroundColor: WHITE },
      })}
    >
      <ProfileStack.Screen
        name="MyProfile"
        component={ProfileScreen}
        options={{ headerShown: false }}
      />
      <ProfileStack.Screen
        name="ChallengeDetail"
        component={ChallengeDetailScreen}
      />
    </ProfileStack.Navigator>
  );
}

function FloatingTabBackground() {
  return (
    <View style={{ flex: 1, borderRadius: 38, overflow: "hidden" }}>
      {NATIVE_BLUR_AVAILABLE && (
        <BlurView
          intensity={72}
          tint="light"
          style={{ position: "absolute", top: 0, right: 0, bottom: 0, left: 0 }}
        />
      )}
      <View
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          bottom: 0,
          left: 0,
          backgroundColor: NATIVE_BLUR_AVAILABLE
            ? "rgba(248,248,248,0.48)"
            : "rgba(248,248,248,0.84)",
        }}
      />
    </View>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      detachInactiveScreens={false}
      screenOptions={({ route }) => {
        const nestedRoute = getFocusedRouteNameFromRoute(route);
        const hideTabBar =
          (route.name === "Home" && nestedRoute === "TutorialVideo") ||
          (route.name === "Community" && !!nestedRoute && nestedRoute !== "CommunityFeed") ||
          (route.name === "MyPage" && !!nestedRoute && nestedRoute !== "MyProfile");

        return {
        lazy: false,
        sceneStyle: { backgroundColor: WHITE },
        tabBarActiveTintColor: PRIMARY,
        tabBarInactiveTintColor: INK3,
        tabBarStyle: hideTabBar ? { display: "none" } : {
          position: "absolute",
          start: 20,
          end: 20,
          width: undefined,
          bottom: 20,
          height: 78,
          paddingHorizontal: 5,
          paddingTop: 7,
          paddingBottom: 7,
          borderRadius: 38,
          borderTopWidth: 1,
          borderWidth: 1,
          borderColor: "rgba(255,255,255,0.72)",
          backgroundColor: "transparent",
          shadowColor: "#101114",
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: 0.14,
          shadowRadius: 22,
          elevation: 12,
        },
        tabBarBackground: () => <FloatingTabBackground />,
        tabBarItemStyle: {
          marginHorizontal: 4,
          borderRadius: 32,
          overflow: "hidden",
        },
        tabBarActiveBackgroundColor: "rgba(255,255,255,0.8)",
        tabBarIconStyle: {
          marginTop: 6,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "700",
          lineHeight: 14,
          marginBottom: 0,
        },
        tabBarHideOnKeyboard: true,
        headerShown: false,
        };
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeStackNavigator}
        options={{
          tabBarLabel: "홈",
          tabBarIcon: ({ focused }) => (
            <TabIcon
              focused={focused}
              ActiveIcon={HomeActiveIcon}
              DisabledIcon={HomeDisabledIcon}
            />
          ),
        }}
      />
      <Tab.Screen
        name="Counter"
        component={CounterScreen}
        options={{
          tabBarLabel: "코카운터",
          headerShown: false,
          tabBarIcon: ({ focused }) => (
            <TabIcon
              focused={focused}
              ActiveIcon={CounterActiveIcon}
              DisabledIcon={CounterDisabledIcon}
            />
          ),
        }}
      />
      <Tab.Screen
        name="Community"
        component={CommunityStackNavigator}
        options={{
          tabBarLabel: "커뮤니티",
          tabBarIcon: ({ focused }) => (
            <TabIcon
              focused={focused}
              ActiveIcon={CommunityActiveIcon}
              DisabledIcon={CommunityDisabledIcon}
            />
          ),
        }}
      />
      <Tab.Screen
        name="MyPage"
        component={ProfileStackNavigator}
        options={{
          tabBarLabel: "마이",
          headerShown: false,
          tabBarIcon: ({ focused }) => (
            <TabIcon
              focused={focused}
              ActiveIcon={MyActiveIcon}
              DisabledIcon={MyDisabledIcon}
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

function AppInitializer({ children }: { children: React.ReactNode }) {
  const accessToken = useAuthStore((s) => s.accessToken);
  const clearProjects = useCounterStore((s) => s.clearProjects);
  const queryClient = useQueryClient();
  const previousToken = useRef(accessToken);

  useEffect(() => {
    if (previousToken.current && !accessToken) {
      clearProjects();
      queryClient.clear();
    }
    previousToken.current = accessToken;
  }, [accessToken, clearProjects, queryClient]);

  useEffect(() => {
    if (!accessToken) return;

    let cleanup: (() => void) | undefined;
    registerForPushNotifications()
      .then((unsubscribe) => {
        cleanup = unsubscribe;
      })
      .catch((error) => console.warn("Failed to register push notifications", error));

    return () => cleanup?.();
  }, [accessToken]);

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
  const [hydrated, setHydrated] = useState(useAuthStore.persist.hasHydrated());
  const [splashDone, setSplashDone] = useState(false);
  const accessToken = useAuthStore((s) => s.accessToken);
  const surveyRequired = useAuthStore((s) => s.surveyRequired);

  useEffect(() => {
    const unsubscribe = useAuthStore.persist.onFinishHydration(() => setHydrated(true));
    if (useAuthStore.persist.hasHydrated()) setHydrated(true);
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const splashTimer = setTimeout(() => setSplashDone(true), 3000);
    return () => clearTimeout(splashTimer);
  }, [hydrated]);

  if (!hydrated || !splashDone) return <SplashScreen />;

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

const navigationTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: WHITE,
    card: WHITE,
  },
};

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <PaperProvider>
        <NavigationContainer theme={navigationTheme}>
          <AppInitializer>
            <RootNavigator />
          </AppInitializer>
        </NavigationContainer>
      </PaperProvider>
    </QueryClientProvider>
  );
}
