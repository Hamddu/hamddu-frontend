export type RootTabParamList = {
  Home: undefined;
  AddPost: undefined;
  Profile: undefined;
};

export type HomeStackParamList = {
  HomeFeed: undefined;
  PostDetail: { postId: string };
  UserProfile: { authorName: string };
};

export type ProfileStackParamList = {
  MyProfile: undefined;
  PostDetail: { postId: string };
};
