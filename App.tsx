import React, { useEffect, useRef } from "react";
import { Animated, Text, TouchableOpacity, Vibration } from "react-native";
import { NavigationContainer, getFocusedRouteNameFromRoute } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Provider as PaperProvider } from "react-native-paper";
import type { SvgProps } from "react-native-svg";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

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

import { useAuthStore } from "./src/store/authStore";
import { useXpLevelDetection } from "./src/hooks/useXpLevelUp";
import { registerForPushNotifications } from "./src/services/notifications";

const Tab = createBottomTabNavigator();
const HomeStack = createNativeStackNavigator();
const CommunityStack = createNativeStackNavigator();
const SurveyStack = createNativeStackNavigator();
const RootStack = createNativeStackNavigator();

const PRIMARY = "#FF7325";
const CREAM = "#FFF8F2";
const CREAM_LINE = "#EFE6DF";
const INK3 = "#8A8A8A";
const WHITE = "#FFFFFF";
const WHITE_LINE = "#ECECEC";
const BASE_TAB_BAR_STYLE = {
  elevation: 8,
  shadowColor: "#000",
  shadowOffset: { width: 0, height: -2 },
  shadowOpacity: 0.06,
  shadowRadius: 8,
  height: 70,
  paddingTop: 8,
  paddingBottom: 8,
} as const;

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
  const Icon = focused ? ActiveIcon : DisabledIcon;

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
            translateY: progress.interpolate({
              inputRange: [0, 1],
              outputRange: [0, -2],
            }),
          },
          {
            scale: progress.interpolate({
              inputRange: [0, 1],
              outputRange: [1, 1.08],
            }),
          },
        ],
      }}
    >
      <Icon width={32} height={32} />
    </Animated.View>
  );
}

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

function HeaderBackButton({ onPress }: { onPress: () => void }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      hitSlop={{ top: 12, right: 12, bottom: 12, left: 12 }}
      accessibilityRole="button"
      accessibilityLabel="뒤로가기"
      style={{ width: 36, height: 36, justifyContent: "center" }}
    >
      <Text style={{ color: "#1A1A1A", fontSize: 30, lineHeight: 34 }}>‹</Text>
    </TouchableOpacity>
  );
}

function CommunityStackNavigator() {
  return (
    <CommunityStack.Navigator
      screenOptions={({ navigation }) => ({
        headerBackVisible: false,
        headerLeft: () => <HeaderBackButton onPress={navigation.goBack} />,
        headerStyle: { backgroundColor: "#fff" },
        headerTintColor: "#1A1A1A",
        headerTitleStyle: { fontWeight: "800" },
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
        options={{ headerTitle: "게시물" }}
      />
      <CommunityStack.Screen
        name="ChallengeDetail"
        component={ChallengeDetailScreen}
        options={{ headerTitle: "인증 게시글" }}
      />
      <CommunityStack.Screen
        name="AddPost"
        component={AddPostScreen}
        options={{ headerTitle: "작품 등록" }}
      />
    </CommunityStack.Navigator>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => {
        const focusedRouteName = getFocusedRouteNameFromRoute(route);
        const isHomeMain =
          route.name === "Home" &&
          (!focusedRouteName || focusedRouteName === "TutorialList");
        const tabBackgroundColor = isHomeMain ? CREAM : WHITE;

        return {
        tabBarActiveTintColor: PRIMARY,
        tabBarInactiveTintColor: INK3,
        tabBarStyle: {
          ...BASE_TAB_BAR_STYLE,
          backgroundColor: tabBackgroundColor,
          borderTopWidth: 1,
          borderTopColor: isHomeMain ? CREAM_LINE : WHITE_LINE,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
          marginBottom: 0,
        },
        tabBarHideOnKeyboard: true,
        headerShown: false,
      };
      }}
      screenListeners={{
        tabPress: () => Vibration.vibrate(10),
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
        component={ProfileScreen}
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
  useXpLevelDetection();
  const accessToken = useAuthStore((s) => s.accessToken);

  useEffect(() => {
    if (!accessToken) return;

    registerForPushNotifications().catch((error) => {
      console.warn("Failed to register push notifications", error);
    });
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
