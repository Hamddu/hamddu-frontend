export type RootTabParamList = {
  Home: undefined;
  Counter: undefined;
  Community: undefined;
  MyPage: undefined;
};

export type HomeStackParamList = {
  TutorialList: undefined;
  TutorialVideo: { videoId: string; title: string; lessonIndex: number; contentId: string };
  UserProfile: { authorName: string };
};

export type CommunityStackParamList = {
  CommunityFeed: undefined;
  PostDetail: { postId: string };
  AddPost: undefined;
  UserProfile: { authorName: string };
};

export type CounterStackParamList = {
  CounterList: undefined;
  CounterDetail: { projectId: string };
};

export type ProfileStackParamList = {
  MyProfile: undefined;
};

export type SurveyStackParamList = {
  Survey: undefined;
  SurveyQuestions: undefined;
};
