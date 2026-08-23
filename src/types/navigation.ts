import type { NavigatorScreenParams } from "@react-navigation/native";

export type RootTabParamList = {
  Home: undefined;
  Counter: undefined;
  Community: NavigatorScreenParams<CommunityStackParamList> | undefined;
  MyPage: NavigatorScreenParams<ProfileStackParamList> | undefined;
};

export type HomeStackParamList = {
  TutorialList: undefined;
  TutorialVideo: {
    videoId: string;
    title: string;
    lessonIndex: number;
    contentId: string;
    lastWatchedTimestamp?: string;
    alreadyWatched?: boolean;
    alreadyCertified?: boolean;
  };
};

export type CommunityStackParamList = {
  CommunityFeed: undefined;
  PostDetail: { postId: string };
  ChallengeDetail: { challengeId: string };
  AddPost: { postId?: string } | undefined;
};

export type CounterStackParamList = {
  CounterList: undefined;
  CounterDetail: { projectId: string };
};

export type ProfileStackParamList = {
  MyProfile: undefined;
  ChallengeDetail: { challengeId: string };
};

export type SurveyStackParamList = {
  Survey: undefined;
  SurveyQuestions: undefined;
};
